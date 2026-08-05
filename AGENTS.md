# AGENTS.md — Frontend (Natural-Language-to-Reports)

## Before You Start

**Read `GIT_FLOW.md` before starting any task.** It defines the branching,
committing, PR, and merge conventions (branch from fresh `dev`, kebab-case
`type/description` branches, Conventional Commits, PR → reviewer approval →
merge on GitHub). Following it is mandatory for all work in this repo.

## What This Is

React 19 + Vite SPA for a CrewAI multi-agent text-to-SQL reporting system.
Auth is session-cookie based (HttpOnly cookies set by the backend): `apiFetch`
in `src/api.js` sends `credentials: 'include'` on every request. The backend
(`msse-capstone-backend-`, see its `WORKING_PLAN.md`) is the source of truth
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
  `fetch`. New endpoints must use it so the auth cookie is sent.
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
- `src/api.js` reads `VITE_API_BASE` (empty in dev) — the Vite proxy handles
  the backend URL.

## Phase Status

Phase 11 frontend (11D auth UX) in progress: auth store, login page, guest
quota banner, admin-gated datasource page. See backend `WORKING_PLAN.md` for
the phase roadmap.
