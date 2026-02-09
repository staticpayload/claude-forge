---
name: security-review
description: Comprehensive security audit — OWASP Top 10, secrets detection, auth review
---

<Purpose>
Systematic security audit covering OWASP Top 10 vulnerabilities, secrets detection,
input validation, authentication/authorization, and dependency vulnerabilities.
Produces severity-classified findings with remediation guidance.
</Purpose>

<Use_When>
- User says "security review", "security audit", "check for vulnerabilities"
- Before deploying to production
- After implementing auth, payment, or data handling features
</Use_When>

<Scan_Checklist>

### OWASP Top 10
| ID | Category | What to Check |
|----|----------|---------------|
| A01 | Broken Access Control | Missing auth checks, IDOR, privilege escalation |
| A02 | Cryptographic Failures | Weak hashing, plaintext storage, insecure transport |
| A03 | Injection | SQL, NoSQL, OS command, LDAP, XSS injection |
| A04 | Insecure Design | Missing threat modeling, business logic flaws |
| A05 | Security Misconfiguration | Default configs, verbose errors, open cloud storage |
| A06 | Vulnerable Components | Known CVEs in dependencies |
| A07 | Auth Failures | Weak passwords, missing MFA, session management |
| A08 | Data Integrity Failures | Insecure deserialization, unsigned updates |
| A09 | Logging Failures | Missing audit trail, sensitive data in logs |
| A10 | SSRF | Unvalidated URLs, internal network access |

### Secrets Detection
- Hardcoded API keys, passwords, tokens
- .env files in version control
- Credentials in config files, comments, or logs
- Private keys or certificates

### Input Validation
- All user inputs sanitized before use
- SQL parameterized queries (no string concatenation)
- HTML encoding for output (XSS prevention)
- File upload validation (type, size, name)

### Authentication/Authorization
- Authentication on all protected routes
- Authorization checks at data access layer
- Session management (secure cookies, expiry, rotation)
- Rate limiting on auth endpoints

### Dependencies
- Run `npm audit` / `pip audit` / `cargo audit`
- Check for known CVEs
- Identify outdated packages with security patches

</Scan_Checklist>

<Remediation_Priority>
| Severity | Timeline | Examples |
|----------|----------|---------|
| CRITICAL | Immediate | RCE, SQL injection, exposed secrets, auth bypass |
| HIGH | 24 hours | XSS, CSRF, privilege escalation, weak crypto |
| MEDIUM | 1 week | Missing rate limiting, verbose errors, weak session |
| LOW | Planned | Outdated deps (no CVE), missing headers, logging gaps |
| INFO | Backlog | Best practice suggestions, hardening opportunities |
</Remediation_Priority>

<Execution>
1. Identify scope (all files or specific paths)
2. Launch security-reviewer agent (opus model for thoroughness)
3. Run automated scans (npm audit, grep for secrets patterns)
4. Cross-validate critical findings with Codex if available
5. Produce report with remediation for each finding
</Execution>
