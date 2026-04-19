# Trading platform

Trading journal + social feed (React / Vite + Go Echo + PostgreSQL). Specification: `../ImplementFullProject.txt` (repo root).

## Layout

- `backend/` — Go API (`/api/...`), GORM AutoMigrate on startup.
- `frontend/` — React UI, Tailwind v4 via `@tailwindcss/vite`.
- `docker-compose.yml` — Postgres, Redis, API, static UI (Nginx proxies `/api` → backend).

## Local development

### Database

Run Postgres (or use Docker only for DB):

```powershell
docker compose up -d postgres
```

Copy `backend/.env.example` to `backend/.env` and adjust credentials.

### Backend

Requires [Go](https://go.dev/dl/) 1.21+ on `PATH`:

```powershell
cd backend
copy .env.example .env
go mod tidy
go run ./cmd/server
```

Health: `GET http://localhost:8080/api/health`

**Auth (OTP):** đăng ký và quên mật khẩu dùng `POST /api/auth/signup/request|verify|complete` và `POST /api/auth/password-reset/request|verify|complete`. Để `SMTP_HOST` trống trong `.env`, OTP được log ra console backend (dev); set `SMTP_*` để gửi email thật.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

`frontend/.env.development` points `VITE_API_URL` at `http://localhost:8080/api`.

## Full stack (Docker)

From this folder (with Docker Desktop / Engine installed):

```powershell
copy .env.example .env
# edit .env — set JWT_SECRET at minimum
docker compose up -d --build
```

- UI: http://localhost (Nginx → `VITE_API_URL=/api` → backend)
- API direct: http://localhost:8080

## Windows note

If `go` or `docker` is missing from `PATH`, install Go and/or Docker; the project was validated with `npm run build` for the frontend. Backend compile is intended via `go build` or the backend `Dockerfile`.
