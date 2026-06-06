# Security Remediation Checklist

This file lists prioritized security fixes and commands to run locally.

Short-term (weeks)

- Add server-side HTML sanitization or enforce markdown + safe renderer for `NewsPost.body`.
- Tighten CORS origins and review `credentials: true` usage.
- Add ESLint security plugins and integrate security linting into CI.
- Configure Dependabot (already added) and enable automated PR testing.

Long-term (quarter)

- Consider RS256 key pair for JWT and key rotation via secret manager.
- Add structured logging and integrate an error-monitoring service (Sentry/Datadog).
- Add audit trails for admin actions and sensitive changes.

Useful local commands

Run full checks locally:

```bash
npm ci
npm audit --audit-level=high
npm run lint
npm run type-check
```

Run a permissive audit to see all issues:

```bash
npm audit --json > npm-audit.json && jq . npm-audit.json
```