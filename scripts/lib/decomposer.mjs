/**
 * Task Decomposer — Parallel Work Splitter
 *
 * Splits tasks into parallelizable components with non-overlapping
 * file ownership. Powers the /claude-forge:parallel skill.
 * Ported from OMC's task-decomposer/index.ts.
 */

import { analyzeComplexity } from "./complexity.mjs";

// --- Task Type Detection ---

const TASK_TYPES = [
  { type: "fullstack", pattern: /\b(full.?stack|frontend\s+and\s+backend|end.?to.?end|api\s+and\s+ui)\b/i },
  { type: "refactoring", pattern: /\b(refactor|restructure|rewrite|consolidate|reorganize|modularize)\b/i },
  { type: "bug-fix", pattern: /\b(fix|bug|issue|error|broken|regression|crash|failing)\b/i },
  { type: "feature", pattern: /\b(add|implement|create|build|new\s+feature|introduce)\b/i },
  { type: "testing", pattern: /\b(test|spec|coverage|tdd|e2e|integration\s+test)\b/i },
  { type: "docs", pattern: /\b(document|readme|jsdoc|api\s+docs|migration\s+guide)\b/i },
  { type: "infra", pattern: /\b(deploy|docker|ci|cd|pipeline|terraform|kubernetes)\b/i },
];

function detectTaskType(text) {
  for (const { type, pattern } of TASK_TYPES) {
    if (pattern.test(text)) return type;
  }
  return "feature"; // default
}

// --- Area Detection ---

const AREAS = [
  { area: "frontend", pattern: /\b(component|ui|css|react|vue|svelte|html|layout|page|form|button|modal|sidebar|header|footer|nav)\b/i },
  { area: "backend", pattern: /\b(api|endpoint|route|server|controller|middleware|handler|service|worker)\b/i },
  { area: "database", pattern: /\b(database|sql|migration|schema|model|orm|prisma|sequelize|typeorm|knex|table|column)\b/i },
  { area: "auth", pattern: /\b(auth|login|signup|session|jwt|oauth|rbac|permission|role|user\s+management)\b/i },
  { area: "testing", pattern: /\b(test|spec|fixture|mock|stub|coverage|jest|vitest|playwright|cypress)\b/i },
  { area: "docs", pattern: /\b(document|readme|changelog|api\s+docs|jsdoc|typedoc)\b/i },
  { area: "infra", pattern: /\b(docker|kubernetes|ci|cd|deploy|terraform|aws|gcp|azure|nginx|envoy)\b/i },
  { area: "shared", pattern: /\b(utils?|helpers?|lib|common|shared|types?|interfaces?|constants?)\b/i },
];

function detectAreas(text) {
  const found = [];
  for (const { area, pattern } of AREAS) {
    if (pattern.test(text)) found.push(area);
  }
  return found.length ? found : ["general"];
}

// --- Technology Detection ---

const TECHNOLOGIES = [
  { tech: "react", pattern: /\breact\b/i },
  { tech: "vue", pattern: /\bvue\b/i },
  { tech: "svelte", pattern: /\bsvelte\b/i },
  { tech: "next", pattern: /\bnext\.?js\b/i },
  { tech: "node", pattern: /\bnode\.?js\b/i },
  { tech: "express", pattern: /\bexpress\b/i },
  { tech: "fastify", pattern: /\bfastify\b/i },
  { tech: "postgres", pattern: /\b(postgres|postgresql|pg)\b/i },
  { tech: "mysql", pattern: /\bmysql\b/i },
  { tech: "mongodb", pattern: /\b(mongo|mongodb)\b/i },
  { tech: "redis", pattern: /\bredis\b/i },
  { tech: "prisma", pattern: /\bprisma\b/i },
  { tech: "docker", pattern: /\bdocker\b/i },
  { tech: "typescript", pattern: /\btypescript\b/i },
  { tech: "python", pattern: /\bpython\b/i },
  { tech: "go", pattern: /\bgo(lang)?\b/i },
];

function detectTechnologies(text) {
  return TECHNOLOGIES.filter(({ pattern }) => pattern.test(text)).map(({ tech }) => tech);
}

// --- File Ownership Patterns ---

