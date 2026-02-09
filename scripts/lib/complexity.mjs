/**
 * Complexity Scorer — Model Routing
 *
 * Calculates task complexity from lexical, structural, and context signals.
 * Routes to appropriate model tier: haiku (<4), sonnet (4-8), opus (>=8).
 * Ported from OMC's model-routing/scorer.ts + signals.ts.
 */

// --- Signal Extraction ---

const ARCHITECTURE_WORDS = /\b(architect|design|system|boundary|interface|contract|migration|monolith|microservice|scale|distributed)\b/i;
const DEBUG_WORDS = /\b(debug|trace|bisect|regression|race\s+condition|deadlock|memory\s+leak|segfault|stack\s+overflow)\b/i;
const RISK_WORDS = /\b(security|vulnerability|auth|permission|credential|secret|injection|xss|csrf|owasp)\b/i;
const REFACTOR_WORDS = /\b(refactor|restructure|rewrite|consolidate|decouple|extract|split|merge|modularize)\b/i;

/**
 * Extract lexical signals from prompt text.
 */
function extractLexicalSignals(text) {
  const words = text.split(/\s+/).length;
  const filePaths = (text.match(/[\w./\\-]+\.\w{1,6}/g) || []).length;
  const codeBlocks = (text.match(/```/g) || []).length / 2;
  const hasArchitecture = ARCHITECTURE_WORDS.test(text);
  const hasDebug = DEBUG_WORDS.test(text);
  const hasRisk = RISK_WORDS.test(text);
  const hasRefactor = REFACTOR_WORDS.test(text);
  const questionCount = (text.match(/\?/g) || []).length;
  const whyQuestions = (text.match(/\bwhy\b/gi) || []).length;

  return { words, filePaths, codeBlocks, hasArchitecture, hasDebug, hasRisk, hasRefactor, questionCount, whyQuestions };
}

/**
 * Extract structural signals from prompt text.
 */
function extractStructuralSignals(text) {
  // Count subtasks (numbered lists, bullet points with verbs)
  const numberedItems = (text.match(/^\s*\d+[\.\)]/gm) || []).length;
  const bulletItems = (text.match(/^\s*[-*]\s+/gm) || []).length;
  const subtaskCount = numberedItems + bulletItems;

  // Cross-file references
  const fileRefs = new Set((text.match(/[\w./\\-]+\.\w{1,6}/g) || []));
  const crossFileDeps = fileRefs.size >= 3;

  // Test requirements
  const hasTestRequirements = /\b(test|spec|coverage|assert|expect|mock|stub|fixture)\b/i.test(text);

  // Impact scope
  const systemWide = /\b(all\s+files|entire|whole|every|across\s+the|throughout)\b/i.test(text);

  return { subtaskCount, crossFileDeps, hasTestRequirements, systemWide, uniqueFiles: fileRefs.size };
}

/**
 * Extract context signals.
 */
function extractContextSignals(text) {
  // Domain detection
  const domains = [];
  if (/\b(api|endpoint|route|rest|graphql|grpc)\b/i.test(text)) domains.push("backend");
  if (/\b(component|ui|css|react|vue|svelte|html|layout)\b/i.test(text)) domains.push("frontend");
  if (/\b(database|sql|migration|schema|model|orm)\b/i.test(text)) domains.push("database");
  if (/\b(deploy|docker|kubernetes|ci|cd|pipeline|terraform|aws|gcp)\b/i.test(text)) domains.push("infra");
  if (/\b(auth|login|session|jwt|oauth|rbac|permission)\b/i.test(text)) domains.push("auth");

  // Reversibility
  const isIrreversible = /\b(delete|drop|remove|destroy|migrate|rename\s+table)\b/i.test(text);

  return { domains, isIrreversible, domainCount: domains.length };
}

// --- Scoring ---

/**
 * Calculate complexity score from extracted signals.
 * @returns {number} Score from 0-15+
 */
function calculateScore(lexical, structural, context) {
  let score = 0;

  // Lexical signals
  if (lexical.words > 200) score += 1;
  if (lexical.words > 500) score += 1;
  if (lexical.hasArchitecture) score += 3;
  if (lexical.hasDebug) score += 2;
  if (lexical.hasRisk) score += 2;
  if (lexical.hasRefactor) score += 2;
  if (lexical.whyQuestions > 0) score += 2;
  if (lexical.codeBlocks > 2) score += 1;
  if (lexical.filePaths > 5) score += 1;

  // Structural signals
  if (structural.subtaskCount >= 3) score += 3;
  if (structural.subtaskCount >= 6) score += 1;
  if (structural.crossFileDeps) score += 2;
  if (structural.hasTestRequirements) score += 1;
  if (structural.systemWide) score += 3;

  // Context signals
  if (context.domainCount >= 2) score += 2;
  if (context.domainCount >= 3) score += 1;
  if (context.isIrreversible) score += 1;

  return score;
}

/**
 * Map score to model tier.
 * @param {number} score
 * @returns {"haiku"|"sonnet"|"opus"}
 */
function scoreToTier(score) {
  if (score >= 8) return "opus";
  if (score >= 4) return "sonnet";
  return "haiku";
}

// --- Public API ---

/**
 * Analyze task complexity and recommend a model tier.
 * @param {string} text - Task description / user prompt
 * @returns {{ score: number, tier: "haiku"|"sonnet"|"opus", signals: object, explanation: string }}
 */
export function analyzeComplexity(text) {
  const lexical = extractLexicalSignals(text);
  const structural = extractStructuralSignals(text);
  const context = extractContextSignals(text);
  const score = calculateScore(lexical, structural, context);
  const tier = scoreToTier(score);

  // Build explanation
  const reasons = [];
  if (lexical.hasArchitecture) reasons.push("architecture keywords (+3)");
  if (lexical.hasDebug) reasons.push("debugging signals (+2)");
  if (lexical.hasRisk) reasons.push("security concerns (+2)");
  if (lexical.hasRefactor) reasons.push("refactoring scope (+2)");
  if (structural.subtaskCount >= 3) reasons.push(`${structural.subtaskCount} subtasks (+3)`);
  if (structural.crossFileDeps) reasons.push("cross-file dependencies (+2)");
  if (structural.systemWide) reasons.push("system-wide impact (+3)");
  if (context.domainCount >= 2) reasons.push(`${context.domainCount} domains (+${context.domainCount >= 3 ? 3 : 2})`);
  if (lexical.whyQuestions > 0) reasons.push("why-questions (+2)");

  const explanation = reasons.length
    ? `Score ${score} → ${tier}: ${reasons.join(", ")}`
    : `Score ${score} → ${tier}: straightforward task`;

  return {
    score,
    tier,
    signals: { lexical, structural, context },
    explanation,
  };
}

/**
 * Quick tier recommendation (no explanation).
 * @param {string} text
 * @returns {"haiku"|"sonnet"|"opus"}
 */
export function recommendTier(text) {
  return analyzeComplexity(text).tier;
}
