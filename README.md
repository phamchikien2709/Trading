# TradingProject

Trading journal and social trading platform: structured journals, chart-style posts, feed, likes, comments, and follows. Web-first (React + Go API + PostgreSQL).

## Repository layout

| Path | Purpose |
|------|---------|
| [`trading-platform/`](trading-platform/README.md) | Runnable app: **Go Echo** API, **Vite React** UI, **Docker Compose** (Postgres, Redis, Nginx). |
| [`ImplementFullProject.txt`](ImplementFullProject.txt) | Full implementation spec: phases, schema, API sketches. |
| [`memory-bank/`](memory-bank/projectbrief.md) | Project brief, progress, and agent context notes. |

## Quick start

Detailed steps (local DB, backend, frontend, full Docker stack) are in the app README:

**[trading-platform/README.md](trading-platform/README.md)**

Short version with Docker (from `trading-platform/`):

```powershell
cd trading-platform
copy .env.example .env
# Set JWT_SECRET (and other vars) in .env
docker compose up -d --build
```

- UI: http://localhost  
- API: http://localhost:8080 — health: `GET /api/health`

## Remote

Default `origin` is expected to be:

`git@github.com:phamchikien2709/Trading.git`

## Scope note

This repo does **not** include live broker execution or order routing; see `memory-bank/projectbrief.md` for MVP vs later work.
