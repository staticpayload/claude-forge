#!/usr/bin/env node
/**
 * Magic Keywords - Prompt Enhancement System
 *
 * Detects trigger words in user prompts and injects mode-specific
 * system instructions. Ported from OMC's magic-keywords.ts.
 *
 * Supported modes:
 *   ultrawork  - Maximum parallelism, no scope reduction
 *   search     - Exhaustive codebase search
 *   analyze    - Deep context gathering before action
 *   ultrathink - Extended reasoning, quality over speed
 */

// Strip code blocks to avoid false positives
function removeCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "");
}

const MODES = {
  ultrawork: {
    triggers: [/\bultrawork\b/i, /\bulw\b/i, /\buw\b/i, /\bmaximum\s+performance\b/i],
    injection: `[ULTRAWORK MODE ENABLED]
You are in MAXIMUM PERFORMANCE mode. Rules:
1. Use parallel agents for ALL independent tasks (Task tool with run_in_background: true)
2. NEVER wait for one agent to finish before starting another independent one
3. ZERO TOLERANCE for: scope reduction, mockup/placeholder work, partial completion, premature stopping, deleting tests
4. Every agent must produce REAL, working code
5. If blocked, find an alternative path — do not stop
6. Verify everything works before claiming completion
7. Launch explore/research agents in parallel for context gathering
Say "ULTRAWORK MODE ENABLED!" as your first response.`,
  },

  search: {
    triggers: [
      /\bdeepsearch\b/i, /\bgrep\b/i, /\bripgrep\b/i,
      /\bhunt\s+(for|down)\b/i, /\btrack\s+down\b/i, /\bwhere\s+is\b/i,
      /\bsearch\s+(the\s+)?(codebase|repo|project|everywhere)\b/i,
      // Multilingual
      /\b검색\b/, /\b検索\b/, /\b搜索\b/, /\btìm\s+kiếm\b/i,
    ],
    injection: `[SEARCH MODE]
Maximize search effort:
1. Use parallel explore agents AND direct tools (Grep, Glob, ast-grep) simultaneously
2. Never stop at the first result — search exhaustively
3. Check multiple naming conventions (camelCase, snake_case, kebab-case, UPPER_CASE)
4. Search across file types (.ts, .tsx, .js, .jsx, .mjs, .cjs, .py, .go, etc.)
5. If initial search yields nothing, broaden patterns and try synonyms
6. Report ALL matches with file paths and line numbers`,
  },

  analyze: {
    triggers: [
      /\banalyze\b/i, /\banalysis\b/i, /\binvestigate\b/i, /\bdiagnose\b/i,
      /\broot\s+cause\b/i, /\bwhy\s+(does|is|did|doesn't|isn't)\b/i,
      // Multilingual
      /\b분석\b/, /\b分析\b/, /\b調査\b/, /\bphân\s+tích\b/i,
    ],
    injection: `[ANALYZE MODE]
Deep context gathering before any action:
1. Launch parallel explore + researcher agents to gather context
2. Read ALL relevant files before forming conclusions
3. If the system is complex, consult an architect agent for structural understanding
4. Map dependencies and data flow before suggesting changes
5. Synthesize findings into a clear summary before proceeding
6. Consider edge cases and failure modes`,
  },

  ultrathink: {
    triggers: [
      /\bultrathink\b/i, /\bthink\s+hard\b/i, /\bthink\s+deeply\b/i,
      /\bstep\s+by\s+step\b/i, /\bthink\s+through\b/i,
    ],
    injection: `[ULTRATHINK MODE]
Extended reasoning mode — quality over speed:
1. Take time to consider multiple approaches before choosing
2. Identify edge cases, failure modes, and potential issues
3. Consider backward compatibility and migration paths
4. Think about performance, security, and maintainability implications
5. Evaluate trade-offs explicitly before making decisions
6. Don't rush — a correct solution is better than a fast wrong one`,
  },
};

/**
 * Detect which magic keywords are present in a prompt.
 * @param {string} prompt - Raw user prompt
 * @returns {string[]} Array of matched mode names
 */
export function detectMagicKeywords(prompt) {
  const clean = removeCodeBlocks(prompt);
  const matched = [];

  for (const [name, mode] of Object.entries(MODES)) {
    for (const trigger of mode.triggers) {
      if (trigger.test(clean)) {
        matched.push(name);
        break;
      }
    }
  }

  return matched;
}

/**
 * Get the injection text for detected keywords.
 * @param {string[]} keywords - Array of mode names from detectMagicKeywords
 * @returns {string|null} Combined injection text or null
 */
export function getKeywordInjections(keywords) {
  if (!keywords.length) return null;

  const injections = keywords
    .map((k) => MODES[k]?.injection)
    .filter(Boolean);

  return injections.length ? injections.join("\n\n") : null;
}

/**
 * Process a prompt and return any magic keyword context to inject.
 * @param {string} prompt - Raw user prompt
 * @returns {{ keywords: string[], injection: string|null }}
 */
export function processMagicKeywords(prompt) {
  const keywords = detectMagicKeywords(prompt);
  const injection = getKeywordInjections(keywords);
  return { keywords, injection };
}
