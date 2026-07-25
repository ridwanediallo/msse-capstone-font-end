# Working Plan — Natural-Language-to-Reports System

A phased, incremental delivery plan for building the CrewAI multi-agent
text-to-SQL reporting system described in [README.md](./README.md).

**Philosophy:** start small, ship a thin vertical slice end-to-end, then grow.
Every phase produces something runnable and demoable before moving on.

---

## Stack Decisions

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | **React** (Vite) | SPA; fast dev server |
| Styling | **Ant Design** | Component library with built-in layout utilities |
| API | **Flask** (Python) | Thin API in front of the crew |
| Agent framework | **CrewAI** | Agents, Tasks, Tools, Crew, Process |
| Database (app) | **PostgreSQL** | Stores configs, catalog, conversation memory |
| Database (target) | **PostgreSQL** | The data source the crew queries (read-only) |
| LLM | OpenAI / Anthropic API | Per-agent |
| Vector DB (later) | Chroma | Only for large schemas (RAG) |

> The README's "Minimal Stack Example" suggests FastAPI/Streamlit; we deliberately
> use **React + Flask** per project preference. CrewAI is Python, so Flask fronts it cleanly.

---

## Kanban Board Setup (Do This First)

Create a GitHub Project (board view) to manage the tasks below.

**Suggested columns:** `Backlog` → `Ready` → `In Progress` → `In Review` → `Done`

**Suggested labels:** `phase-0` … `phase-9`, `frontend`, `backend`, `agents`, `infra`,
`db`, `docs`, `bug`, `good-first-task`.

Each numbered task below becomes a card. Keep cards small (≤ ~1 day of work).

---

## Milestones Overview

| Phase | Goal (deliverable) | Runnable outcome |
|-------|--------------------|------------------|
| 0 | Project & repo setup | Repo, board, empty scaffold runs |
| 1 | Hello-world full stack | React talks to Flask, both boot |
| 2 | Database foundation | Postgres up, migrations, sample data |
| 3 | First agent (walking skeleton) | One end-to-end text→SQL→result (direct DB tools) |
| 4 | MCP Server | CrewAI agents access DB via MCP; Claude Desktop can also query DB |
| 5 | Full CrewAI crew | 5-agent pipeline via MCP returns a report |
| 6 | Safety & guardrails | Query Guardian + read-only enforcement (via MCP server) |
| 7 | Reporting UI | Tables, charts, "View SQL", exports |
| 8 | Onboarding wizard | Connect/test/introspect a data source |
| 9 | Conversation memory | Follow-up rewriting + session history |

---

## Phase 0 — Project & Repository Setup

**Deliverable:** a clean repo with tooling, a Kanban board, and a runnable empty scaffold.

- [ ] 0.1 `git init`, add `.gitignore` (Python, Node, `.env`, `__pycache__`, `node_modules`)
- [ ] 0.2 Create GitHub repo and push initial commit
- [ ] 0.3 Create GitHub Project (Kanban board) with columns + labels above
- [ ] 0.4 Project layout:
      ```
      /frontend   (React + Vite + AntD)
      /backend    (Flask + CrewAI)
      /db         (migrations, seed SQL)
      /docs
      ```
- [ ] 0.5 Add `README` run instructions + this `WORKING_PLAN.md`
- [ ] 0.6 Verify `.env.example` covers all needed vars; keep real `.env` gitignored
- [ ] 0.7 (Optional) Pre-commit hooks: `black`/`ruff` (Python), `eslint`/`prettier` (JS)

---

## Phase 1 — Hello-World Full Stack

**Deliverable:** React frontend and Flask backend boot and talk to each other.

### Backend
- [ ] 1.1 Create Python venv, `requirements.txt` (Flask, flask-cors, python-dotenv)
- [ ] 1.2 Minimal Flask app with `GET /api/health` → `{ "status": "ok" }`
- [ ] 1.3 Enable CORS for the frontend dev origin

