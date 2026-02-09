#!/usr/bin/env node
// SessionStart hook: verify CLI availability and inject instructions
import { readStdin } from "./lib/stdin.mjs";
import { existsSync } from "node:fs";

function detectCli(name, paths) {
  for (const p of paths) {
    if (existsSync(p)) return { available: true, path: p };
  }
  return { available: false, path: null };
}

async function main() {
  try {
    await readStdin(2000); // consume stdin

    const codex = detectCli("codex", ["/usr/local/bin/codex", "/opt/homebrew/bin/codex"]);
    const gemini = detectCli("gemini", ["/opt/homebrew/bin/gemini", "/usr/local/bin/gemini"]);

    const lines = ["claude-forge active."];
    if (codex.available) lines.push(`Codex CLI ready (${codex.path}) - backend delegation available.`);
    else lines.push("Codex CLI not found - backend delegation unavailable.");
    if (gemini.available) lines.push(`Gemini CLI ready (${gemini.path}) - frontend delegation available.`);
    else lines.push("Gemini CLI not found - frontend delegation unavailable.");

    if (codex.available || gemini.available) {
      lines.push("Use /claude-forge:forge to auto-route, /claude-forge:backend or /claude-forge:frontend for direct delegation, /claude-forge:review for parallel review.");
    }

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
