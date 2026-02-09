/**
 * Token Tracker & Cost Estimator
 *
 * JSONL append-only log for token usage, session stats, and cost calculation.
 * Powers the HUD analytics display. Ported from OMC's analytics system.
 */

import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

// --- Pricing Table (per 1M tokens) ---

const PRICING = {
  "haiku": { input: 0.80, output: 4.00 },
  "sonnet": { input: 3.00, output: 15.00 },
  "opus": { input: 15.00, output: 75.00 },
  // Aliases
  "claude-haiku-4-5": { input: 0.80, output: 4.00 },
  "claude-sonnet-4-5": { input: 3.00, output: 15.00 },
  "claude-opus-4-6": { input: 15.00, output: 75.00 },
};

const CACHE_WRITE_MARKUP = 0.25; // 25% of input price
const CACHE_READ_DISCOUNT = 0.90; // 90% discount on input price

/**
 * Normalize model name to canonical form.
 */
function normalizeModel(model) {
  if (!model) return "sonnet";
  const m = model.toLowerCase();
  if (m.includes("haiku")) return "haiku";
  if (m.includes("opus")) return "opus";
  if (m.includes("sonnet")) return "sonnet";
  return "sonnet"; // default
}

/**
 * Calculate cost for a single usage record.
 */
export function calculateCost(usage) {
  const model = normalizeModel(usage.model);
  const pricing = PRICING[model] || PRICING.sonnet;

  const inputCost = ((usage.inputTokens || 0) / 1_000_000) * pricing.input;
  const outputCost = ((usage.outputTokens || 0) / 1_000_000) * pricing.output;
  const cacheWriteCost = ((usage.cacheCreationTokens || 0) / 1_000_000) * pricing.input * (1 + CACHE_WRITE_MARKUP);
  const cacheReadCost = ((usage.cacheReadTokens || 0) / 1_000_000) * pricing.input * (1 - CACHE_READ_DISCOUNT);

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

/**
 * Format cost for display.
 */
export function formatCost(cost) {
  if (cost < 0.01) return `~$${cost.toFixed(4)}`;
  if (cost < 1) return `~$${cost.toFixed(4)}`;
  if (cost < 10) return `~$${cost.toFixed(2)}`;
  return `~$${cost.toFixed(1)}`;
}

/**
 * Get cost color based on amount.
 */
export function getCostColor(cost) {
  if (cost >= 5) return "red";
  if (cost >= 1) return "yellow";
  return "green";
}

/**
 * Format token count for display.
 */
export function formatTokens(tokens) {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

// --- Session Tracker ---

const LOG_DIR = join(homedir(), ".claude-forge");
const LOG_FILE = join(LOG_DIR, "token-tracking.jsonl");
const STATS_FILE = join(LOG_DIR, "session-stats.json");

/**
 * Record a token usage event.
 */
export function recordUsage(entry) {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    const record = {
      timestamp: new Date().toISOString(),
      sessionId: entry.sessionId || "unknown",
      model: entry.model || "sonnet",
      inputTokens: entry.inputTokens || 0,
      outputTokens: entry.outputTokens || 0,
      cacheCreationTokens: entry.cacheCreationTokens || 0,
      cacheReadTokens: entry.cacheReadTokens || 0,
      cost: calculateCost(entry),
      agent: entry.agent || null,
      tool: entry.tool || null,
    };
    appendFileSync(LOG_FILE, JSON.stringify(record) + "\n");
    return record;
  } catch {
    return null;
  }
}

/**
 * Get session statistics (current session or all).
 */
export function getSessionStats(sessionId) {
  try {
    if (!existsSync(LOG_FILE)) return emptyStats();
    const content = readFileSync(LOG_FILE, "utf-8");
    const lines = content.split("\n").filter(Boolean);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheCreation = 0;
    let totalCacheRead = 0;
    let totalCost = 0;
    let count = 0;
    const byModel = {};
    const byAgent = {};

    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (sessionId && record.sessionId !== sessionId) continue;

        totalInputTokens += record.inputTokens || 0;
        totalOutputTokens += record.outputTokens || 0;
        totalCacheCreation += record.cacheCreationTokens || 0;
        totalCacheRead += record.cacheReadTokens || 0;
        totalCost += record.cost || 0;
        count++;

        const model = record.model || "unknown";
        byModel[model] = (byModel[model] || 0) + (record.cost || 0);

        if (record.agent) {
          byAgent[record.agent] = (byAgent[record.agent] || 0) + (record.cost || 0);
        }
      } catch {
        // Skip malformed lines
      }
    }

    const totalTokens = totalInputTokens + totalOutputTokens + totalCacheCreation + totalCacheRead;
    const cacheEfficiency = totalTokens > 0
      ? (totalCacheRead / totalTokens) * 100
      : 0;

    return {
      totalInputTokens,
      totalOutputTokens,
      totalCacheCreation,
      totalCacheRead,
      totalTokens,
      totalCost,
      cacheEfficiency,
      count,
      byModel,
      byAgent,
    };
  } catch {
    return emptyStats();
  }
}

function emptyStats() {
  return {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCacheCreation: 0,
    totalCacheRead: 0,
    totalTokens: 0,
    totalCost: 0,
    cacheEfficiency: 0,
    count: 0,
    byModel: {},
    byAgent: {},
  };
}

/**
 * Prune log file, keeping only last N days of entries.
 */
export function pruneLog(daysToKeep = 7) {
  try {
    if (!existsSync(LOG_FILE)) return 0;
    const content = readFileSync(LOG_FILE, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    const cutoff = Date.now() - daysToKeep * 86_400_000;
    const kept = [];
    let pruned = 0;

    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (new Date(record.timestamp).getTime() >= cutoff) {
          kept.push(line);
        } else {
          pruned++;
        }
      } catch {
        pruned++;
      }
    }

    writeFileSync(LOG_FILE, kept.join("\n") + (kept.length ? "\n" : ""));
    return pruned;
  } catch {
    return 0;
  }
}
