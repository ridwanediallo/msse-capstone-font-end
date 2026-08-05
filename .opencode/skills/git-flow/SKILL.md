---
name: git-flow
description: Use when starting a new task, phase, or pull request, or when branching, committing, or merging in this repo. Encodes the GIT_FLOW.md conventions: branch from fresh dev, kebab-case type/description branches, Conventional Commits, and the two-repo backend + frontend PR loop with reviewer approval.
---

# Git Flow

`GIT_FLOW.md` in this repo is the source of truth for conventions. Read it
(and the backend `WORKING_PLAN.md` for phase context) before starting any task.

## Rule of thumb

Never commit, push, or merge unless the user explicitly asks. PRs are merged
on GitHub only, never locally, and never without reviewer approval.

## Workflow

1. **Read the ground truth.** `GIT_FLOW.md` (branch types, naming, commit
   format, PR conventions) and the relevant phase notes in
   `WORKING_PLAN.md`.

2. **Branch from a fresh `dev`.**
   ```bash
   git checkout dev && git pull
   git checkout -b <type>/<description>   # e.g. feat/phase-11-frontend-auth
   ```
   Branch names are lowercase kebab-case, `type/description`. Pick `type` by
   the PR's dominant change: `feat`, `fix`, `refactor`, `docs`, `test`,
   `chore`, `style`, `perf`, `revert`.

3. **Two-repo phase work.** This project spans the backend
   (`msse-capstone-backend-`, source of truth for the API contract) and the
   frontend (`msse-capstone-font-end`). Create a **separate branch per repo**,
   each opened as its own PR to that repo's `dev`. Keep the backend PR
   (contract) and frontend PR (consumer) cross-referenced in their bodies.

4. **Commit with Conventional Commits.** Stage only intended files; never
   commit secrets (`.env`, keys). Match the message style used in the repo's
   history:
   ```
   feat: Phase 11D — frontend auth UX
   fix: correct SQL formatting for subqueries
   docs: update AGENTS.md with GIT_FLOW gate
   ```

5. **Verify before PR.** Run the repo's checks and keep them green:
   - Backend: `python -m pytest tests` (summary prints last — grep it)
   - Frontend: `npm test` and `npm run lint`
   Only then push and open the PR.

6. **Open the PR against `dev`.** Title matches the commit format; body
   references the phase/task and (for cross-repo work) the related PR. Request
   review, then **wait for reviewer approval before merging**. Merge via GitHub
   (squash preferred).

7. **Clean up after merge.** Delete the merged branch locally and on the remote:
   ```bash
   git checkout dev && git pull
   git branch -d <branch>
   git push origin --delete <branch>
   ```
