#!/usr/bin/env node
/**
 * claude-forge - Rate Limit Usage API
 *
 * Fetches 5-hour and weekly usage from Anthropic OAuth API.
 * Reads credentials from macOS Keychain or ~/.claude/.credentials.json.
 * Caches results for 30s to avoid hammering the API.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { request } from "node:https";

const HOME = homedir();
const CACHE_PATH = join(HOME, ".claude-forge", ".usage-cache.json");
const CREDENTIALS_PATH = join(HOME, ".claude", ".credentials.json");
const CACHE_TTL_OK = 30_000;    // 30s on success
const CACHE_TTL_ERR = 15_000;   // 15s on failure
const API_TIMEOUT = 10_000;     // 10s
const USAGE_URL = "https://api.anthropic.com/api/oauth/usage";
const TOKEN_REFRESH_HOST = "platform.claude.com";
const TOKEN_REFRESH_PATH = "/v1/oauth/token";
const OAUTH_CLIENT_ID = process.env.CLAUDE_CODE_OAUTH_CLIENT_ID || "9d1c250a-e61b-44d9-88ed-5944d1962f5e";

// --- Cache ---
function readCache() {
  try {
    if (!existsSync(CACHE_PATH)) return null;
    const raw = JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
    const ttl = raw.error ? CACHE_TTL_ERR : CACHE_TTL_OK;
    if (Date.now() - raw.timestamp < ttl) {
      // Hydrate dates
      if (raw.data) {
        if (raw.data.fiveHourResetsAt) raw.data.fiveHourResetsAt = new Date(raw.data.fiveHourResetsAt);
        if (raw.data.weeklyResetsAt) raw.data.weeklyResetsAt = new Date(raw.data.weeklyResetsAt);
      }
      return raw;
    }
  } catch { /* ignore */ }
  return null;
}

function writeCache(data, error = false) {
  try {
    mkdirSync(dirname(CACHE_PATH), { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify({ timestamp: Date.now(), data, error }));
  } catch { /* ignore */ }
}

// --- Credentials ---
function getCredentials() {
  // 1. macOS Keychain
  if (process.platform === "darwin") {
    try {
      const raw = execSync(
        '/usr/bin/security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null',
        { encoding: "utf-8", timeout: 3000 }
      ).trim();
      const parsed = JSON.parse(raw);
      const oauth = parsed.claudeAiOauth || parsed;
      if (oauth.accessToken) return oauth;
    } catch { /* fall through */ }
  }

  // 2. File-based credentials
  try {
    if (existsSync(CREDENTIALS_PATH)) {
      const parsed = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf-8"));
      const oauth = parsed.claudeAiOauth || parsed;
      if (oauth.accessToken) return oauth;
    }
  } catch { /* ignore */ }

  return null;
}

function isTokenValid(creds) {
  if (!creds.expiresAt) return true; // no expiry = assume valid
  return Date.now() < creds.expiresAt;
}

// --- Token refresh ---
function refreshToken(refreshTok) {
  return new Promise((resolve) => {
    const body = `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshTok)}&client_id=${OAUTH_CLIENT_ID}`;
    const opts = {
      hostname: TOKEN_REFRESH_HOST,
      path: TOKEN_REFRESH_PATH,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: API_TIMEOUT,
    };

    const req = request(opts, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        try {
          const r = JSON.parse(data);
          if (r.access_token) {
            resolve({
              accessToken: r.access_token,
              refreshToken: r.refresh_token || refreshTok,
              expiresAt: r.expires_at || (Date.now() + (r.expires_in || 3600) * 1000),
            });
          } else resolve(null);
        } catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

function writeBackCredentials(creds) {
  try {
    let existing = {};
    if (existsSync(CREDENTIALS_PATH)) {
      existing = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf-8"));
    }
    if (existing.claudeAiOauth) {
      existing.claudeAiOauth = { ...existing.claudeAiOauth, ...creds };
    } else {
      existing = { ...existing, ...creds };
    }
    const tmp = CREDENTIALS_PATH + ".tmp." + process.pid;
    writeFileSync(tmp, JSON.stringify(existing, null, 2));
    renameSync(tmp, CREDENTIALS_PATH);
  } catch { /* ignore - credential write-back is best-effort */ }
}

// --- API fetch ---
function fetchUsage(accessToken) {
  return new Promise((resolve) => {
    const url = new URL(USAGE_URL);
    const opts = {
      hostname: url.hostname,
      path: url.pathname,
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "anthropic-beta": "oauth-2025-04-20",
      },
      timeout: API_TIMEOUT,
    };

    const req = request(opts, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else resolve(null);
        } catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.end();
  });
}

// --- Parse API response ---
function parseUsage(raw) {
  if (!raw) return null;

  const result = {
    fiveHourPercent: 0,
    weeklyPercent: 0,
    fiveHourResetsAt: null,
    weeklyResetsAt: null,
  };

  if (raw.five_hour) {
    result.fiveHourPercent = raw.five_hour.utilization ?? 0;
    if (raw.five_hour.resets_at) result.fiveHourResetsAt = new Date(raw.five_hour.resets_at);
  }

  if (raw.seven_day) {
    result.weeklyPercent = raw.seven_day.utilization ?? 0;
    if (raw.seven_day.resets_at) result.weeklyResetsAt = new Date(raw.seven_day.resets_at);
  }

  return result;
}

// --- Main export ---
export async function getUsage() {
  // 1. Check cache
  const cached = readCache();
  if (cached) return cached.data;

  // 2. Get credentials
  let creds = getCredentials();
  if (!creds) {
    writeCache(null, true);
    return null;
  }

  // 3. Refresh if expired
  if (!isTokenValid(creds)) {
    if (creds.refreshToken) {
      const refreshed = await refreshToken(creds.refreshToken);
      if (refreshed) {
        creds = { ...creds, ...refreshed };
        writeBackCredentials(creds);
      } else {
        writeCache(null, true);
        return null;
      }
    } else {
      writeCache(null, true);
      return null;
    }
  }

  // 4. Fetch usage
  const raw = await fetchUsage(creds.accessToken);
  const usage = parseUsage(raw);
  writeCache(usage, !usage);
  return usage;
}
