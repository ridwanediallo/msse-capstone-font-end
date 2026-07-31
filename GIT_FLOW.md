# Git Flow Conventions

## Branch Types

| Branch | Purpose | Lifetime |
|--------|---------|----------|
| `main` | Stable, production-ready code | Permanent |
| `dev` | Integration branch — all features merge here first | Permanent |
| `feat/*` | Feature branches — one per feature/phase | Temporary (delete after merge) |
| `fix/*` | Bug fix branches | Temporary (delete after merge) |

## Branch Naming

```
feat/phase-X-description      # New features (e.g., feat/phase-9-conversation-memory)
fix/issue-description         # Bug fixes (e.g., fix/sql-formatting-subqueries)
docs/description              # Documentation only
```

## Workflow

### Feature Development
```
1. Create feat branch from dev
   git checkout dev
   git pull
   git checkout -b feat/phase-X-description

2. Work on the feature
   git add .
   git commit -m "feat: description"

3. Push feat branch
   git push origin feat/phase-X-description

4. Create PR: feat → dev
   - Review code
   - Merge via GitHub

5. Delete feat branch after merge
   git checkout dev
   git pull
   git branch -d feat/phase-X-description
   git push origin --delete feat/phase-X-description
```

### Release to Main
```
1. Create PR: dev → main
   - Review all changes since last release
   - Merge via GitHub

2. Tag release (optional)
   git checkout main
   git pull
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
```

## Commit Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Phase 9 — Conversation memory & follow-ups
fix: correct SQL formatting for subqueries
refactor: extract context resolver to separate module
docs: update GIT_FLOW.md with conventions
test: add tests for context resolver
chore: update dependencies
```

## PR Convention

- Use GitHub Pull Requests — never push directly to `main` or `dev`
- PR title should match commit format (e.g., `feat: Phase 9 — Conversation memory`)
- PR description should reference the phase/task being implemented
- Squash merge preferred for clean history

## Current State

### Backend (`msse-capstone-backend-`)
- `main` — stable releases
- `dev` — integration branch
- Feature branches: `feat/database_foundation`, `feat/phase-3-walking-skeleton`, etc.

### Frontend (`msse-capstone-font-end`)
- `main` — stable releases
- `dev` — integration branch
- Feature branches: `feat/phase-9-conversation-memory`, etc.
