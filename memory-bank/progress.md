# Progress

## Working

- Spec: `ImplementFullProject.txt`; memory bank under `memory-bank/`.
- App code: `trading-platform/backend` (JWT, journals, posts, feed, likes, comments, follow, profile) + `trading-platform/frontend` (login/register, dashboard, journal, feed, create post, profile).
- Frontend: **MUI 6**-based screens; shared **`tradingListCard`** styling for feed posts and journal list; **post detail** comments support multiline text and refreshed layout.
- `npm run build` succeeds for frontend.
- `docker-compose.yml` + Dockerfiles + `trading-platform/README.md`.

## Not started / partial

- Cloudinary upload flow (Phase 4).
- Automated API tests, Redis-backed feed cache.
- VPS deploy (operator step).

## Known gaps

- Local `go` / `docker` may be absent on PATH (Windows); use installed Go or Docker to produce `go.sum` and run backend container build.
- Redis service is compose-ready but not used by API yet.
- ESLint: `Feed.jsx` — `react-hooks/exhaustive-deps` warning for `useEffect` / `feedQ` (known; fix when touching feed logic).

## Checklist mirror

See `trading-platform/checklist.md` for phase-by-phase checkboxes; update both that file and this section when milestones complete.
