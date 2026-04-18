# Tech context

## Stack (from spec)

| Layer | Technology |
|--------|------------|
| Frontend | React, Vite, TailwindCSS, React Query, React Router, Axios, react-hook-form + zod, react-hot-toast, lucide-react, recharts, react-image-crop |
| Backend | Go 1.21+ (recommended), Echo v4, GORM, PostgreSQL driver, JWT v5, bcrypt, godotenv |
| Data | PostgreSQL 15, Redis 7 |
| Files | Cloudinary (cloudinary-go v2) |
| Deploy | Docker, Docker Compose, Nginx (frontend static or reverse proxy) |

## Environment variables (backend)

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `JWT_SECRET`
- `REDIS_URL` (e.g. `localhost:6379` or `redis:6379` in Compose)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `PORT` (optional, default 8080)

## Frontend

- `VITE_API_URL` — backend API origin + `/api` path if used.

## Development setup (intended)

1. PostgreSQL and Redis running (local or Compose).
2. `backend`: `go mod tidy`, run server from `cmd/server`.
3. `frontend`: `npm install`, `npm run dev`.

## Constraints

- Windows-friendly paths; scripts in README should note PowerShell vs bash where relevant.
- Spec snippets may have minor omissions (e.g. missing imports); fix at compile time.
