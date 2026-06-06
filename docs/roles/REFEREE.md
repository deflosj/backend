# REFEREE

Summary: `REFEREE` users can perform match-related actions in tournaments in addition to member capabilities.

- All `MEMBER` permissions (see MEMBER.md).
- Tournament referee privileges (these routes allow `REFEREE` or `ADMIN`):
  - Record match scores: `POST /tournaments/:id/matches/:matchId/score`
  - Manage tiebreakers: `PUT /tournaments/:id/tiebreaker`, `POST /tournaments/:id/tiebreaker/winner`, `POST /tournaments/:id/tiebreaker/score`
  - Check teams in/out: `POST /tournaments/:id/teams/:teamId/checkin` (referee or admin)

Notes:
- Referees do not have content/registration/admin-level controls unless explicitly granted via invite codes.
