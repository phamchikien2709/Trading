# Project brief: Trading Journal & Social Trading Platform

## Purpose

Build a platform where traders can keep a structured trading journal, publish chart analysis posts in a social feed, interact via likes and comments, and follow other traders.

## Source of truth

Implementation phases, schema, and API sketches live in `ImplementFullProject.txt` at the repository root.

## Scope

### MVP (core)

- Auth: register, login, JWT-protected routes.
- Trading journal: CRUD per user, PnL logic (LONG/SHORT).
- Social: posts with optional chart image, newsfeed (followed users + self), likes, comments (threading via `parent_id` where applicable).
- Follow / unfollow.
- Image uploads via Cloudinary.
- Run locally and via Docker Compose (Postgres, Redis, backend, frontend).

### Later / optional (Phase 7 in spec)

- WebSocket notifications.
- CSV export of journals.
- Production hardening beyond initial VPS deploy.

## Out of scope (unless explicitly added)

- Live broker execution or real-money order routing.
- Mobile native apps (web-first per spec).

## Success criteria

- End-to-end: user can register, log in, create journals and posts (with image), see personalized feed, like/comment, follow another user.
- `docker compose` brings up stack per spec checklist.

## Implementation note

- Primary web UI lives under `trading-platform/frontend` using **Material UI** (see `memory-bank/systemPatterns.md` / `techContext.md`), not Tailwind-only.
