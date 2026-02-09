#!/usr/bin/env node
// PreToolUse hook: inject per-tool reminders to keep agents focused and efficient
import { readStdin } from "./lib/stdin.mjs";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Per-tool contextual reminders
const TOOL_HINTS = {
  Bash: "Use parallel execution for independent tasks. Use run_in_background for long operations (npm install, builds, tests).",
  Read: "Read multiple files in parallel when possible for faster analysis.",
  Write: "Verify changes work after editing. Test functionality before marking complete.",
  Edit: "Verify changes work after editing. Test functionality before marking complete.",
  Glob: "Use specific patterns. Combine with Grep for content matching.",
  Grep: "Use output_mode: files_with_matches for discovery, content for analysis.",
  Task: null, // handled specially below
  TaskOutput: null, // handled specially below
};

function getTaskHint(data) {
  const parts = [];
  const toolInput = data.tool_input || {};

  // Agent spawn tracking
  if (data.tool_name === "Task") {
    const agentType = toolInput.subagent_type || "unknown";
    const model = toolInput.model || "inherit";
    const bg = toolInput.run_in_background ? " [BACKGROUND]" : "";
    const desc = toolInput.description || "";
    parts.push(`Spawning agent: ${agentType} (${model})${bg} | Task: ${desc}`);

    // Count active agents from state if available
    try {
      const stateDir = resolve(process.cwd(), ".forge");
      const uwState = resolve(stateDir, "ultrawork-state.json");
      if (existsSync(uwState)) {
        const state = JSON.parse(readFileSync(uwState, "utf8"));
        const active = (state.agents || []).filter(a => a.status === "running").length;
        if (active > 0) parts.push(`Active agents: ${active}`);
      }
    } catch {}
  }

  if (data.tool_name === "TaskOutput") {
    parts.push("The boulder never stops. Continue until all tasks complete.");
  }

  return parts.length ? parts.join(" | ") : null;
}

// Check for active execution mode
function getModeName() {
  try {
    const stateDir = resolve(process.cwd(), ".forge");
    for (const mode of ["autopilot", "ralph", "ultrawork", "ultrapilot", "ultraqa"]) {
      const f = resolve(stateDir, `${mode}-state.json`);
      if (existsSync(f)) {
        const state = JSON.parse(readFileSync(f, "utf8"));
        if (state.active || state.status === "running" || state.phase) return mode;
      }
    }
  } catch {}
  return null;
}

async function main() {
  try {
    const raw = await readStdin(3000);
    if (!raw) return out();
    const data = JSON.parse(raw);
    const toolName = data.tool_name || "";

    const parts = [];

    // Per-tool hint
    if (toolName in TOOL_HINTS) {
      const hint = TOOL_HINTS[toolName];
      if (hint) parts.push(hint);
    }

    // Special handling for Task/TaskOutput
    const taskHint = getTaskHint(data);
    if (taskHint) parts.push(taskHint);

    // Active mode reminder (keep agents on task)
    const mode = getModeName();
    if (mode && ["Task", "TaskOutput"].includes(toolName)) {
      // Don't add boulder reminder for every tool, just delegation-related ones
    }

    if (parts.length) return out(parts.join(" | "));
    return out();
  } catch {
    return out();
  }
}

function out(context) {
  const result = { continue: true };
  if (context) {
    result.hookSpecificOutput = {
      hookEventName: "PreToolUse",
      additionalContext: context,
    };
  }
  console.log(JSON.stringify(result));
}

main();
