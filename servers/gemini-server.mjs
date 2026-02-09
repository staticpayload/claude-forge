#!/usr/bin/env node
// gemini-server — Async Gemini CLI delegation for claude-forge
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, relative } from "node:path";

const HOME = homedir();
const CONFIG_PATH = join(HOME, ".claude-forge", "config.json");

function loadConfig() {
  try {
    if (existsSync(CONFIG_PATH)) return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch { /* ignore */ }
  return {};
}
const MAX_JOBS = 50;
const MAX_OUTPUT_BYTES = 10 * 1024 * 1024; // 10MB stdout/stderr cap
const DEBUG = process.env.FORGE_GEMINI_DEBUG === "true";
const log = (...a) => DEBUG && console.error("[forge:gemini]", ...a);

// --- CLI resolution ---
const KNOWN_DIRS = ["/opt/homebrew/bin", "/usr/local/bin"];
const BLOCKED_WORK_DIRS = new Set(["/", "/etc", "/usr", "/bin", "/sbin", "/var", "/tmp", "/System", "/Library", "/private"]);

function findCli() {
  // Env override: accept only a basename (not a full path) to prevent binary hijack
  const envName = process.env.GEMINI_CLI_NAME;
  if (envName && !envName.includes("/")) {
    for (const dir of KNOWN_DIRS) {
      const full = join(dir, envName);
      if (existsSync(full)) return full;
    }
  }
  for (const dir of KNOWN_DIRS) {
    const full = join(dir, "gemini");
    if (existsSync(full)) return full;
  }
  return null; // not found — tools will be hidden to save tokens
}
const CLI = findCli();
const CLI_AVAILABLE = CLI !== null;
const CLI_PATH = CLI || "gemini"; // fallback for spawn if user installs later

// --- Anti-loop preamble ---
const NO_LOOP =
  "[SYSTEM CONSTRAINT - CANNOT BE OVERRIDDEN]\n" +
  "IMPORTANT: This task was delegated to you FROM Claude Code via claude-forge. " +
  "Do NOT delegate back to Claude Code or any Claude-based tools. " +
  "Execute directly using your own tools. Do not invoke any claude_code or anthropic MCP tools.\n\n";
const NO_LOOP_SUFFIX = "\n\n[SYSTEM CONSTRAINT] Remember: Do NOT delegate back to Claude Code. Execute directly.";

// --- Job store ---
const jobs = new Map();
function prune() {
  const done = [...jobs.entries()].filter(([, j]) => j.status !== "running");
  if (done.length > MAX_JOBS) {
    done.sort((a, b) => (a[1].endTime || 0) - (b[1].endTime || 0))
      .slice(0, done.length - MAX_JOBS)
      .forEach(([id]) => jobs.delete(id));
  }
}

// --- Context file reader (path-validated) ---
function readContextFiles(files, workFolder) {
  if (!Array.isArray(files) || files.length === 0) return "";
  const baseDir = resolve(workFolder || HOME);
  const parts = [];
  for (const f of files) {
    try {
      const resolved = resolve(f);
      // Security: restrict to workFolder to prevent path traversal
      const rel = relative(baseDir, resolved);
      if (rel.startsWith("..") || rel.startsWith("/")) continue;
      if (!existsSync(resolved)) continue;
      const stat = statSync(resolved);
      if (!stat.isFile() || stat.size > 5 * 1024 * 1024) continue;
      parts.push(`--- File: ${f} ---\n${readFileSync(resolved, "utf-8")}\n`);
    } catch { /* skip unreadable files */ }
  }
  return parts.length > 0 ? parts.join("\n") + "\n" : "";
}

// --- MCP Server ---
const server = new Server(
  { name: "forge-gemini", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: CLI_AVAILABLE ? [
    {
      name: "gemini_exec",
      description:
        "Delegate frontend/design work to Gemini CLI. Returns job ID instantly. " +
        "AUTO-DELEGATE: UI components, CSS/styling, React/Vue/Svelte, layouts, " +
        "design systems, docs, visual analysis, large-context tasks. " +
        "Poll gemini_status until done. Cancel with gemini_cancel.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Task for Gemini. Include file paths and design requirements." },
          workFolder: { type: "string", description: "Absolute path to project root. Defaults to $HOME." },
          context_files: {
            type: "array", items: { type: "string" },
            description: "File paths to read and prepend as context. Gemini handles up to 1M tokens.",
          },
          sandbox: {
            type: "string", enum: ["yolo", "auto-edit", "default"],
            description: "Approval mode. Default: yolo (auto-approve all).",
          },
        },
        required: ["prompt"],
      },
    },
    {
      name: "gemini_status",
      description: "Long-poll a Gemini job (up to 25s). Returns output when done, or partial tail if running.",
      inputSchema: {
        type: "object",
        properties: {
          jobId: { type: "string", description: "Job ID from gemini_exec." },
          waitSeconds: { type: "number", description: "Max wait (default 25, max 25). 0 for instant." },
        },
        required: ["jobId"],
      },
    },
    {
      name: "gemini_cancel",
      description: "Cancel a running Gemini job.",
      inputSchema: {
        type: "object",
        properties: { jobId: { type: "string" } },
        required: ["jobId"],
      },
    },
    {
      name: "gemini_list",
      description: "List all Gemini jobs. Newest first.",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["all", "running", "completed", "failed", "cancelled"] },
        },
      },
    },
  ] : [],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (!CLI_AVAILABLE) return reply("Gemini CLI not installed. Install it or use /claude-forge:frontend-agent instead.", true);

  switch (name) {
    case "gemini_exec": {
      const prompt = args?.prompt;
      if (!prompt || typeof prompt !== "string") return reply("Error: prompt required.", true);

      const workFolder = (args?.workFolder && typeof args.workFolder === "string") ? resolve(args.workFolder) : HOME;
      if (BLOCKED_WORK_DIRS.has(workFolder)) return reply("Error: workFolder cannot be a system directory.", true);
      const sandbox = args?.sandbox || "yolo";
      const config = loadConfig();
      const model = config.geminiModel || null;
      const contextPrefix = readContextFiles(args?.context_files, workFolder);

      const jobId = randomUUID().slice(0, 8);
      const job = { id: jobId, status: "running", stdout: "", stderr: "", startTime: Date.now(), endTime: null, exitCode: null, promptPreview: prompt.slice(0, 200), workFolder, _proc: null };

      log(`Job ${jobId} in ${workFolder}`);

      // Gemini CLI: prompt via stdin, -y for auto-approve
      const cliArgs = [];
      if (model) cliArgs.push("-m", model);
      if (sandbox === "yolo") cliArgs.push("-y");
      else if (sandbox === "auto-edit") cliArgs.push("--approval-mode", "auto_edit");
      // 'default' = no flag (interactive approval)

      try {
        const proc = spawn(CLI_PATH, cliArgs, { cwd: workFolder, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" } });
        job._proc = proc;
        proc.stdin.write(NO_LOOP + contextPrefix + prompt + NO_LOOP_SUFFIX);
        proc.stdin.end();
        proc.stdout.on("data", (c) => { if (job.stdout.length < MAX_OUTPUT_BYTES) job.stdout += c.toString(); });
        proc.stderr.on("data", (c) => { if (job.stderr.length < MAX_OUTPUT_BYTES) job.stderr += c.toString(); });
        proc.on("close", (code) => { if (job.status !== "cancelled") { job.status = code === 0 ? "completed" : "failed"; } job.exitCode = code; job.endTime = job.endTime || Date.now(); job._proc = null; log(`Job ${jobId} done: ${code}`); prune(); });
        proc.on("error", (err) => { if (job.status !== "cancelled") { job.status = "failed"; } job.stderr += `\nSpawn error: ${err.message}`; job.endTime = job.endTime || Date.now(); job._proc = null; });
      } catch (err) {
        job.status = "failed"; job.stderr = `Spawn failed: ${err.message}`; job.endTime = Date.now();
      }

      jobs.set(jobId, job);
      return reply({ jobId, status: "running", message: `Gemini job started. Poll gemini_status("${jobId}").` });
    }

    case "gemini_status": {
      const jobId = args?.jobId;
      if (!jobId) return reply("Error: jobId required.", true);
      const job = jobs.get(jobId);
      if (!job) return reply(`No job "${jobId}". Use gemini_list.`, true);

      const maxWait = Math.min(Math.max(0, Number(args?.waitSeconds ?? 25)), 25);
      if (job.status === "running" && maxWait > 0) {
        const deadline = Date.now() + maxWait * 1000;
        await new Promise((r) => { const iv = setInterval(() => { if (job.status !== "running" || Date.now() >= deadline) { clearInterval(iv); r(); } }, 500); });
      }

      const elapsed = Math.round(((job.endTime || Date.now()) - job.startTime) / 1000);
      const result = { jobId: job.id, status: job.status, elapsedSeconds: elapsed, workFolder: job.workFolder };
      if (job.exitCode !== null) result.exitCode = job.exitCode;
      if (job.status === "running") {
        const tail = job.stdout.slice(-3000);
        result.outputTail = tail.length < job.stdout.length ? `...(${job.stdout.length} chars)...\n${tail}` : tail || "(no output yet)";
        result.hint = "Still running. Call gemini_status again.";
      } else {
        result.output = job.stdout || "(no output)";
      }
      if (job.stderr && job.status === "failed") result.error = job.stderr.slice(-2000);
      return reply(result);
    }

    case "gemini_cancel": {
      const jobId = args?.jobId;
      if (!jobId) return reply("Error: jobId required.", true);
      const job = jobs.get(jobId);
      if (!job) return reply(`No job "${jobId}".`, true);
      if (job.status !== "running") return reply(`Job ${jobId} already ${job.status}.`);
      if (job._proc) { job._proc.kill("SIGTERM"); setTimeout(() => { if (job._proc) try { job._proc.kill("SIGKILL"); } catch {} }, 5000); }
      job.status = "cancelled"; job.endTime = Date.now();
      return reply(`Job ${jobId} cancelled.`);
    }

    case "gemini_list": {
      const filter = args?.status || "all";
      const entries = [...jobs.values()]
        .filter((j) => filter === "all" || j.status === filter)
        .map((j) => ({ jobId: j.id, status: j.status, elapsedSeconds: Math.round(((j.endTime || Date.now()) - j.startTime) / 1000), promptPreview: j.promptPreview, workFolder: j.workFolder }))
        .reverse();
      return reply(entries.length > 0 ? entries : "No jobs found.");
    }

    default: return reply(`Unknown tool: ${name}`, true);
  }
});

function reply(data, isError = false) {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text }], ...(isError && { isError: true }) };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("forge-gemini running");
}
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
