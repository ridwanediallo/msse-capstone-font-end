# Admin Console — Users — UI Spec

Handoff spec for implementation. Stack: React + TypeScript, Ant Design 5, Emotion CSS,
Zustand, ahooks, i18next. Match the visual language of the existing app shell (see
"Design language" below) — do not introduce a new theme.

---

## 1. Scope

A new admin-only section of the app where an admin manages team member accounts:
invite, view, change role, deactivate/reactivate, revoke session. Entry point is a
"Back to app" link at the top of a left nav that mirrors the existing sidebar
(logo, nav list, user identity footer).

Route: `/admin/users` (nested under an `/admin` layout with its own left nav).
Access: gated to `role === "admin"`. Non-admins hitting the route get redirected
to `/` (do not render a 403 page with visible admin UI structure).

---

## 2. Design language (match existing app)

- **Logo mark**: 32px rounded-square, blue→teal gradient background, white server-rack icon centered.
- **Headline font**: serif (the app's existing `--font-voice` token), used only for
  page/section titles (e.g. "Users"), never for body text or table content.
- **Body font**: existing sans-serif app font for everything else.
- **Buttons**: pill-shaped (`border-radius: 20px`), bordered, white background by default.
  Primary/emphasis actions get a filled `--surface-2` background, same border radius.
- **Badges/tags**: pill-shaped, small (12px text), colored by semantic meaning
  (see color table below) — reuse Ant Design `Tag` with `bordered={false}` and
  custom background/text color pairs, not Ant's default tag palette.
- **Avatars**: circular, 28px, initials (first + last name initial), background
  `--bg-pro` / text `--text-pro` token pairing already used in the app's user
  identity chip (bottom-left of sidebar in the existing chat view).
- **Borders**: hairline (`0.5px solid var(--border)`) throughout — cards, table
  rows, dividers. No drop shadows.
- **Status dots**: 8px filled circle preceding status text (green = active,
  amber = pending, gray = deactivated).

### Color/semantic mapping

| Meaning | Dot/text color | Badge bg |
|---|---|---|
| Admin role | — | `--bg-accent` / `--text-accent` |
| Member role | — | `--surface-2` / `--text-secondary`, hairline border |
| Active status | `--text-success` | — |
| Pending invite | `--text-warning` | — |
| Deactivated | `--text-muted` | — |

---

## 3. Layout

Two-column layout inside the `/admin` shell:

```
┌─────────────┬──────────────────────────────────────────┐
│ Left nav    │ Main content                              │
│ (260px)     │                                            │
│             │  Header row: "Users" (serif) ── actions   │
│ logo        │  Search input (240px, pill)                │
│ ← Back to   │  Table                                     │
│   app       │  ┌──────────────────────────────────────┐ │
│             │  │ Name │ Role │ Status │ Last login │ … │ │
│ ADMIN       │  └──────────────────────────────────────┘ │
│ CONSOLE     │                                            │
│  Users      │  [Detail Drawer opens over this, right-    │
│  Datasource │   anchored, on row click]                  │
│    access   │                                            │
│  Audit log  │                                            │
│             │                                            │
│ user footer │                                            │
└─────────────┴──────────────────────────────────────────┘
```

- Left nav width: fixed 260px, background `--surface-1`.
- Nav items: icon + label, active item gets `--surface-2` background + hairline
  border, inactive items plain text `--text-secondary`.
- Main content: padding 20px 28px, no max-width constraint beyond the app's
  existing content container if one exists.
- User identity footer pinned to bottom of nav, same pattern as existing sidebar
  (avatar circle + email, hairline divider above it).

---

## 4. Components

### 4.1 `AdminLayout`
Wraps `/admin/*` routes. Renders left nav + `<Outlet />`. Guards on `role === "admin"`.

### 4.2 `UsersPage` (`/admin/users`)

**Header row**: `Typography.Title` (serif) "Users" on the left; on the right,
two pill buttons — "Audit log" (secondary, links to `/admin/audit-log`) and
"Invite user" (primary style, opens `InviteUserModal`).

**Search**: `Input` with search icon, placeholder "Search users", pill radius,
240px wide. Debounced (300ms via ahooks `useDebounce`) filter against name/email,
client-side if the user list is small, server-side (`?q=`) if paginated.

**Table**: Ant Design `Table`, columns:

| Column | Content | Notes |
|---|---|---|
| Name | Avatar (28px, initials) + name (bold) + email (muted, 12px) below it | stacked in one cell |
| Role | Pill `Tag` — "Admin" or "Member" | colors per §2 |
| Status | Dot + label — "Active" / "Pending invite" / "Deactivated" | |
| Last login | Relative time ("Just now", "2 hours ago", "Never") | |
| — | Row menu (`···` icon → `Dropdown`) OR "You" muted label if this row is the current user | see §5.5 |

Row click (anywhere except the menu) opens `UserDetailDrawer` for that user.
Pagination: Ant `Table` built-in pagination, 20/page, only rendered if user
count exceeds page size.

No-results state (search yields nothing): centered muted text, "No users match
your search."

### 4.3 `UserDetailDrawer`

Ant Design `Drawer`, right-anchored, width 380px, opened on row click.

Content, top to bottom:
1. Avatar (36px) + name + email, same stacked pattern as table.
2. Role `Select` (Ant `Select`, options "Member"/"Admin") — changing this fires
   the role-change flow (§5.2). Disabled + tooltip explaining why if this is
   the current user's own row and they're the last admin (§5.4).
3. Session row: label "Active session" left, status right ("Signed in" in
   `--text-success` or "No active session" in `--text-muted`).
4. "Revoke session" button (danger-styled outline, only enabled if a session
   is active) — see §5.3.
5. "Deactivate account" / "Reactivate account" button (toggles based on current
   status) — see §5.1.
6. Divider.
7. "Recent activity" — small muted label, then a simple vertical list of the
   last ~5 audit entries scoped to this user (`action · relative time`), pulled
   from the audit log filtered by `actor_id` or `target_user_id`. No pagination
   here; "View full history" link at the bottom routes to `/admin/audit-log?user=<id>`.

### 4.4 `InviteUserModal`

Ant `Modal`, triggered by "Invite user" button. Fields:
- Email (`Input`, required, email format validation)
- Name (`Input`, optional — can be filled in by the user on accept instead)
- Role (`Select`, default "Member")

Submit button label: "Send invite". On success: close modal, show `message.success`
toast ("Invite sent to {email}"), new row appears in table with "Pending invite"
status. Do not show or generate a password anywhere in this flow — backend
issues a single-use expiring token and sends the email.

### 4.5 Confirmation modals

Use Ant `Modal.confirm` (not a full custom modal) for these, since they're
single-decision interruptions:

- **Deactivate account**: "Deactivate {name}'s account? They'll be signed out
  and won't be able to log back in until reactivated." Confirm button danger-styled.
- **Revoke session**: "Sign {name} out of their current session?" Confirm button
  danger-styled.
- **Role change to Member (self)**: only reachable if not the last admin;
  "You're changing your own role to Member. You'll lose admin access
  immediately." Confirm button danger-styled.
- **Deactivate self**: same self-guard pattern as role change — confirm copy
  should say "You're deactivating your own account" explicitly, not generic copy.

---

## 5. Interaction rules (these are the parts most likely to get skipped — call them out explicitly to the build agent)

### 5.1 Deactivate / reactivate
Deactivating sets status to `deactivated` and should also revoke any active
session server-side (drawer should reflect both changes without requiring a
manual refresh — refetch user detail after the mutation resolves).

### 5.2 Role change
Changing a `Select` value should not apply optimistically — wait for the
mutation to resolve, show a small inline spinner on the `Select` while pending,
revert the visible value if the request fails (with an error `message`).

### 5.3 Revoke session
Button is disabled (not hidden) when there's no active session, so its
presence is predictable rather than appearing/disappearing.

### 5.4 Last-admin guard
If this user is the only account with `role === "admin"`:
- Role `Select` is disabled with a tooltip: "Can't remove the last admin."
- "Deactivate account" is disabled with the same tooltip reasoning.
This must be enforced server-side too — the UI disabling it is a courtesy,
not the actual guard.

### 5.5 Self-row treatment
In the table, the current user's own row shows a muted "You" label instead of
the `···` row menu — no destructive row-level menu on your own account from
the table view. All self-actions happen only through the drawer, where the
extra confirmation copy in §4.5 applies.

### 5.6 Pending invite rows
A pending-invite row's `···` menu should offer "Resend invite" and "Revoke
invite" instead of the normal active-user actions (role change, deactivate,
revoke session don't apply to an account that's never logged in).

