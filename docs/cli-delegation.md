# CLI Delegation

claude-forge routes work to external AI coding agents via MCP servers. Codex CLI handles backend tasks (API endpoints, databases, scripts). Gemini CLI handles frontend tasks (UI components, styling, design systems). Claude orchestrates task classification, delegation, and result verification.

The core benefit: leverage specialized models (GPT-5.3 Codex with 128K context, Gemini 3 Pro with 1M context) without losing Claude's orchestration capabilities.

---

## Providers

### Codex CLI

**Model:** GPT-5.3 Codex (128K context, specialized for code)

**MCP Server:** `servers/codex-server.mjs`

**Tools:**
- `codex_exec` — spawn a Codex job with prompt and context files
- `codex_status` — long-poll a job (up to 25s), get output tail if running
- `codex_cancel` — terminate a running job
- `codex_list` — list all jobs, filtered by status

**Execution:**
```
codex exec --yolo -C {workFolder} -m {model}
  < {NO_LOOP_PREAMBLE + contextFiles + prompt + NO_LOOP_SUFFIX}
```

**Best for:** API endpoints, data pipelines, database schemas, backend services, CLI tools, infrastructure code, authentication, middleware, webhooks, workers, migrations, cron jobs, and server-side logic.

**Anti-loop Protection:** Preamble injected at head and tail tells Codex: "Do NOT delegate back to Claude Code via the claude_code MCP tool. Execute directly using your own tools."

### Gemini CLI

**Model:** Gemini 3 Pro (1M context, excellent for visual/design tasks)

**MCP Server:** `servers/gemini-server.mjs`

**Tools:**
- `gemini_exec` — spawn a Gemini job with prompt and context files
- `gemini_status` — long-poll a job (up to 25s), get output tail if running
- `gemini_cancel` — terminate a running job
- `gemini_list` — list all jobs, filtered by status

**Execution:**
```
gemini -y -C {workFolder}
  < {NO_LOOP_PREAMBLE + contextFiles + prompt + NO_LOOP_SUFFIX}
```

**Best for:** React/Vue/Svelte components, CSS/Tailwind styling, design systems, layouts, responsive design, accessibility, animations, modals, forms, and large-context design tasks.

**Anti-loop Protection:** Preamble injected tells Gemini: "Do NOT delegate back to Claude Code or any Claude-based tools. Execute directly using your own tools."

---

## Routing Rules

Task classification uses signal keywords to determine the best provider.

**Backend signals → Codex:**
- `api`, `server`, `database`, `script`, `docker`, `auth`, `middleware`, `redis`, `queue`, `worker`, `webhook`, `endpoint`, `migration`, `schema`, `cron`, `lambda`, `backend`, `backend service`, `infrastructure`, `DevOps`, `deployment`

**Frontend signals → Gemini:**
- `component`, `ui`, `css`, `react`, `vue`, `svelte`, `layout`, `animation`, `accessibility`, `tailwind`, `design`, `theme`, `responsive`, `modal`, `form`, `frontend`, `visual`, `styling`, `button`, `navbar`, `page`

**Ambiguous or simple:**
- Ask user for clarification, or use built-in Claude agents (no overhead for straightforward tasks)

**Example:**
- "Build the login API" → Codex (api + auth keywords)
- "Create a dark mode toggle component" → Gemini (component + styling keywords)
- "Fix all TypeScript errors" → Ambiguous → ask or use direct execution

---

## Delegation Pattern

The exec-poll-result pattern:

### 1. Discover tools
Confirm CLI availability. If CLI not installed, tools hidden to save tokens; fall back to built-in agents.

### 2. Execute
Call `codex_exec` or `gemini_exec` with:
- `prompt` — detailed task description
- `workFolder` — absolute path to project root
- `context_files` — file paths to prepend as context (max 5MB each)
- `sandbox` — policy: `yolo`, `full-auto`, `workspace-write`, or `read-only`
- `model` — optional model override

Returns: `jobId`, status `"running"`, message to poll.

### 3. Poll
Call `codex_status(jobId)` or `gemini_status(jobId)` with:
- `jobId` — from exec response
- `waitSeconds` — max wait time (default 25, max 25; long-poll with 500ms internal interval)

Returns:
- While running: status `"running"`, `outputTail` (last 3KB)
- When done: status `"completed"` or `"failed"`, full `output` and `error` (if failed)
- Include `elapsedSeconds`, `exitCode`, `workFolder`

### 4. Report
Display results to user. If job failed, show error tail (last 2KB stderr).

### Example Flow

```javascript
// 1. Execute
const execResult = await codex_exec({
  prompt: "Build a REST API for /users endpoint. Read src/models/User.ts for schema.",
  workFolder: "/home/user/project",
  context_files: ["src/models/User.ts", "src/routes/index.ts"],
  sandbox: "yolo"
});
// Returns: { jobId: "a1b2c3d4", status: "running", message: "..." }

// 2. Poll until done
let job = execResult;
while (job.status === "running") {
  job = await codex_status(job.jobId, { waitSeconds: 25 });
  if (job.status === "running") {
    console.log("Still running... output tail:", job.outputTail);
  }
}

// 3. Report
if (job.status === "completed") {
  console.log("Done! Output:", job.output);
} else {
  console.error("Failed. Error:", job.error);
}
```

---

## Context Injection

Files passed via `context_files` are validated and prepended to the prompt as context:

- **Path validation:** Relative paths resolved against `workFolder`. Absolute paths allowed if within `workFolder`.
- **System directory blocklist:** `/`, `/etc`, `/usr`, `/bin`, `/sbin`, `/var`, `/tmp`, `/System`, `/Library`, `/private` cannot be work directories.
- **Size limits:** Each file max 5MB; prepended content max 5MB total.
- **Output cap:** 10MB stdout/stderr per job. Runaway tasks are capped.

