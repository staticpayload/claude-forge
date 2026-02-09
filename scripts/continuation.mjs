#!/usr/bin/env node
/**
 * Continuation Enforcement Hook (Stop event)
 *
 * Prevents premature stopping when tasks remain incomplete.
 * Ported from OMC's continuation-enforcement.ts + todo-continuation.
 *
 * Lifecycle: Fires on Stop event. Returns continue: true to prevent exit.
 */

import { readStdin } from "./lib/stdin.mjs";

// Random continuation reminders (Sisyphus mythology)
const REMINDERS = [
  "[SYSTEM REMINDER - TASK CONTINUATION]\nYou have incomplete tasks. Review your task list and continue working. Do not stop until all tasks are completed and verified.",
  "[THE BOULDER NEVER STOPS]\nThere are still pending items. The work continues. Check your task list, pick up the next item, and keep going.",
  "[CONTINUATION REQUIRED]\nPremature stopping detected. You still have work to do. Resume immediately — verify your task list and continue.",
  "[WORK IN PROGRESS]\nDo not abandon incomplete work. Check remaining tasks, verify nothing was missed, and continue to completion.",
  "[FORGE CONTINUES]\nStopping is not an option when tasks remain. Review, execute, verify. The forge burns until the work is done.",
];

// Completion signal patterns (detect if assistant is genuinely done)
const COMPLETION_SIGNALS = [
  /all\s+(tasks?|items?|work)\s+(are\s+)?(completed?|done|finished)/i,
  /everything\s+(is\s+)?(completed?|done|finished)/i,
  /no\s+(more\s+)?(remaining|pending|incomplete)\s+(tasks?|items?|work)/i,
  /successfully\s+(completed?|finished|implemented)/i,
];

// Uncertainty patterns (assistant is not confident about completion)
const UNCERTAINTY_PATTERNS = [
  /\bshould\s+(be|work)\b/i,
  /\bmight\s+(need|require|want)\b/i,
  /\bprobably\b/i,
  /\bi\s+think\b/i,
  /\blikely\b/i,
];

function pickReminder() {
  return REMINDERS[Math.floor(Math.random() * REMINDERS.length)];
}

/**
 * Check if the stop was user-initiated (allow it).
 */
function isUserAbort(data) {
  if (data.stop_reason === "user_requested") return true;
  if (data.user_requested === true) return true;
  return false;
}

/**
 * Check if stop is due to context limit (allow it to prevent deadlock).
 */
function isContextLimitStop(data) {
  const reason = (data.stop_reason || "").toLowerCase();
  return reason.includes("context_limit") || reason.includes("token_limit") || reason.includes("context_window");
}

/**
 * Detect completion signals in the last assistant response.
 */
function detectCompletionSignals(text) {
  if (!text) return { claimsComplete: false, hasUncertainty: false };

  const claimsComplete = COMPLETION_SIGNALS.some((p) => p.test(text));
  const hasUncertainty = UNCERTAINTY_PATTERNS.some((p) => p.test(text));

  return { claimsComplete, hasUncertainty };
}

/**
 * Check for incomplete tasks (reads from Claude Code's task system).
 */
function hasIncompleteTasks(data) {
  // Check if there's task context in the stop data
  const tasks = data.tasks || data.todos || [];
  if (Array.isArray(tasks)) {
    const incomplete = tasks.filter((t) => {
      const status = (t.status || "").toLowerCase();
      return status !== "completed" && status !== "cancelled" && status !== "deleted";
    });
    return incomplete.length > 0;
  }
  return false;
}

async function main() {
  try {
    const raw = await readStdin(3000);
    if (!raw) return out();

    const data = JSON.parse(raw);

    // Always allow user-initiated stops
    if (isUserAbort(data)) return out();

    // Allow context limit stops (prevent deadlock)
    if (isContextLimitStop(data)) return out();

    // Check for incomplete tasks
    const lastResponse = data.last_response || data.lastAssistantMessage || "";
    const completion = detectCompletionSignals(lastResponse);

    // If assistant claims complete but has uncertainty, verify
    if (completion.claimsComplete && completion.hasUncertainty) {
      return out(
        `[VERIFICATION REQUIRED]\nYour completion claim contains uncertainty language ("should", "might", "probably"). ` +
        `Before stopping, explicitly verify:\n1. All tasks are marked completed\n2. Tests pass (if applicable)\n3. No errors remain\n` +
        `If everything truly works, state "All tasks verified and complete" explicitly.`
      );
    }

    // If tasks remain incomplete, force continuation
    if (hasIncompleteTasks(data)) {
      return out(pickReminder());
    }

    // Default: allow stop
    return out();
  } catch {
    return out();
  }
}

function out(context) {
  const result = { continue: true };
  if (context) {
    // When we provide context, we want to PREVENT the stop
    result.continue = true;
    result.hookSpecificOutput = {
      hookEventName: "Stop",
      additionalContext: context,
    };
    // Signal to keep going
    result.stopReason = "continuation_enforced";
  }
  console.log(JSON.stringify(result));
}

main();
