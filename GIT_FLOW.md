# Git Flow Conventions

> The backend `msse-capstone-backend-/GIT_FLOW.md` is the source of truth; this
> copy is kept in sync for local reference.

## Branch Types

| Branch | Purpose | Lifetime |
|--------|---------|----------|
| `main` | Stable, production-ready code | Permanent |
| `dev` | Integration branch — all features merge here first | Permanent |
| `feat/*` | New features | Temporary (delete after merge) |
| `fix/*` | Bug fixes | Temporary (delete after merge) |
| `refactor/*` | Code restructuring with no behavior change | Temporary (delete after merge) |
| `docs/*` | Documentation only | Temporary (delete after merge) |
| `test/*` | Adding or fixing tests | Temporary (delete after merge) |
| `chore/*` | Tooling, dependencies, housekeeping | Temporary (delete after merge) |
| `style/*` | Formatting / non-functional style changes | Temporary (delete after merge) |
| `perf/*` | Performance improvements | Temporary (delete after merge) |
| `revert/*` | Reverting a previous change | Temporary (delete after merge) |

## Branch Naming

Use `type/description` in lowercase kebab-case (hyphens, not underscores).
Choose the type by the PR's dominant change; if a PR mixes types, pick the
most significant one (e.g. a feature that fixes a small bug on the way is `feat/`).

```
feat/phase-X-description      # New features (e.g., feat/phase-9-conversation-memory)
fix/issue-description         # Bug fixes (e.g., fix/sql-formatting-subqueries)
refactor/toggle-single-view   # Refactors (e.g., refactor/report-toggle-single-view)
docs/git-flow-conventions     # Documentation only
test/query-routes-filter      # Test-only changes
chore/dependency-update       # Housekeeping
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
   - Request review
   - Wait for reviewer approval before merging
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
- Never merge a PR that has not been approved by a reviewer
- PR title should match commit format (e.g., `feat: Phase 9 — Conversation memory`)
- PR description should reference the phase/task being implemented
- Squash merge preferred for clean history
