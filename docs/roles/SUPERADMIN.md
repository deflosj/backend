# SUPERADMIN

Summary: Elevated administrative user. Most management endpoints explicitly allow `SUPERADMIN` alongside `ADMIN`.

- All `MEMBER`, `REFEREE`, and (where allowed) `ADMIN` permissions.
- Explicitly allowed on many admin endpoints (same as `ADMIN`): invite codes, registrations management, content create/edit, contact message handling, members listing — see those endpoints in the codebase which use `requireRole(UserRole.ADMIN, UserRole.SUPERADMIN)`.
- Caveat: some tournament admin routes currently use a literal `requireRole("ADMIN")` and therefore do not allow `SUPERADMIN` unless the code is changed. If you expect `SUPERADMIN` to be able to manage tournaments, update the tournament routes to include `SUPERADMIN`.

Notes:
- `SUPERADMIN` is intended as an elevated admin; verify route protections if you need strict separation of `ADMIN` vs `SUPERADMIN` abilities.