const FILE_OWNERSHIP = {
  frontend: ["src/components/**", "src/pages/**", "src/views/**", "src/layouts/**", "src/styles/**", "public/**"],
  backend: ["src/api/**", "src/routes/**", "src/controllers/**", "src/services/**", "src/middleware/**", "src/handlers/**"],
  database: ["src/db/**", "src/models/**", "migrations/**", "prisma/**", "src/repositories/**"],
  auth: ["src/auth/**", "src/middleware/auth*"],
  testing: ["tests/**", "test/**", "__tests__/**", "*.test.*", "*.spec.*"],
  docs: ["docs/**", "*.md", "api-docs/**"],
  infra: ["Dockerfile*", "docker-compose*", ".github/**", "terraform/**", "k8s/**", "deploy/**"],
  shared: ["src/lib/**", "src/utils/**", "src/common/**", "src/types/**"],
  general: ["src/**"],
};

const SHARED_FILES = [
  "package.json", "package-lock.json", "tsconfig.json", "tsconfig*.json",
  ".env", ".env.*", ".gitignore", "README.md", "CHANGELOG.md",
];

// --- Agent Mapping ---

const AREA_TO_AGENT = {
  frontend: "designer",
  backend: "executor",
  database: "executor",
  auth: "executor",
  testing: "test-engineer",
  docs: "writer",
  infra: "executor",
  shared: "executor",
  general: "executor",
};

// --- Decomposition Strategies ---

function decomposeFullstack(areas, text) {
  const components = [];

  if (areas.includes("frontend")) {
    components.push({
      name: "Frontend UI",
      area: "frontend",
      description: "Build/modify frontend components, pages, and styles",
      agent: "designer",
      effort: 0.4,
    });
  }

  if (areas.includes("backend") || areas.includes("database")) {
    components.push({
      name: "Backend API",
      area: "backend",
      description: "Build/modify API endpoints, services, and data layer",
      agent: "executor",
      effort: 0.4,
    });
  }

  if (areas.includes("database")) {
    components.push({
      name: "Database Schema",
      area: "database",
      description: "Create/modify database schema, migrations, models",
      agent: "executor",
      effort: 0.2,
      blockedBy: [],
    });
  }

  if (areas.includes("testing") || components.length > 1) {
    components.push({
      name: "Integration Tests",
      area: "testing",
      description: "Write integration tests for the full feature",
      agent: "test-engineer",
      effort: 0.2,
      blockedBy: components.map((c) => c.name),
    });
  }

  return components;
}

function decomposeRefactoring(areas, text) {
  return areas
    .filter((a) => a !== "testing" && a !== "docs")
    .map((area) => ({
      name: `Refactor ${area}`,
      area,
      description: `Refactor ${area} code: extract, reorganize, decouple`,
      agent: AREA_TO_AGENT[area] || "executor",
      effort: 1.0 / Math.max(areas.length, 1),
    }));
}

function decomposeBugFix(areas, text) {
  // Bug fixes are usually NOT parallelizable
  return [{
    name: "Bug Fix",
    area: areas[0] || "general",
    description: "Investigate and fix the bug",
    agent: "debugger",
    effort: 1.0,
  }];
}

function decomposeFeature(areas, text) {
  return areas.map((area) => ({
    name: `${area.charAt(0).toUpperCase() + area.slice(1)} Implementation`,
    area,
    description: `Implement the ${area} portion of the feature`,
    agent: AREA_TO_AGENT[area] || "executor",
    effort: 1.0 / Math.max(areas.length, 1),
  }));
}

const STRATEGIES = {
  fullstack: decomposeFullstack,
  refactoring: decomposeRefactoring,
  "bug-fix": decomposeBugFix,
  feature: decomposeFeature,
  testing: (areas) => [{ name: "Test Suite", area: "testing", description: "Write comprehensive tests", agent: "test-engineer", effort: 1.0 }],
  docs: (areas) => [{ name: "Documentation", area: "docs", description: "Write documentation", agent: "writer", effort: 1.0 }],
  infra: (areas) => [{ name: "Infrastructure", area: "infra", description: "Set up infrastructure", agent: "executor", effort: 1.0 }],
};

// --- Execution Order (Topological Sort) ---

