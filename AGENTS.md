# AGENTS.md — Frontend (Natural-Language-to-Reports)

## Before You Start

**Read `GIT_FLOW.md` before starting any task.** It defines the branching,
committing, PR, and merge conventions (branch from fresh `dev`, kebab-case
`type/description` branches, Conventional Commits, PR → reviewer approval →
merge on GitHub). Following it is mandatory for all work in this repo.

## Architecture Change Policy

Any change that impacts the architecture must be documented in an ADR
(Architecture Decision Record) under `docs/adr/` **before merge**. This applies
to:

- Stack or infrastructure choices (frameworks, state management, charting, build tooling)
- App-level data-flow patterns: new global stores, routing guard strategy,
  API client mechanics (`src/api.js`)
- API contract shape consumed from the backend: endpoints, request/response
  fields, error codes, auth/session flow
- Security-relevant behavior: credential handling, token/cookie usage, XSS-sensitive rendering

Process:

1. Copy `docs/adr/0000-template.md` to `docs/adr/NNNN-kebab-title.md`
   (next free number, kebab-case).
2. Fill Context / Decision / Consequences concisely — one screen max.
3. Link the ADR in the PR description; reviewers should block merges without it.
4. Update this file's Conventions/Gotchas if they change.

Implementation-level fixes (bug fixes, styles, component tweaks, tests) do not
need an ADR — when unsure, ask in the PR. The backend repo
(`querable-backend`) carries the same policy; a cross-repo contract change
needs an ADR in both. This file is loaded automatically by coding agents, which
is what makes the policy enforceable in practice — keep it accurate.

## What This Is

React 19 + Vite SPA for a CrewAI multi-agent text-to-SQL reporting system.
Auth is session-cookie based (HttpOnly cookies set by the backend): `apiFetch`
in `src/api.js` sends `credentials: 'include'` on every request. The backend
(`querable-backend`, see its `WORKING_PLAN.md`) is the source of truth
for the API contract — mirror it exactly.

## Quick Commands

```bash
npm install            # first-time setup
npm run dev            # Vite dev server
npm test               # vitest (run once)
npm test -- src/...    # run one test file
npm run lint           # oxlint
npm run build          # production build
```

## Stack / Layout

```
src/
  App.jsx              # routes + auth bootstrap (fetchMe) + RequireAdmin guard
  api.js               # apiUrl(path) + apiFetch(path, opts) with credentials:'include'
  main.jsx             # entry
  index.css            # global styles (CSS variables, see :root)
  stores/              # zustand stores
    useAuthStore.js        # user, isAuthenticated, guestQuota; fetchMe/login/logout
    useQueryStore.js       # turns, conversations, submitQuery, suggestions
    useDatasourceStore.js  # datasources, selection, CRUD, schema
  components/          # TopBar, Sidebar, DatasourceWizard, ChartSpec
  pages/               # QueryPage, DatasourcePage, LoginPage
  test/
    setup.js           # jest-dom + MSW server + antd jsdom polyfills
    mocks/handlers.js  # MSW REST handlers for /api/v1/*
    mocks/server.js
```

## Conventions

- **UI library**: antd v6 (components), `@ant-design/icons`, zustand for state,
  react-router-dom v7, no TypeScript.
- **API calls**: always go through `apiFetch` from `src/api.js` — never raw
  `fetch`. New endpoints must use it so the auth cookie is sent. Mutating
  requests automatically get the `X-CSRFToken` header (CSRF is enforced by the
  backend; see `docs/adr/0001`).
- **Route guards**: `/datasources` is admin-only (`RequireAdmin` in `App.jsx`).
  Guests see the query page with a quota banner; sign-in is at `/login`.
- **State**: component-free state in zustand stores under `src/stores/`; new
  state that crosses components belongs in a store, not props.
- **Tests**: vitest + @testing-library/react + MSW. Extend
  `src/test/mocks/handlers.js` when adding endpoints. Run `npm test` before
  finishing; keep the suite green.
- **Styles**: plain CSS in `src/index.css` using the `:root` variables — do not
  introduce a CSS-in-JS or Tailwind without updating this doc.
- **API contract**: backend error envelope is `{ error, code, details? }`;
  queries return `guest_quota: { limit, used, remaining }` for guests. Mirror
  the backend shapes exactly.

## Gotchas

- MSW intercepts `/api/v1/*` in tests; unhandled requests error in
  `setup.js`. Always register new handlers.
- ChartSpec renders an antv/G2 canvas that jsdom can't rasterize — tests that
  render it must `vi.mock('../components/ChartSpec', ...)` (see QueryPage.test).
- antd v5/v6 components need jsdom polyfills already in `src/test/setup.js`.
- Two distinct env vars: `VITE_API_URL` = dev-only proxy target in
  `vite.config.js` (never reaches the client bundle); `VITE_API_BASE` =
  backend origin compiled into the client for production builds
  (`src/api.js`, empty in dev). Don't swap them — see `.env.example`.

## Phase Status

Phase 11 frontend (11D auth UX) in progress: auth store, login page, guest
quota banner, admin-gated datasource page. See backend `WORKING_PLAN.md` for
the phase roadmap.
