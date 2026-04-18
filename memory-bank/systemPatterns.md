# System patterns

## Architecture

- **Monorepo layout**: `trading-platform/backend/` (Go), `trading-platform/frontend/` (React + Vite), `trading-platform/docker-compose.yml`, `trading-platform/README.md`.
- **Backend**: Echo HTTP server, GORM for PostgreSQL, handlers under `internal/handlers`, models under `internal/models`, shared DB handle in `internal/database`.
- **Frontend**: React Router, TanStack Query for server state, Axios with Bearer token from `localStorage`, **MUI v6 + Emotion** as the main UI layer; Tailwind is available via the Vite plugin for utilities where needed.
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

## UI: list cards and dialogs

- Shared shell: `frontend/src/theme/listCardStyles.js` exports `tradingListCard(theme, opts)` and `LIST_CARD_RADIUS_PX` (24px). **Feed posts** and **journal rows** use the same pattern; default accent aligns with journal LONG (teal / `secondary.main`); SHORT journals pass red `error.main` as `accent`.
- **Post detail** main card uses the same `tradingListCard` language; **comments** are borderless: soft panel composer + thread list with light dividers (no per-comment outlined cards).
- **Form dialogs**: `frontend/src/theme/formDialogStyles.js` — dialog paper radius follows `LIST_CARD_RADIUS_PX` for visual consistency.
