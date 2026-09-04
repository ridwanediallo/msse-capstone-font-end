# Working Plan — Frontend (querable-frontend)

This is the **frontend counterpart** to the backend's consolidated plan at
[querable-backend/WORKING_PLAN.md](../querable-backend/WORKING_PLAN.md).
That file is the source of truth for architecture decisions, phase tracking,
cross-cutting workstreams, risk register, and remaining work.

Everything below is frontend-specific.

---

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **React 19** (Vite 8) | SPA |
| Styling | **Ant Design 6** | Components + layout |
| Charts | **@ant-design/charts 2** | Bar, line, pie, scatter, column |
| State | **Zustand 5** | Two stores: query + datasource |
| Router | **react-router-dom 7** | Two routes: `/` (query), `/datasources` |
| SQL display | **sql-formatter** + **highlight.js** | Formatted + syntax-highlighted SQL |
| Export PDF | **jspdf** + **html2canvas** | Report panel → canvas → PDF |
| Export Excel | **xlsx** | JSON → worksheet → .xlsx |
| Lint | **oxlint** | `npm run lint` |

---

## Frontend File Map

```
src/
├── App.jsx                         # Root: BrowserRouter, shell layout
├── main.jsx                        # Entry point
├── index.css                       # Global styles + design tokens
├── components/
│   ├── Sidebar.jsx                 # Brand, "New session", RECENT list, user
│   ├── TopBar.jsx                  # Datasource pill, History drawer
│   └── DatasourceWizard.jsx        # 5-step onboarding modal wizard
├── pages/
│   ├── QueryPage.jsx               # Main query UI — bubbles, chips, charts, SQL view, exports
│   └── DatasourcePage.jsx          # Datasource list + add/delete/refresh
└── stores/
    ├── useQueryStore.js            # submitQuery, conversations, load/delete session
    └── useDatasourceStore.js       # CRUD datasources, test/introspect
```

---

## Completed Features

| Area | What ships | Key files |
|------|-----------|-----------|
| **Query** | Text input (Enter to send), conversation thread, user bubbles, report panels | `QueryPage.jsx` |
| **Charts** | Bar/line/pie/scatter/column driven by `chart_spec` from backend | `QueryPage.jsx:21-27,173-200` |
| **SQL view** | Toggle, syntax highlighting, copy button | `QueryPage.jsx:272-283` |
| **Data view** | Toggle, paginated AntD Table, row count + execution time | `QueryPage.jsx:285-295` |
| **KPIs** | Cards from `kpis[]` with trend (green/red), fallback derivation from rows | `QueryPage.jsx:59-87,210-227` |
| **Pipeline chips** | Animated step progression while loading | `QueryPage.jsx:89-110,302-320` |
| **Suggestions** | NO_QUERY → suggestion chips user can click | `QueryPage.jsx:37-46,396-409` |
| **Dark mode** | System-following `data-theme` toggle (localStorage) + antd dark algorithm | `ThemeProvider.jsx`, `TopBar.jsx`, `index.css` |
| **KPI polish** | Animated count-up, number/currency/percent re-formatting, trend arrows | `KpiCard.jsx`, `lib/kpiFormat.js` |
| **Loading skeletons** | Shimmer KPI/chart/narrative placeholders while a report runs | `QueryPage.jsx` (`LoadingPanel`) |
| **Exports** | PDF (report panel → html2canvas → jspdf) and Excel (rows → xlsx) | `QueryPage.jsx:150-171` |
| **Sidebar** | "Queryable" brand, New session, RECENT list with active highlight | `Sidebar.jsx` |
| **TopBar** | Datasource pill with status dot + dropdown, History drawer | `TopBar.jsx` |
| **History** | Drawer listing sessions (turn count + timestamp), load/delete | `TopBar.jsx:73-126` |
| **Wizard** | 5-step: DB type → credentials → test → review schema → save | `DatasourceWizard.jsx` |
| **Datasources** | CRUD table, refresh schema, status tags | `DatasourcePage.jsx` |

---

## API Contract (with Backend)

All API calls go through Vite proxy to `localhost:5001`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/query` | POST | Submit question (body: `{ question, conversation_id? }`) |
| `/api/conversations` | GET | List recent sessions |
| `/api/conversations/:id` | GET | Load session turns |
| `/api/conversations/:id` | DELETE | Delete session |
| `/api/datasources` | GET | List datasources |
| `/api/datasources` | POST | Create datasource |
| `/api/datasources/:id` | DELETE | Delete datasource |
| `/api/datasources/test-connection` | POST | Test DB credentials |
| `/api/datasources/:id/introspect` | POST | Refresh schema catalog |

**Query response shape:**

```json
{
  "summary": "string",
  "chart_spec": { "type": "bar|line|pie|scatter", "x": "col", "y": "col" },
  "kpis": [{ "label": "TOP REVENUE", "value": "$84k", "trend": "up" }],
  "sql": "SELECT ...",
  "rows": [{ "col": "val" }],
  "row_count": 10,
  "execution_time": 2.34,
  "no_query": false,
  "conversation_id": "uuid",
  "turn_id": "uuid",
  "question_resolved": "string | null"
}
```

---

## Remaining Frontend Work

See backend `WORKING_PLAN.md` [Remaining Work](../querable-backend/WORKING_PLAN.md#remaining-work)
section — frontend tasks are tracked there alongside backend counterparts.

High-level frontend-specific stretch items:
- [ ] Responsive / mobile layout pass
- [ ] Chart type heuristics for edge cases (see backend `crew/pipeline.py`)
- [x] Chart color consistency across sessions
- [ ] Keyboard shortcuts (Cmd+Enter, etc.)
- [x] Dark mode toggle
- [x] KPI animations + number formatting
- [x] Loading skeletons

---

## Local Dev

```bash
npm install        # first time or after pulling
npm run dev        # starts on :5173, proxies /api → :5001
npm run build      # production build
npm run lint       # oxlint
```
