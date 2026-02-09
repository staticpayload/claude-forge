---
name: code-review
description: Comprehensive code review with severity-rated feedback across multiple dimensions
---

<Purpose>
Run a thorough code review covering security, quality, performance, and best practices.
Produces severity-rated findings with actionable recommendations. Can delegate to
Codex for cross-validation on critical findings.
</Purpose>

<Use_When>
- User says "review code", "code review", "review this", "review PR"
- Before merging significant changes
- After large refactors or new feature implementations
</Use_When>

<Review_Dimensions>

### Security (CRITICAL priority)
- Input validation and sanitization
- Authentication/authorization checks
- SQL injection, XSS, CSRF vulnerabilities
- Hardcoded secrets, credentials, API keys
- Dependency vulnerabilities

### Code Quality
- Logic correctness and edge cases
- Error handling completeness
- Naming conventions and readability
- DRY violations and code duplication
- SOLID principles adherence

### Performance
- Algorithm complexity (O(n) analysis)
- Memory usage and leaks
- Unnecessary re-renders (frontend)
- N+1 queries (backend)
- Missing caching opportunities

### Best Practices
- Framework conventions followed
- Test coverage for new code
- Documentation for public APIs
- Backward compatibility
- Accessibility (frontend)

### Maintainability
- Complexity metrics (cyclomatic)
- Coupling between modules
- Cohesion within modules
- Abstraction appropriateness
- Future extensibility

</Review_Dimensions>

<Severity_Ratings>
- **CRITICAL:** Security vulnerabilities, data loss risks, crashes. Fix before merge.
- **HIGH:** Logic bugs, missing error handling, performance issues. Should fix before merge.
- **MEDIUM:** Code quality issues, minor performance concerns. Fix soon.
- **LOW:** Style issues, naming suggestions, minor improvements. Nice to have.
</Severity_Ratings>

<Output_Format>
```markdown
# Code Review: [scope description]

## Summary
- **Verdict:** APPROVE | REQUEST CHANGES | COMMENT
- **Findings:** N critical, N high, N medium, N low

## Critical Findings
### [Finding Title]
**File:** `path/to/file.ts:42`
**Severity:** CRITICAL
**Category:** Security
**Issue:** [Description]
**Fix:** [Concrete suggestion with code]

## High Findings
...

## Medium Findings
...

## Low Findings
...

## Positive Notes
- [Good patterns observed]
```
</Output_Format>

<Execution>
1. Identify the scope (files to review via git diff or user specification)
2. Launch parallel review agents:
   - Security reviewer (check OWASP, secrets, auth)
   - Quality reviewer (logic, patterns, DRY)
   - Performance reviewer (if applicable)
3. If Codex available: cross-validate critical findings
4. Synthesize all findings into unified report
5. Assign verdict: APPROVE (0 critical, 0 high) | REQUEST CHANGES | COMMENT
</Execution>
