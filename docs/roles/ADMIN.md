# ADMIN

Summary: Administrative users with broad management capabilities across registrations, content, invite codes, contacts, members and (mostly) tournaments.

- All `MEMBER` and `REFEREE` permissions.
- Registration management:
  - List and manage registrations: `GET /registrations`, `PATCH /registrations/:id/approve`, `PATCH /registrations/:id/reject`, `PATCH /registrations/:id/category`, `DELETE /registrations/:id`
  - Registration settings: `GET /registrations/settings`, `PATCH /registrations/settings`
- Invite codes: create/list/toggle/delete invite codes via `inviteCodes` endpoints (`/invite-codes` router) — protected for `ADMIN` and `SUPERADMIN`.
- Content management: create/edit news, events, sponsors (`POST/PATCH /content/news`, `POST/PATCH /content/events`, `POST/PATCH /content/sponsors`) — protected for `ADMIN` and `SUPERADMIN`.
- Contact messages: list/read/archive messages (`GET /contact/messages`, `PATCH /contact/messages/:id/read`, `PATCH /contact/messages/:id/archive`) — protected for `ADMIN` and `SUPERADMIN`.
- Members: view all users for member overview: `GET /members/all` — protected for `ADMIN` and `SUPERADMIN`.
- Tournament administration (note): many tournament admin routes are protected by `requireRole("ADMIN")` (admin-only) and therefore allow `ADMIN` to:
  - Create/edit/delete tournaments, poules, teams, matches
  - Generate matches/knockouts, apply delays, set active tournament, and other management endpoints
  - Some tournament admin routes currently use a literal `"ADMIN"` check; review code if you expect `SUPERADMIN` to be included.

Notes:
- Some shift management endpoints are implemented under `src/routes/shifts.ts` with `requireAuth` but not explicit role checks; comments indicate these are admin actions (creating groups/slots). If you want strict role enforcement, add `requireRole(UserRole.ADMIN)` to those routes.
