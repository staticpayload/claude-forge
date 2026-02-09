#!/usr/bin/env node
// UserPromptSubmit hook: detect forge delegation keywords
import { readStdin } from "./lib/stdin.mjs";
import { classifyTask } from "./lib/routing.mjs";

function sanitize(text) {
  return text
    .replace(/```[\s\S]*?```/g, "")       // code blocks
    .replace(/<[^>]+>/g, "")               // XML tags
    .replace(/https?:\/\/\S+/g, "")        // URLs
    .replace(/["`']/g, "")                 // quotes
    .toLowerCase();
}

const PATTERNS = [
  { re: /\bforge\s+(this|it)\b/, skill: "claude-forge:forge" },
  { re: /\bauto[- ]?route\b/, skill: "claude-forge:forge" },
  { re: /\b(use|ask|delegate\s+to)\s+codex\b/, skill: "claude-forge:backend" },
  { re: /\bbackend\s+this\b/, skill: "claude-forge:backend" },
  { re: /\b(use|ask|delegate\s+to)\s+gemini\b/, skill: "claude-forge:frontend" },
  { re: /\bfrontend\s+this\b/, skill: "claude-forge:frontend" },
  { re: /\bforge\s+review\b/, skill: "claude-forge:review" },
  { re: /\bcross[- ]?review\b/, skill: "claude-forge:review" },
  { re: /\bmulti[- ]?review\b/, skill: "claude-forge:review" },
];

async function main() {
  try {
    const raw = await readStdin(3000);
    if (!raw) return out();
    const data = JSON.parse(raw);
    const prompt = data.prompt || data.message || "";
    if (!prompt) return out();

    const clean = sanitize(prompt);

    // Check explicit keyword patterns
    for (const { re, skill } of PATTERNS) {
      if (re.test(clean)) {
        return out(`[MAGIC KEYWORD: FORGE]\n\nYou MUST invoke the skill: /\u200B${skill}\nDo this BEFORE generating any other response.`);
      }
    }

    // Auto-classify if task looks delegatable (longer prompts with clear signals)
    if (clean.length > 40) {
      const cls = classifyTask(clean);
      if (cls === "backend") {
        return out(`claude-forge routing hint: This looks like a backend task. Consider delegating to Codex via mcp__codex__codex_exec for autonomous execution.`);
      }
      if (cls === "frontend") {
        return out(`claude-forge routing hint: This looks like a frontend/design task. Consider delegating to Gemini via mcp__gemini__gemini_exec for autonomous execution.`);
      }
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
      hookEventName: "UserPromptSubmit",
      additionalContext: context,
    };
  }
  console.log(JSON.stringify(result));
}

main();
