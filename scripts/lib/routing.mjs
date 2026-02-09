// Task classification heuristics for routing between Codex and Gemini

export const BACKEND_SIGNALS = [
  "api", "endpoint", "route", "server", "database", "sql", "migration",
  "schema", "cli", "script", "pipeline", "backend", "infrastructure",
  "docker", "k8s", "kubernetes", "auth", "middleware", "cron", "queue",
  "worker", "cache", "redis", "postgres", "mongodb", "data processing",
  "etl", "webhook", "microservice", "graphql", "rest", "grpc",
  "lambda", "serverless", "terraform", "ansible",
];

export const FRONTEND_SIGNALS = [
  "component", "ui", "ux", "css", "style", "layout", "responsive",
  "animation", "react", "vue", "svelte", "angular", "html", "template",
  "design", "theme", "accessibility", "a11y", "aria", "svg", "icon",
  "font", "color", "tailwind", "sass", "scss", "frontend", "visual",
  "mobile", "figma", "wireframe", "prototype", "storybook",
];

export function classifyTask(prompt) {
  const lower = prompt.toLowerCase();
  let back = 0, front = 0;
  for (const s of BACKEND_SIGNALS) if (lower.includes(s)) back++;
  for (const s of FRONTEND_SIGNALS) if (lower.includes(s)) front++;

  if (back > 0 && front === 0) return "backend";
  if (front > 0 && back === 0) return "frontend";
  if (back > front) return "backend";
  if (front > back) return "frontend";
  return "ambiguous";
}