function calculateExecutionOrder(components) {
  const batches = [];
  const completed = new Set();
  const remaining = [...components];

  while (remaining.length > 0) {
    const batch = [];
    const stillWaiting = [];

    for (const comp of remaining) {
      const blockers = (comp.blockedBy || []).filter((b) => !completed.has(b));
      if (blockers.length === 0) {
        batch.push(comp);
      } else {
        stillWaiting.push(comp);
      }
    }

    if (batch.length === 0) {
      // Circular dependency — just push everything remaining
      batches.push(stillWaiting);
      break;
    }

    batches.push(batch);
    for (const comp of batch) {
      completed.add(comp.name);
    }
    remaining.length = 0;
    remaining.push(...stillWaiting);
  }

  return batches;
}

// --- Validation ---

function validateDecomposition(components) {
  const warnings = [];

  // Check for file ownership overlaps
  const ownershipMap = new Map();
  for (const comp of components) {
    const patterns = FILE_OWNERSHIP[comp.area] || FILE_OWNERSHIP.general;
    for (const pattern of patterns) {
      if (SHARED_FILES.some((sf) => pattern === sf)) continue;
      if (ownershipMap.has(pattern) && ownershipMap.get(pattern) !== comp.name) {
        warnings.push(`File pattern "${pattern}" owned by both "${ownershipMap.get(pattern)}" and "${comp.name}"`);
      }
      ownershipMap.set(pattern, comp.name);
    }
  }

  // Check for single-component decomposition
  if (components.length === 1) {
    warnings.push("Task decomposed into single component — parallelization not beneficial");
  }

  return warnings;
}

// --- Public API ---

/**
 * Select model tier based on component effort.
 */
function selectModelTier(effort) {
  if (effort < 0.3) return "haiku";
  if (effort < 0.7) return "sonnet";
  return "opus";
}

/**
 * Decompose a task into parallelizable components.
 *
 * @param {string} taskDescription - Full task description
 * @returns {{
 *   taskType: string,
 *   areas: string[],
 *   technologies: string[],
 *   complexity: object,
 *   components: Array<{name, area, description, agent, effort, filePatterns, modelTier, blockedBy?}>,
 *   executionOrder: Array<Array<object>>,
 *   sharedFiles: string[],
 *   warnings: string[],
 *   isParallelizable: boolean
 * }}
 */
export function decomposeTask(taskDescription) {
  const taskType = detectTaskType(taskDescription);
  const areas = detectAreas(taskDescription);
  const technologies = detectTechnologies(taskDescription);
  const complexity = analyzeComplexity(taskDescription);

  // Select strategy
  const strategy = STRATEGIES[taskType] || STRATEGIES.feature;
  let components = strategy(areas, taskDescription);

  // Enrich components
  components = components.map((comp) => ({
    ...comp,
    filePatterns: FILE_OWNERSHIP[comp.area] || FILE_OWNERSHIP.general,
    modelTier: selectModelTier(comp.effort),
  }));

  // Calculate execution order
  const executionOrder = calculateExecutionOrder(components);

  // Validate
  const warnings = validateDecomposition(components);

  // Parallelizable if 2+ components in first batch
  const isParallelizable = executionOrder.length > 0 && executionOrder[0].length > 1;

  return {
    taskType,
    areas,
    technologies,
    complexity,
    components,
    executionOrder,
    sharedFiles: SHARED_FILES,
    warnings,
    isParallelizable,
  };
}

/**
 * Format decomposition result as readable text for skill injection.
 */
export function formatDecomposition(result) {
  const lines = [];
  lines.push(`Task Type: ${result.taskType}`);
  lines.push(`Areas: ${result.areas.join(", ")}`);
  lines.push(`Complexity: ${result.complexity.explanation}`);
  lines.push(`Parallelizable: ${result.isParallelizable ? "YES" : "NO"}`);
  lines.push("");

  lines.push("Execution Plan:");
  for (let i = 0; i < result.executionOrder.length; i++) {
    const batch = result.executionOrder[i];
    lines.push(`  Wave ${i + 1} (${batch.length > 1 ? "parallel" : "sequential"}):`);
    for (const comp of batch) {
      lines.push(`    - ${comp.name} [${comp.agent}/${comp.modelTier}]`);
      lines.push(`      ${comp.description}`);
      lines.push(`      Files: ${comp.filePatterns.join(", ")}`);
    }
  }

  if (result.warnings.length) {
    lines.push("");
    lines.push("Warnings:");
    for (const w of result.warnings) {
      lines.push(`  - ${w}`);
    }
  }

  return lines.join("\n");
}
