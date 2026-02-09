---
name: ecomode
description: Token-efficient execution — prefer cheaper models, batch similar tasks
---

<Purpose>
Ecomode is a model-routing modifier. It overrides default model selection to prefer
cheaper, faster models. Use when budget matters or the task doesn't need opus-level
reasoning. Combines with other modes (eco ralph, eco autopilot, eco ultrawork).
</Purpose>

<Use_When>
- User says "eco", "ecomode", "budget", "cheap", "save tokens"
- Task is straightforward and doesn't need deep reasoning
- Running many parallel agents and want to minimize cost
</Use_When>

<Routing_Rules>

## Model Selection Override
| Default Tier | Ecomode Override | When to Escalate |
|-------------|-----------------|-----------------|
| opus        | sonnet          | Architecture decisions, security reviews |
| sonnet      | haiku           | Simple lookups, file discovery, formatting |
| haiku       | haiku           | Already cheapest |

## Decision Matrix
| Task Type | Default Model | Ecomode Model |
|-----------|--------------|---------------|
| Explore codebase | haiku | haiku |
| Read/search files | haiku | haiku |
| Simple implementation | sonnet | haiku |
| Standard implementation | sonnet | sonnet |
| Complex implementation | opus | sonnet |
| Architecture review | opus | sonnet |
| Security review | opus | opus (no downgrade) |
| Code review | sonnet | haiku |
| Test writing | sonnet | haiku |
| Bug investigation | sonnet | sonnet |

## Escalation Policy
If a haiku agent fails or produces low-quality output:
1. Retry with sonnet (automatic escalation)
2. If sonnet fails on something that needs opus → escalate

## Batch Optimization
- Group similar tasks into single agent calls where possible
- Example: 3 file reads → 1 agent reading all 3, not 3 separate agents
- Reduces overhead from agent spawn/context setup

</Routing_Rules>

<Combination>
Ecomode modifies other modes:
- `eco ralph` → Ralph loop with cheaper agents
- `eco autopilot` → Autopilot with budget-conscious routing
- `eco ultrawork` → Parallel execution with haiku/sonnet preference
- When both ecomode and ultrawork keywords are present, ecomode wins (cheaper routing)
</Combination>

<Token_Savings_Tips>
1. Use haiku for exploration before committing to implementation
2. Batch related file reads into single agent calls
3. Don't launch opus agents for simple tasks
4. Prefer Codex/Gemini CLIs when available (they don't consume Claude tokens)
5. Keep prompts concise — context is expensive
</Token_Savings_Tips>