---

## 6. Data needs (for the agent to know what the backend must expose)

- `GET /api/admin/users?q=&page=` → paginated list: id, name, email, role,
  status (`active` / `pending` / `deactivated`), last_login_at, has_active_session
- `POST /api/admin/users/invite` → { email, name?, role }
- `PATCH /api/admin/users/:id` → { role? , status? }
- `POST /api/admin/users/:id/revoke-session`
- `POST /api/admin/users/:id/resend-invite`
- `DELETE /api/admin/users/:id/invite` (revoke a pending invite)
- `GET /api/admin/audit-log?user=:id&limit=5` → recent activity for the drawer

All mutation endpoints must independently enforce the last-admin guard (§5.4)
and must write an audit log entry (actor, action, target, timestamp).

---

## 7. State management

Zustand store (`useAdminUsersStore` or similar, consistent with existing store
naming) holding: user list, search query, selected user id (drives drawer
open/closed), loading/error flags per mutation. Fetch via existing data-fetching
pattern in the codebase (ahooks `useRequest` if that's already the convention
elsewhere — check `MobileBankingWidget.tsx` / `CustomerInfo.tsx` for the
established pattern before introducing a new one).

---

## 8. i18n

All user-facing strings go through i18next, no hardcoded copy. Suggested key
namespace: `admin.users.*` (e.g. `admin.users.inviteButton`,
`admin.users.confirmDeactivate`, `admin.users.statusPending`).

---

## 9. Accessibility

- Row menu (`···`) must be keyboard-reachable and labeled (`aria-label="User actions"`).
- Drawer traps focus while open, returns focus to the triggering row on close.
- Status dots are decorative — status must always also be conveyed by adjacent
  text, never color/dot alone.
- Confirm modals must be dismissible via Escape and have a clearly labeled
  cancel action, not just the danger action.
