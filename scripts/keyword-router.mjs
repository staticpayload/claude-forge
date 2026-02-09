#!/usr/bin/env node
// UserPromptSubmit hook: detect forge delegation keywords + magic keyword enhancement
import { readStdin } from "./lib/stdin.mjs";
import { classifyTask } from "./lib/routing.mjs";
import { processMagicKeywords } from "./lib/magic-keywords.mjs";
import { analyzeComplexity } from "./lib/complexity.mjs";

function sanitize(text) {
  return text
    .replace(/```[\s\S]*?```/g, "")       // code blocks
    .replace(/<[^>]+>/g, "")               // XML tags
    .replace(/https?:\/\/\S+/g, "")        // URLs
    .replace(/["`']/g, "")                 // quotes
    .toLowerCase();
}

// Priority order matters — first match wins. Cancel > modes > delegation > utilities.
const PATTERNS = [
  // --- Cancel (highest priority) ---
  { re: /\b(forge\s+)?cancel\b/, skill: "claude-forge:cancel" },
  { re: /\bstop\s+(forge|autopilot|ralph|ultrawork)/, skill: "claude-forge:cancel" },

  // --- Execution Modes ---
  { re: /\bautopilot\b/, skill: "claude-forge:autopilot" },
  { re: /\bbuild\s+me\b/, skill: "claude-forge:autopilot" },
  { re: /\bi\s+want\s+a\b/, skill: "claude-forge:autopilot" },
  { re: /\bmake\s+me\s+a\b/, skill: "claude-forge:autopilot" },
  { re: /\bralph\b/, skill: "claude-forge:ralph" },
  { re: /\bdon.?t\s+stop\b/, skill: "claude-forge:ralph" },
  { re: /\bmust\s+complete\b/, skill: "claude-forge:ralph" },
  { re: /\bkeep\s+going\s+until\b/, skill: "claude-forge:ralph" },
  { re: /\bultrawork\b/, skill: "claude-forge:ultrawork" },
  { re: /\bulw\b/, skill: "claude-forge:ultrawork" },
  { re: /\bmaximum\s+performance\b/, skill: "claude-forge:ultrawork" },
  { re: /\becomode\b/, skill: "claude-forge:ecomode" },
  { re: /\beco\s+(ralph|autopilot|ultrawork)\b/, skill: "claude-forge:ecomode" },
  { re: /\bbudget\s+mode\b/, skill: "claude-forge:ecomode" },
  { re: /\bultraqa\b/, skill: "claude-forge:ultraqa" },
  { re: /\bqa\s+loop\b/, skill: "claude-forge:ultraqa" },
  { re: /\bmake\s+tests?\s+pass\b/, skill: "claude-forge:ultraqa" },
  { re: /\bultrapilot\b/, skill: "claude-forge:ultrapilot" },
  { re: /\bparallel\s+build\b/, skill: "claude-forge:ultrapilot" },
  { re: /\bfast\s+autopilot\b/, skill: "claude-forge:ultrapilot" },

  // --- Orchestration ---
  { re: /\bforge\s+team\b/, skill: "claude-forge:team" },
  { re: /\bcoordinated\s+team\b/, skill: "claude-forge:team" },
  { re: /\bspawn\s+agents\b/, skill: "claude-forge:team" },
  { re: /\bpipeline\b/, skill: "claude-forge:pipeline" },
  { re: /\bchain\s+agents\b/, skill: "claude-forge:pipeline" },

  // --- Planning & Research ---
  { re: /\bplan\s+(this|the|it)\b/, skill: "claude-forge:plan" },
  { re: /\bmake\s+a\s+plan\b/, skill: "claude-forge:plan" },
  { re: /\b--consensus\b/, skill: "claude-forge:plan" },
  { re: /\bresearch\s+(this|the|it)\b/, skill: "claude-forge:research" },
  { re: /\binvestigate\s+thoroughly\b/, skill: "claude-forge:research" },

  // --- Delegation ---
  { re: /\bforge\s+(this|it)\b/, skill: "claude-forge:forge" },
  { re: /\bauto[- ]?route\b/, skill: "claude-forge:forge" },
  { re: /\b(use|ask|delegate\s+to)\s+codex\b/, skill: "claude-forge:backend" },
  { re: /\bbackend\s+this\b/, skill: "claude-forge:backend" },
  { re: /\b(use|ask|delegate\s+to)\s+gemini\b/, skill: "claude-forge:frontend" },
  { re: /\bfrontend\s+this\b/, skill: "claude-forge:frontend" },
  { re: /\bforge\s+review\b/, skill: "claude-forge:review" },
  { re: /\bcross[- ]?review\b/, skill: "claude-forge:review" },
  { re: /\bmulti[- ]?review\b/, skill: "claude-forge:review" },
  { re: /\bbackend\s+agent\b/, skill: "claude-forge:backend-agent" },
  { re: /\bfrontend\s+agent\b/, skill: "claude-forge:frontend-agent" },
  { re: /\bforge\s+parallel\b/, skill: "claude-forge:parallel" },
  { re: /\bsplit\s+(this|it)\s+up\b/, skill: "claude-forge:parallel" },

  // --- Code Quality ---
  { re: /\bcode\s+review\b/, skill: "claude-forge:code-review" },
  { re: /\breview\s+(this\s+)?code\b/, skill: "claude-forge:code-review" },
  { re: /\breview\s+pr\b/, skill: "claude-forge:code-review" },
  { re: /\bsecurity\s+review\b/, skill: "claude-forge:security-review" },
  { re: /\bsecurity\s+audit\b/, skill: "claude-forge:security-review" },
  { re: /\bowasp\b/, skill: "claude-forge:security-review" },
  { re: /\btdd\b/, skill: "claude-forge:tdd" },
  { re: /\btest\s+first\b/, skill: "claude-forge:tdd" },
  { re: /\bred\s+green\s+refactor\b/, skill: "claude-forge:tdd" },
  { re: /\bbuild[- ]?fix\b/, skill: "claude-forge:build-fix" },
  { re: /\bfix\s+type\s+errors?\b/, skill: "claude-forge:build-fix" },

  // --- Analysis ---
  { re: /\bdeepsearch\b/, skill: "claude-forge:deepsearch" },
  { re: /\bforge\s+analyze\b/, skill: "claude-forge:analyze" },
  { re: /\broot\s+cause\b/, skill: "claude-forge:analyze" },
  { re: /\bdiagnose\b/, skill: "claude-forge:analyze" },

  // --- Productivity ---
  { re: /\bworktree/, skill: "claude-forge:worktree" },
  { re: /\bparallel\s+sessions?\b/, skill: "claude-forge:worktree" },
  { re: /\btech\s*debt\b/, skill: "claude-forge:techdebt" },
  { re: /\bfind\s+duplicat/, skill: "claude-forge:techdebt" },
  { re: /\bfix\s+(ci|tests?|the\s+fail)/, skill: "claude-forge:fix" },
  { re: /\bgo\s+fix\b/, skill: "claude-forge:fix" },
  { re: /\b(learn\s+this|remember\s+this|update\s+claude\.?md)\b/, skill: "claude-forge:learn" },
  { re: /\bdon.?t\s+make\s+that\s+mistake\b/, skill: "claude-forge:learner" },
  { re: /\bsave\s+this\s+insight\b/, skill: "claude-forge:learner" },
  { re: /\bdeepinit\b/, skill: "claude-forge:deepinit" },
  { re: /\bgenerate\s+agents\.?md\b/, skill: "claude-forge:deepinit" },
  { re: /\binit\s+codebase\b/, skill: "claude-forge:deepinit" },
  { re: /\bforge\s+note\b/, skill: "claude-forge:note" },
  { re: /\bforge\s+trace\b/, skill: "claude-forge:trace" },
  { re: /\bagent\s+timeline\b/, skill: "claude-forge:trace" },

  // --- Specialist Agents ---
  { re: /\bui\s*\/?\s*ux\b/, skill: "claude-forge:frontend-ui-ux" },
  { re: /\bgit[- ]?master\b/, skill: "claude-forge:git-master" },

  // --- Configuration ---
  { re: /\bset\s+codex\s+model\b/, skill: "claude-forge:set-codex-model" },
  { re: /\bforge\s+codex\s+model\b/, skill: "claude-forge:set-codex-model" },
  { re: /\bset\s+gemini\s+model\b/, skill: "claude-forge:set-gemini-model" },
  { re: /\bforge\s+gemini\s+model\b/, skill: "claude-forge:set-gemini-model" },
  { re: /\bforge\s+hud\b/, skill: "claude-forge:hud" },
  { re: /\bforge\s+statusline\b/, skill: "claude-forge:hud" },
  { re: /\bsetup\s+hud\b/, skill: "claude-forge:hud" },
  { re: /\b(forge\s+setup|setup\s+forge|configure\s+forge)\b/, skill: "claude-forge:setup" },
  { re: /\benable\s+codex\b/, skill: "claude-forge:enable-codex" },
  { re: /\b(i\s+)?installed\s+codex\b/, skill: "claude-forge:enable-codex" },
  { re: /\bactivate\s+codex\b/, skill: "claude-forge:enable-codex" },
  { re: /\benable\s+gemini\b/, skill: "claude-forge:enable-gemini" },
  { re: /\b(i\s+)?installed\s+gemini\b/, skill: "claude-forge:enable-gemini" },
  { re: /\bactivate\s+gemini\b/, skill: "claude-forge:enable-gemini" },
  { re: /\bforge\s+doctor\b/, skill: "claude-forge:doctor" },
  { re: /\bforge\s+help\b/, skill: "claude-forge:help" },
  { re: /\bwhat\s+can\s+(you|forge)\s+do\b/, skill: "claude-forge:help" },
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

    // Magic keyword prompt enhancement (ultrawork, search, analyze, ultrathink)
    const magic = processMagicKeywords(prompt);
    if (magic.injection) {
      // Combine with any routing hint
      const parts = [magic.injection];

      if (clean.length > 40) {
        const cls = classifyTask(clean);
        if (cls === "backend") parts.push("claude-forge routing: Backend task detected. Consider Codex delegation.");
        if (cls === "frontend") parts.push("claude-forge routing: Frontend task detected. Consider Gemini delegation.");
      }

      // Add complexity analysis for longer prompts
      if (clean.length > 60) {
        const cx = analyzeComplexity(prompt);
        parts.push(`claude-forge complexity: ${cx.explanation}`);
      }

      return out(parts.join("\n\n"));
    }

    // Auto-classify if task looks delegatable (longer prompts with clear signals)
    if (clean.length > 40) {
      const cls = classifyTask(clean);
      const parts = [];

      if (cls === "backend") {
        parts.push(`claude-forge routing hint: This looks like a backend task. Consider delegating to Codex via mcp__codex__codex_exec for autonomous execution.`);
      }
      if (cls === "frontend") {
        parts.push(`claude-forge routing hint: This looks like a frontend/design task. Consider delegating to Gemini via mcp__gemini__gemini_exec for autonomous execution.`);
      }

      // Add complexity hint for substantial prompts
      if (clean.length > 80) {
        const cx = analyzeComplexity(prompt);
        if (cx.tier !== "haiku") {
          parts.push(`claude-forge complexity: ${cx.explanation}`);
        }
      }

      if (parts.length) return out(parts.join("\n\n"));
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
