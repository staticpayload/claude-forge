#!/usr/bin/env node
/**
 * claude-forge HUD - Statusline for multi-CLI delegation
 *
 * Two-line display:
 *   Line 1: branch:<name> | model:<name>
 *   Line 2: [FORGE] | 5h:[bar]pct%(time) wk:[bar]pct%(time) | session:Xm | health | ~$cost | tokens | ctx:[bar]pct%
 *
 * Claude Code passes JSON on stdin:
 *   transcript_path, cwd, model, context_window
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { join, basename } from "node:path";
import { getUsage } from "./usage-api.mjs";

const HOME = homedir();
const CONFIG_PATH = join(HOME, ".claude-forge", "config.json");

// --- ANSI ---
const R = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";

// --- Stdin ---
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    const timer = setTimeout(() => resolve(data), 2000);
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => { data += chunk; });
    process.stdin.on("end", () => { clearTimeout(timer); resolve(data); });
    process.stdin.on("error", () => { clearTimeout(timer); resolve(""); });
  });
}

// --- Helpers ---
function detectCli(paths) {
  for (const p of paths) { if (existsSync(p)) return true; }
  return false;
}

function loadConfig() {
  try { if (existsSync(CONFIG_PATH)) return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")); } catch {}
  return {};
}

function gitBranch(cwd) {
  try { return execSync("git rev-parse --abbrev-ref HEAD 2>/dev/null", { cwd, encoding: "utf-8" }).trim() || null; } catch { return null; }
}

function bar(pct, width = 8) {
  const f = Math.round((pct / 100) * width);
  return "\u2588".repeat(f) + "\u2591".repeat(width - f);
}

function pctColor(pct) {
  return pct >= 90 ? RED : pct >= 70 ? YELLOW : GREEN;
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h${m % 60}m`;
}

function formatResetTime(date) {
  if (!date) return null;
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d${hrs % 24}h`;
  return `${hrs}h${mins % 60}m`;
}

function estimateTokens(path) {
  if (!path || !existsSync(path)) return null;
  try { return Math.round(statSync(path).size / 4); } catch { return null; }
}

function estimateCost(tokens) {
  if (!tokens) return null;
  // Rough estimate: mixed input/output at ~$15/MTok average
  return (tokens / 1_000_000) * 15;
}

// --- Parse forge jobs from transcript ---
function parseJobs(path) {
  const j = { codex: { active: 0, done: 0, fail: 0 }, gemini: { active: 0, done: 0, fail: 0 } };
  if (!path || !existsSync(path)) return j;
  try {
    const c = readFileSync(path, "utf-8");
    const ce = (c.match(/codex_exec/g) || []).length;
    const ge = (c.match(/gemini_exec/g) || []).length;
    const cd = (c.match(/"status"\s*:\s*"completed"[^}]*codex|codex[^}]*"status"\s*:\s*"completed"/g) || []).length;
    const gd = (c.match(/"status"\s*:\s*"completed"[^}]*gemini|gemini[^}]*"status"\s*:\s*"completed"/g) || []).length;
    const cf = (c.match(/"status"\s*:\s*"failed"[^}]*codex|codex[^}]*"status"\s*:\s*"failed"/g) || []).length;
    const gf = (c.match(/"status"\s*:\s*"failed"[^}]*gemini|gemini[^}]*"status"\s*:\s*"failed"/g) || []).length;
    j.codex = { active: Math.max(0, ce - cd - cf), done: cd, fail: cf };
    j.gemini = { active: Math.max(0, ge - gd - gf), done: gd, fail: gf };
  } catch {}
  return j;
}

// --- Main ---
async function main() {
  const raw = await readStdin();
  let stdin = {};
  try { stdin = JSON.parse(raw); } catch {}

  const cwd = stdin.cwd || process.cwd();
  const config = loadConfig();
  const hasCodex = detectCli(["/usr/local/bin/codex", "/opt/homebrew/bin/codex"]);
  const hasGemini = detectCli(["/opt/homebrew/bin/gemini", "/usr/local/bin/gemini"]);

  // --- Line 1: branch + model ---
  const l1 = [];
  const branch = gitBranch(cwd);
  if (branch) l1.push(`${DIM}branch:${R}${branch}`);
  if (stdin.model?.display_name) l1.push(`${DIM}model:${R}${stdin.model.display_name}`);

  // --- Line 2: main HUD ---
  const p = [];

  // [FORGE] label
  p.push(`${BOLD}${BLUE}[FORGE]${R}`);

  // Rate limits (5h + weekly) with visual bars
  const usage = await getUsage();
  if (usage) {
    const fh = Math.min(100, Math.max(0, Math.round(usage.fiveHourPercent)));
    const wk = Math.min(100, Math.max(0, Math.round(usage.weeklyPercent)));
    const fhc = pctColor(fh);
    const wkc = pctColor(wk);
    const fhReset = formatResetTime(usage.fiveHourResetsAt);
    const wkReset = formatResetTime(usage.weeklyResetsAt);

    let fhStr = `5h:[${fhc}${bar(fh)}${R}]${fhc}${fh}%${R}`;
    if (fhReset) fhStr += `${DIM}(${fhReset})${R}`;
    let wkStr = `wk:[${wkc}${bar(wk)}${R}]${wkc}${wk}%${R}`;
    if (wkReset) wkStr += `${DIM}(${wkReset})${R}`;
    p.push(`${fhStr} ${wkStr}`);
  }

  // CLI status
  const cxI = hasCodex ? `${GREEN}\u2713${R}` : `${RED}\u2717${R}`;
  const gmI = hasGemini ? `${GREEN}\u2713${R}` : `${RED}\u2717${R}`;
  p.push(`cx:${cxI} gm:${gmI}`);

  // Configured models
  const mParts = [];
  if (config.codexModel) mParts.push(`cx:${config.codexModel}`);
  if (config.geminiModel) mParts.push(`gm:${config.geminiModel}`);
  if (mParts.length > 0) p.push(`${CYAN}${mParts.join(" ")}${R}`);

  // Active jobs
  const jobs = parseJobs(stdin.transcript_path);
  const active = jobs.codex.active + jobs.gemini.active;
  const done = jobs.codex.done + jobs.gemini.done;
  const fail = jobs.codex.fail + jobs.gemini.fail;
  if (active + done + fail > 0) {
    const jp = [];
    if (active > 0) {
      const ap = [];
      if (jobs.codex.active > 0) ap.push(`cx:${jobs.codex.active}`);
      if (jobs.gemini.active > 0) ap.push(`gm:${jobs.gemini.active}`);
      jp.push(`${YELLOW}run:${ap.join("+")}${R}`);
    }
    if (done > 0) jp.push(`${GREEN}done:${done}${R}`);
    if (fail > 0) jp.push(`${RED}fail:${fail}${R}`);
    p.push(jp.join(" "));
  }

  // Session duration
  const elapsed = Date.now() - (stdin.context_window?.session_start_time || Date.now());
  if (elapsed > 10000) p.push(`${DIM}session:${formatDuration(elapsed)}${R}`);

  // Health emoji
  const ctxPct = stdin.context_window?.usage_percentage
    ? Math.round(stdin.context_window.usage_percentage) : null;
  const health = ctxPct != null && ctxPct > 85 ? "\uD83D\uDD34" : ctxPct != null && ctxPct > 70 ? "\uD83D\uDFE1" : "\uD83D\uDFE2";
  p.push(health);

  // Cost estimate
  const tokens = estimateTokens(stdin.transcript_path);
  const cost = estimateCost(tokens);
  if (cost != null) p.push(`${DIM}~$${cost.toFixed(4)}${R}`);

  // Token count
  if (tokens) {
    const display = tokens > 1000 ? `${(tokens / 1000).toFixed(1)}k` : `${tokens}`;
    p.push(`${DIM}${display}${R}`);
  }

  // Context bar
  if (ctxPct != null) {
    const cc = pctColor(ctxPct);
    p.push(`${DIM}ctx:${R}${cc}[${bar(ctxPct, 10)}]${ctxPct}%${R}`);
  }

  // Output
  const lines = [];
  if (l1.length > 0) lines.push("  " + l1.join(" | "));
  lines.push("  " + p.join(" | "));
  console.log(lines.join("\n"));
}

main();