### Frontend
- [ ] 1.4 Scaffold React with Vite (`npm create vite@latest frontend -- --template react`)
- [ ] 1.5 Install & configure **Ant Design** (theme provider)
- [ ] 1.6 A single page that calls `/api/health` and shows the status (AntD `Card` + layout)

### Verify
- [ ] 1.8 Run both; confirm the page shows backend health. Commit.

---

## Phase 2 — Database Foundation

**Deliverable:** Postgres running with app schema + a sample target dataset.

- [ ] 2.1 Provision Postgres (local Homebrew or Docker Compose)
- [ ] 2.2 App DB schema (migrations): `data_sources`, `schema_catalog`, `conversations`, `turns`
- [ ] 2.3 Choose migration tool (Alembic or raw SQL in `/db`)
- [ ] 2.4 Seed a **sample target DB** (`customers`, `orders` from README example)
- [ ] 2.5 Create a **read-only** Postgres role for the Data Retriever
- [ ] 2.6 SQLAlchemy engine/session wiring in Flask
- [ ] 2.7 `GET /api/datasources` returns configured sources (empty at first)

---

## Phase 3 — Walking Skeleton (First Single-Shot Agent)

**Deliverable:** one plain-English question returns real rows — **no full crew yet**
(README "Pattern A"). Proves the end-to-end wiring before adding complexity.
Uses **direct DB tools** (not MCP) for fast iteration and validation.

- [ ] 3.1 Add LLM client (OpenAI/Anthropic) + key handling via `.env`
- [ ] 3.2 Build DB tools: `list_tables`, `describe_table`, `run_sql` (read-only)
- [ ] 3.3 Single LLM call: question + inline schema → one SQL query
- [ ] 3.4 Execute against sample DB, return rows as JSON
- [ ] 3.5 `POST /api/query { question }` → `{ sql, rows }`
- [ ] 3.6 Frontend: text input + results table (AntD `Table`), loading + error states
- [ ] 3.7 Demo: "total sales by region" returns correct rows. Commit.

---

## Phase 4 — MCP Server

**Deliverable:** standalone MCP server exposing the database as standardized tools.
CrewAI agents consume it via native MCP integration; Claude Desktop / Cursor can
also connect for dev and testing.

- [ ] 4.1 Add `mcp` SDK dependency; create `mcp_server/` package
- [ ] 4.2 MCP server entry point (stdio transport)
- [ ] 4.3 Tool: `list_tables` — list tables in the target database
- [ ] 4.4 Tool: `describe_table` — columns, types, constraints
- [ ] 4.5 Tool: `run_query` — read-only SQL execution (uses `data_retriever` role)
- [ ] 4.6 Tool: `get_schema` — full schema as CREATE TABLE statements
- [ ] 4.7 Dynamic data source resolution — reads connection info from `data_sources` table
- [ ] 4.8 Wire MCP server behind `POST /api/query` (replaces direct DB tools from Phase 3)
- [ ] 4.9 Claude Desktop / Cursor config instructions
- [ ] 4.10 Tests: tools return correct results against sample_target. Commit.

> **Why MCP here:** CrewAI has native MCP support (`crewai-tools[mcp]`). The MCP server
> becomes the single point of database access — agents never see credentials, and all
> safety enforcement (read-only, limits, allowlists) lives in one place.

### File structure

```
mcp_server/
├── __init__.py
├── __main__.py       # entry point: python -m mcp_server
├── server.py         # MCP server setup, tool registration
└── tools/
    ├── __init__.py
    ├── schema.py     # list_tables, describe_table, get_schema
    └── query.py      # run_query (read-only)
```

---

## Phase 5 — Full CrewAI Crew

**Deliverable:** replace the single call with the 5-agent sequential crew (README "Pattern B").
All agents access the database via the MCP server (Phase 4).

- [ ] 5.1 Add `crewai` dependency; define Crew + sequential Process
- [ ] 5.2 **Schema Analyst** agent + schema-context task
- [ ] 5.3 **SQL Author** agent (no DB tools)
- [ ] 5.4 **Query Guardian** agent (validation task — full checks in Phase 6)
- [ ] 5.5 **Data Retriever** agent (via MCP server, read-only)
- [ ] 5.6 **Report Composer** agent (summary + chart spec + table)
- [ ] 5.7 Wire crew behind `POST /api/query`; return report payload
      (`summary`, `table`, `chart`, `generated_sql`)
