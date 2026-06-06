# CAPTAIN

Summary: A `CAPTAIN` is primarily a member who leads a team. There are no extra protected API endpoints for captains in the current codebase — the role is mainly represented in tournament/team data.

- All `MEMBER` permissions (see MEMBER.md).
- Recognized in tournament/team data: teams may have `captainId` and `captainName` fields; captains appear in team listings and match details.

Notes:
- There are no dedicated `requireRole("CAPTAIN")` route protections in the codebase. Any captain-specific UI/flows are implemented on the client side and are reflected in the data model (teams and captain fields).