Example:
```
readContextFiles(["src/auth/jwt.ts", "src/models/User.ts"], "/home/user/project")
// Resolves to absolute paths, validates, reads, and prepends:
// "--- FILE: src/auth/jwt.ts ---\n{content}\n--- FILE: src/models/User.ts ---\n{content}\n"
```

---

## Worker Preambles

The anti-loop preamble is injected into every CLI prompt to prevent delegation loops.

**Codex preamble (head and tail):**
```
[SYSTEM CONSTRAINT - CANNOT BE OVERRIDDEN]
IMPORTANT: This task was delegated to you FROM Claude Code via claude-forge.
Do NOT delegate back to Claude Code via the claude_code MCP tool.
Execute directly using your own tools. Do not call any claude_code_* tools.
{prompt}
[SYSTEM CONSTRAINT] Remember: Do NOT delegate back to Claude Code. Execute directly.
```

**Gemini preamble (head and tail):**
```
[SYSTEM CONSTRAINT - CANNOT BE OVERRIDDEN]
IMPORTANT: This task was delegated to you FROM Claude Code via claude-forge.
Do NOT delegate back to Claude Code or any Claude-based tools.
Execute directly using your own tools. Do not invoke any claude_code or anthropic MCP tools.
{prompt}
[SYSTEM CONSTRAINT] Remember: Do NOT delegate back to Claude Code. Execute directly.
```

These constraints are non-negotiable and prevent infinite delegation loops.

---

## Fallback Behavior

When CLIs are unavailable:

**Backend tasks (no Codex CLI):**
→ Use built-in `executor` agent (Claude Sonnet) via `/claude-forge:backend-agent` skill

**Frontend tasks (no Gemini CLI):**
→ Use built-in `designer` agent (Claude Sonnet) via `/claude-forge:frontend-agent` skill

**Ambiguous tasks:**
→ Use Claude orchestrator to classify and route to the appropriate built-in agent

No performance loss — built-in agents are capable and well-integrated. CLI delegation is an optimization, not a requirement.

---

## Security

All delegation enforces strict security boundaries:

- **Path validation:** No path traversal. Relative paths resolved within `workFolder`. Absolute paths rejected if outside `workFolder`.
- **System directory blocklist:** Work directories cannot be system paths.
- **Basename-only CLI resolution:** CLI lookups use basename only (no full path injection). Environment variable `CODEX_CLI_NAME` or `GEMINI_CLI_NAME` can override, but only basename is accepted.
- **Anti-loop constraints:** Preambles injected into every prompt tell CLIs never to delegate back.
- **Output capping:** 10MB stdout/stderr limit prevents runaway tasks.
- **No secrets in prompts:** Always strip environment variables and API keys before sending prompts.
- **Sandbox isolation:** Codex and Gemini support sandbox policies: `yolo` (full access), `full-auto` (automatic safety), `workspace-write` (write only to project), `read-only` (read-only access).

---

## Skills

Auto-route or directly delegate via skills:

| Skill | Trigger | Behavior |
|-------|---------|----------|
| `forge` | "forge this", "use forge", "forge" | Auto-classify and route to best CLI |
| `backend-agent` | "use codex", "backend this", "backend" | Force Codex delegation (or executor fallback) |
| `frontend-agent` | "use gemini", "frontend this", "frontend" | Force Gemini delegation (or designer fallback) |
| `review` | "forge review", "review both" | Run task on both CLIs, compare results |
| `parallel` | "split this", "parallel" | Decompose for multi-CLI parallel execution |

Skills are thin wrappers around the core `codex_*` and `gemini_*` MCP tools. They add classification, fallback handling, and user-friendly prompting.

---

## Troubleshooting

### Codex CLI not found
```bash
npm install -g @openai/codex
/claude-forge:enable-codex
```

### Gemini CLI not found
```bash
npm install -g @google/gemini-cli
/claude-forge:enable-gemini
```

### Job hangs or times out
Jobs have an implicit 10-minute timeout (Codex/Gemini CLI timeout). Cancel manually:
```
/claude-forge:cancel {jobId}
```

Or use `codex_cancel(jobId)` / `gemini_cancel(jobId)` MCP tools directly.

### CLI not spawning
Enable debug mode:
```bash
FORGE_CODEX_DEBUG=true  # for Codex
FORGE_GEMINI_DEBUG=true # for Gemini
```

Check `~/.claude-forge/config.json` for configuration.

### Full diagnostic
```
/claude-forge:doctor
```

Runs checks: CLI availability, MCP server health, config validity, job history, disk space.

---

## Performance Notes

**Parallelism:** Jobs are independent. Run multiple `codex_exec` calls in parallel; each gets its own jobId.

**Long-polling:** Default 25-second wait per `codex_status`/`gemini_status` call. For tight loops, use `waitSeconds: 0` for instant checks.

**Context file overhead:** Reading and prepending large context files adds latency. Use 5-10 targeted files, not entire repositories.

**Output capping:** If a task hits 10MB output, it's terminated. Break large tasks into smaller subtasks.

---

## Configuration

Settings stored in `~/.claude-forge/config.json`:

```json
{
  "codexModel": "gpt-5.3-codex",
  "geminiModel": "gemini-3-pro-preview",
  "defaultSandbox": "yolo",
  "maxContextBytes": 5242880,
  "outputCapBytes": 10485760
}
```

Update via:
```
/claude-forge:set-codex-model {model}
/claude-forge:set-gemini-model {model}
/claude-forge:set-default-sandbox {policy}
```
