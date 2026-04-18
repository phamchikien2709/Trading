# System patterns

## Architecture

- **Monorepo layout**: `trading-platform/backend/` (Go), `trading-platform/frontend/` (React + Vite), `trading-platform/docker-compose.yml`, `trading-platform/README.md`.
- **Backend**: Echo HTTP server, GORM for PostgreSQL, handlers under `internal/handlers`, models under `internal/models`, shared DB handle in `internal/database`.
- **Frontend**: React Router, TanStack Query for server state, Axios instance with Bearer token from `localStorage`, Tailwind for styling.
- **Media**: Cloudinary SDK on backend; frontend uploads `multipart/form-data` to upload endpoint, stores returned URL on post/journal.

## Auth

- JWT in `Authorization: Bearer <token>` after login.
- Middleware attaches `user_id` to Echo context for protected routes.

## Data model (high level)

- `users`, `trading_journals`, `posts`, `comments`, `likes`, `followers`, `sessions` (spec includes sessions; decide JWT-only vs server-side session storage during implementation).

## Feed query (intent)

- Posts where `user_id` is in the set of users the current user follows, or equals current user, ordered by `created_at` DESC, paginated (spec uses limit 20).

## Caching (Phase 6)

- Optional Redis cache for feed JSON keyed by user; invalidate or TTL on writes (spec suggests short TTL).

## Conventions

- API base: `VITE_API_URL` defaulting to `http://localhost:8080/api` on frontend (per spec).
- Go module path: `trading-platform` (per spec); adjust if repository uses a different module name.
