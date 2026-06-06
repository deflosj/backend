# MEMBER

Summary: Default user role. Can view public content and perform self-service actions.

- View public content: `GET /content/news`, `GET /content/news/:slug`, `GET /content/events`, `GET /content/events/:id`, `GET /content/sponsors`, `GET /tournaments`, `GET /tournaments/:id`, `GET /tournaments/:id/poules`, `GET /tournaments/:id/teams`, `GET /tournaments/:id/matches`, `GET /tournaments/:id/matches/:matchId`
- Register for the event: `POST /registrations` (submit a registration)
- Create an account: `POST /auth/register` (invite code required in non-test env)
- Validate invite codes: `GET /auth/validate-invite/:code`
- View and edit personal profile: `GET /auth/me`, `PATCH /members/me`
- View public members list and individual members: `GET /members`, `GET /members/:id`
- Submit contact messages: `POST /contact/messages`
- Shifts: view shift groups and slots, register/unregister for a slot (public with token or authenticated) via `GET /:id/shifts`, `POST /:id/shifts/slots/:slotId/register`, `DELETE /:id/shifts/slots/:slotId/unregister`

Notes:
- Members cannot access administrative endpoints (approve registrations, create news/events, manage invite codes, or perform tournament admin actions).
