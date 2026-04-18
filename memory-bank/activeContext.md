# Active context

## Current focus

Runnable stack under `trading-platform/`: **Go Echo API** + **Vite React UI** + **Docker Compose** (Postgres, Redis, Nginx frontend). Phases 1–3 and 5 (code) done; **Cloudinary upload (Phase 4)** and **tests/Redis cache (Phase 6)** still open.

## Next steps (implementation order)

1. Phase 4: Cloudinary `upload` handler + frontend `ImageUpload` component; wire journal/post forms.
2. Phase 6: handler tests (`httptest`), extra DB indexes, optional Redis feed cache.
3. Optional Phase 7: WebSocket notifications, journal CSV export.

## Open decisions

- Whether to use SQL migration files only, GORM AutoMigrate, or both.
- Session table vs pure JWT for MVP.
- Exact public API path prefix (`/api` vs root) — keep consistent between Echo routes and `VITE_API_URL`.

## Recent changes

- Scaffolded full stack in `trading-platform/` (backend, frontend, Docker, README).
