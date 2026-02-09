#!/usr/bin/env node
// SessionStart hook: verify CLIs, check state, inject instructions
import { readStdin } from "./lib/stdin.mjs";
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";

function detectCli(name, paths) {
  for (const p of paths) {
    if (existsSync(p)) return { available: true, path: p };
  }
  // Also check PATH via which-like resolution
  const envPaths = (process.env.PATH || "").split(":");
  for (const dir of envPaths) {
    const p = join(dir, name);
    if (existsSync(p)) return { available: true, path: p };
  }
  return { available: false, path: null };
}

function loadConfig() {
  try {
    const configPath = resolve(homedir(), ".claude-forge", "config.json");
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, "utf8"));
    }
  } catch {}
  return {};
}

function checkActiveMode(stateDir) {
  const modes = ["autopilot", "ralph", "ultrawork", "ultrapilot", "ultraqa", "ecomode", "team", "pipeline"];
  for (const mode of modes) {
    try {
      const f = resolve(stateDir, `${mode}-state.json`);
      if (existsSync(f)) {
        const state = JSON.parse(readFileSync(f, "utf8"));
        if (state.active || state.status === "running" || state.phase) {
          return { mode, state };
        }
      }
    } catch {}
  }
  return null;
}

async function main() {
  try {
    await readStdin(2000); // consume stdin

    const codex = detectCli("codex", ["/usr/local/bin/codex", "/opt/homebrew/bin/codex"]);
    const gemini = detectCli("gemini", ["/opt/homebrew/bin/gemini", "/usr/local/bin/gemini"]);
    const config = loadConfig();

    const lines = ["claude-forge active."];

    // CLI status
    if (codex.available) {
      const model = config.codexModel ? ` (model: ${config.codexModel})` : "";
      lines.push(`Codex CLI ready${model} — backend delegation available.`);
    } else {
      lines.push("Codex CLI not found — /claude-forge:enable-codex after installing, or use /claude-forge:backend-agent for built-in fallback.");
    }

    if (gemini.available) {
      const model = config.geminiModel ? ` (model: ${config.geminiModel})` : "";
      lines.push(`Gemini CLI ready${model} — frontend delegation available.`);
    } else {
      lines.push("Gemini CLI not found — /claude-forge:enable-gemini after installing, or use /claude-forge:frontend-agent for built-in fallback.");
    }

    // Check for active mode from previous session
    const stateDir = resolve(process.cwd(), ".forge");
    const activeMode = checkActiveMode(stateDir);
    if (activeMode) {
      lines.push(`Resumable state detected: ${activeMode.mode} (phase: ${activeMode.state.phase || activeMode.state.iteration || "unknown"}). Run /claude-forge:${activeMode.mode} to resume or /claude-forge:cancel to clear.`);
    }

    // Ensure state directory exists
    try { mkdirSync(stateDir, { recursive: true }); } catch {}

    // Quick reference
    lines.push("Quick: /claude-forge:forge (auto-route), /claude-forge:autopilot (autonomous), /claude-forge:help (all skills).");

    console.log(JSON.stringify({
      continue: true,
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: lines.join(" "),
      },
    }));
  } catch {
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
