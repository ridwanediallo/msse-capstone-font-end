# 0001. CSRF token header for mutating API requests

- **Status:** accepted
- **Date:** 2026-08-21
- **Deciders:** capstone project owner
- **Mirrors:** backend `docs/adr/0001-csrf-protection-for-cookie-auth.md`

## Context

Auth is a server-side session cookie sent with `credentials: 'include'` on
every `apiFetch` call. The backend now enforces CSRF protection
(Flask-WTF `CSRFProtect`): all `POST/PUT/PATCH/DELETE` requests require an
`X-CSRFToken` header matching a session-bound token issued by
`GET /api/v1/auth/csrf`.

## Decision

CSRF handling is centralized in `src/api.js`:

- `ensureCsrfToken()` lazily fetches `/auth/csrf` once, caching the token in a
  non-`HttpOnly` cookie (`csrf_token`) and deduplicating concurrent fetches.
- `apiFetch` attaches `X-CSRFToken` automatically on non-GET requests unless
  the caller supplies one explicitly.
- No store or component changes required — every call already goes through
  `apiFetch` (repo convention).

## Consequences

- New stores/endpoints get CSRF automatically; never bypass `apiFetch`.
- Tests: MSW handlers include `/auth/csrf`; `src/api.test.js` covers the
  attach/fetch/dedupe behavior.
- If a future client is not a browser SPA, it must implement the same
  fetch-and-echo flow.
