#!/usr/bin/env node
/**
 * Context Monitor Hook (PostToolUse)
 *
 * Monitors context window usage and warns before hitting limits.
 * Ported from OMC's preemptive-compaction hook.
 *
 * Lifecycle: Fires after every tool use. Tracks estimated token usage
 * and injects warnings at 75% (warning) and 90% (critical) thresholds.
 */

import { readStdin } from "./lib/stdin.mjs";

// Token estimation
const CHARS_PER_TOKEN = 4;
const MAX_CONTEXT_TOKENS = 200_000; // Claude's context window

// Thresholds
const WARNING_THRESHOLD = 0.75;
const CRITICAL_THRESHOLD = 0.90;

// Debounce
const RAPID_FIRE_MS = 500;
const COOLDOWN_MS = 30_000;
const MAX_WARNINGS = 5;

// Simple in-memory state (persisted via env for hook continuity)
const STATE_KEY = "FORGE_CONTEXT_MONITOR";

function getState() {
  try {
    const raw = process.env[STATE_KEY];
    if (raw) return JSON.parse(raw);
  } catch {}
  return { estimatedTokens: 0, lastWarningTime: 0, warningCount: 0, lastAnalysisTime: 0 };
}

// Large output tools that consume significant context
const LARGE_OUTPUT_TOOLS = new Set([
  "Read", "Grep", "Glob", "Bash", "WebFetch", "WebSearch", "Task", "TaskOutput",
]);

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(String(text).length / CHARS_PER_TOKEN);
}

const WARNING_MESSAGE = `[CONTEXT WARNING - 75% USED]
You are approaching the context window limit. To preserve session continuity:
1. Finish your current task before starting new ones
2. Avoid reading large files unless necessary
3. Use targeted searches (specific patterns) instead of broad reads
4. Consider summarizing findings before moving on
5. If doing multi-step work, prioritize the most critical remaining tasks`;

const CRITICAL_MESSAGE = `[CONTEXT CRITICAL - 90% USED]
Context window is nearly full. IMMEDIATE ACTIONS:
1. STOP reading new files — work with what you have
2. Complete your current task and provide a summary
3. If tasks remain, tell the user to start a new session
4. Avoid verbose tool outputs — use targeted, minimal queries
5. Wrap up NOW — compaction or session end is imminent`;

async function main() {
  try {
    const raw = await readStdin(3000);
    if (!raw) return out();

    const data = JSON.parse(raw);
    const state = getState();
    const now = Date.now();

    // Skip non-large tools for rapid-fire debounce
    const toolName = data.tool_name || data.toolName || "";
    if (!LARGE_OUTPUT_TOOLS.has(toolName)) return out();

    // Rapid-fire debounce
    if (now - state.lastAnalysisTime < RAPID_FIRE_MS) {
      // Still track tokens but skip analysis
      const outputTokens = estimateTokens(data.output || data.tool_result || "");
      state.estimatedTokens += outputTokens;
      return out();
    }

    state.lastAnalysisTime = now;

    // Estimate tokens from tool output
    const outputTokens = estimateTokens(data.output || data.tool_result || "");
    state.estimatedTokens += outputTokens;

    // Also estimate from input if available
    const inputTokens = estimateTokens(data.input || "");
    state.estimatedTokens += inputTokens;

    // Calculate usage percentage
    const usagePercent = state.estimatedTokens / MAX_CONTEXT_TOKENS;

    // Check if we should warn
    const shouldWarn = (
      state.warningCount < MAX_WARNINGS &&
      now - state.lastWarningTime > COOLDOWN_MS
    );

    if (usagePercent >= CRITICAL_THRESHOLD && shouldWarn) {
      state.warningCount++;
      state.lastWarningTime = now;
      return out(CRITICAL_MESSAGE);
    }

    if (usagePercent >= WARNING_THRESHOLD && shouldWarn) {
      state.warningCount++;
      state.lastWarningTime = now;
      return out(WARNING_MESSAGE);
    }

    return out();
  } catch {
    return out();
  }
}

function out(context) {
  const result = { continue: true };
  if (context) {
    result.hookSpecificOutput = {
      hookEventName: "PostToolUse",
      additionalContext: context,
    };
  }
  console.log(JSON.stringify(result));
}

main();