- [ ] 5.8 Frontend renders summary + table + generated SQL. Commit.

---

## Phase 6 — Safety & Guardrails

**Deliverable:** unsafe queries can never run (defense in depth).
Enforcement lives in the MCP server — single point of control.

- [ ] 6.1 Query Guardian: SELECT-only enforcement
- [ ] 6.2 Block `DROP`/`DELETE`/`UPDATE`/`INSERT`/DDL keywords
- [ ] 6.3 Require/inject a sensible `LIMIT`
- [ ] 6.4 Restrict to allowlisted tables/columns
- [ ] 6.5 SQL parser-based validation (not just regex)
- [ ] 6.6 Enforce read-only DB connection + statement timeout at driver level
- [ ] 6.7 Structured error surfaced to UI when a query is rejected
- [ ] 6.8 Tests: malicious prompts get rejected. Commit.

---

## Phase 7 — Reporting UI

**Deliverable:** a trustworthy, readable report view.

- [ ] 7.1 Chart rendering (bar/line/pie) driven by Report Composer's chart spec
- [ ] 7.2 "View SQL" toggle (transparency)
- [ ] 7.3 Narrative summary panel
- [ ] 7.4 Export to PDF and Excel
- [ ] 7.5 Polished loading/empty/error states (AntD components). Commit.

---

## Phase 8 — Onboarding / Setup Wizard

**Deliverable:** deterministic UI wizard to connect a data source (no LLM in the loop).

- [ ] 8.1 Step 1: choose DB type
- [ ] 8.2 Step 2: enter credentials
- [ ] 8.3 Step 3: **test connection** (`SELECT 1`), never persist untested
- [ ] 8.4 Step 4: auto-introspect schema (tables, columns, types, FKs)
- [ ] 8.5 Step 5: review/annotate (descriptions, synonyms, allowlist, sensitive cols)
- [ ] 8.6 Step 6: choose storage (inline vs. vector) by schema size
- [ ] 8.7 Step 7: **encrypt credentials at rest**, persist catalog, mark "ready"
- [ ] 8.8 Draft/resume + back/next affordances. Commit.

---

## Phase 9 — Conversation Memory & Follow-Ups

**Deliverable:** follow-up questions ("break that down by month") resolve correctly.

- [ ] 9.1 Persist per-turn records (raw q, resolved q, SQL, result shape, filters)
- [ ] 9.2 **Context Resolver** step: rewrite follow-up → standalone question
- [ ] 9.3 Show the resolved question in the UI for user confirmation
- [ ] 9.4 Scope memory to session + data source; cap to last N turns
- [ ] 9.5 Re-validate every turn through the Guardian (memory never bypasses safety). Commit.

---

## Future / Stretch (Not Core)

- Multiple concurrent data sources
- Vector DB / RAG for large schemas (hundreds of tables)
- Long-term memory (saved reports, "my usual dashboard", user preferences)
- Auth & multi-user, role-based access
- Caching of repeated queries; query cost estimation

---

## Definition of Done (per card)

- Code committed to a feature branch and merged via PR
- Runs locally without errors
- Relevant test(s) added/passing where applicable
- Kanban card moved to `Done` with a short note/screenshot

---

## Suggested Order of Attack

Phases are sequential, but within a phase, backend and frontend cards can be
parallelized. **Do not start Phase N+1 until Phase N is demoable.** The single
most important early win is **Phase 3's walking skeleton** — it de-risks
everything by proving the full path (UI → API → LLM → DB → UI) works before
investing in the multi-agent crew.

**Phase 4 (MCP Server)** is the architectural cornerstone: it becomes the single
point of database access for all agents. Every subsequent phase (crew, guardrails,
onboarding, memory) builds on top of it.
