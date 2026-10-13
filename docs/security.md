# Security Documentation

## Threat Model

### Assets
- User credentials (passwords)
- JWT tokens
- Uploaded warranty PDFs
- Claim assessment records
- Audit logs

### Threats Considered

| Threat | Mitigation |
|--------|-----------|
| Password theft | bcryptjs hashing (12 rounds); never stored in plaintext |
| JWT forgery | Server-side secret from env; expiration enforced |
| Privilege escalation | Role checked on every protected route via middleware |
| IDOR (access other users' data) | Ownership checks in claim/policy services |
| Malicious file upload | PDF magic byte validation; MIME type filter; size + page limits; random stored filename |
| Path traversal | Uploads stored outside public directory; paths never derived from user input |
| SQL injection | Prisma ORM with parameterised queries throughout |
| XSS | React escapes by default; `helmet` sets Content-Security-Policy |
| Brute-force login | `express-rate-limit` on `/api/auth/login` (20 req / 15 min) |
| Secrets in source control | `.env` in `.gitignore`; `.env.example` with placeholders |
| Log injection / data leakage | Logger redacts passwords, tokens, and secrets |

## Access Control Matrix

| Endpoint | ADMIN | REVIEWER | CUSTOMER | Unauthenticated |
|----------|-------|----------|----------|-----------------|
| POST /api/auth/login | ✓ | ✓ | ✓ | ✓ |
| GET /api/auth/me | ✓ | ✓ | ✓ | ✗ |
| POST /api/policies (upload) | ✓ | ✓ | ✗ | ✗ |
| GET /api/policies | ✓ | ✓ | ✓ (active+confirmed only) | ✗ |
| POST /api/policies/:id/confirm | ✓ | ✓ | ✗ | ✗ |
| POST /api/claims/check | ✓ | ✓ | ✓ | ✗ |
| GET /api/claims | ✓ (all) | ✓ (all) | ✓ (own only) | ✗ |
| PATCH /api/claims/:ref/review | ✓ | ✓ | ✗ | ✗ |
| GET /api/admin/audit-logs | ✓ | ✗ | ✗ | ✗ |
| GET /api/admin/users | ✓ | ✗ | ✗ | ✗ |

## File Upload Security

1. **MIME type filter** — multer `fileFilter` rejects non-PDF MIME types
2. **Magic bytes check** — service validates PDF header bytes (`%PDF`)
3. **Size limit** — configurable via `UPLOAD_MAX_SIZE_MB` (default 10 MB)
4. **Random filename** — original filename never used for storage (24-byte hex random)
5. **Outside public directory** — uploads stored in `backend/uploads/`, never served statically
6. **SHA-256 hash** — stored for integrity checking and deduplication support
7. **Error handling** — parse errors caught and returned as 422; no file left in corrupt state

## Authentication Design

- Passwords hashed with **bcryptjs** at 12 salt rounds
- JWT signed with `HS256` using secret from `JWT_SECRET` env var (minimum 32 chars)
- Tokens expire per `JWT_EXPIRES_IN` (default 8 hours)
- Token stored in `localStorage` on client (trade-off: XSS risk vs. simplicity for demo)
- Logout clears `localStorage`; server returns 200 (stateless JWT — no server-side denylist in MVP)

## Prototype Limitations

This is a **local student prototype**, not production-hardened software:

- No TLS — run behind a reverse proxy (nginx/Caddy) with TLS in production
- JWT stored in localStorage — use `HttpOnly` cookies for production
- No token revocation — implement a denylist (Redis) for production logout
- No multi-factor authentication
- SQLite is not suitable for high-concurrency production workloads
- AWS security services (GuardDuty, WAF, CloudTrail) are documented but not implemented
- Rate limiting is per-process; use Redis-backed store for multi-instance deployments
