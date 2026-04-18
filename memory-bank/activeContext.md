# Active context

## Current focus

Runnable stack under `trading-platform/`: **Go Echo API** + **Vite React + MUI UI** + **Docker Compose** (Postgres, Redis, Nginx frontend). Core MVP flows work; **Cloudinary upload (Phase 4)** and **tests/Redis cache (Phase 6)** remain the main implementation gaps.

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
- Feed: `GET /feed` paginated (`after_id`, 20/lần, `{ items, has_more }`); timeline **tất cả post** (user đã login). Journal API chỉ trả về bản ghi `user_id` = viewer.
- Dashboard: filter **All time / This month / This year** + nhóm **Day / Month / Year**; thống kê + bar PnL theo bucket + cumulative line trên journal đã lọc (client-side).
- **UI — list cards**: `tradingListCard` + `LIST_CARD_RADIUS_PX` unify **Feed** post cards and **Journal** rows (journal visual language as baseline); `PostDetail` main post matches.
- **UI — comments** (`PostDetail.jsx`): borderless composer + thread-style list; **multiline** input (`minRows` / `maxRows`), **Enter** sends, **Shift+Enter** newline; submit reads `e.currentTarget.value` on keydown to avoid stale state.
