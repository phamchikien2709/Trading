# Trading platform — technical design notes

## Goals

Implement **Trading Journal & Social Trading Platform** per `ImplementFullProject.txt`: Echo + GORM API, React/Vite UI, Postgres + Redis, Cloudinary, Docker.

## Implemented layout

- Code lives under `trading-platform/backend` and `trading-platform/frontend` (Compose file in `trading-platform/docker-compose.yml`).
- **DB**: GORM `AutoMigrate` on startup; reference SQL in `backend/migrations/001_schema.sql`.
- **Feed**: `user_id = self OR user_id IN (SELECT user_id FROM followers WHERE follower_id = self)` with `Preload("User")`.
- **Like/unlike**: transactions for counter + row; unlike decrements only when `likes_count > 0`.

## Key design choices

1. **Migrations**: AutoMigrate for dev velocity; SQL file for documentation / DBA.
2. **API prefix**: Echo routes under `/api` (public register/login + health; JWT group for the rest).
3. **Likes counter**: transaction with `likes` row insert/delete.
4. **Docker UI**: Nginx proxies `/api/` → `backend:8080`; frontend built with `VITE_API_URL=/api`.
5. **Upload (Phase 4)**: not implemented yet; chart URL manual on create post.

## Risks from spec snippets

- Example `AuthMiddleware` must import `os` for `JWT_SECRET`.
- `Post` model uses `pq.StringArray`; module `github.com/lib/pq` is in use.

---

## Checklist (mirror — đồng bộ với `checklist.md`)

### Documentation & memory bank

- [x] Khởi tạo `memory-bank/` (6 file core + `lessons.md`)
- [x] Tạo `trading-platform/checklist.md` và `trading-platform/tdd.md`

### Phase 1: Setup & database

- [x] Cấu trúc thư mục `backend/`, `frontend/`, `docker-compose.yml`, `README.md`
- [x] PostgreSQL schema hoặc migration tương đương spec
- [x] Backend: `go mod`, Echo, GORM, kết nối DB, `.env.example`
- [x] Frontend: Vite React, Tailwind, dependencies cốt lõi

### Phase 2: Backend

- [x] Auth JWT + middleware
- [x] CRUD trading journal
- [x] Posts + newsfeed + like/unlike + comments
- [x] Follow/unfollow

### Phase 3: Frontend

- [x] Login / Register
- [x] Dashboard + journal UI
- [x] Feed + create post + profile

### Phase 4: Storage

- [ ] Cloudinary account setup
- [ ] Image upload API
- [ ] Component upload ảnh (journal/post) — hiện dùng URL chart thủ công

### Phase 5: Docker & deploy

- [x] Dockerfile backend + frontend
- [x] `docker-compose` đầy đủ dịch vụ (Postgres, Redis, backend, frontend)
- [ ] Deploy lên VPS (manual / tùy bạn)

### Phase 6: Testing & tối ưu

- [ ] Unit test handlers (ít nhất auth/feed path)
- [ ] Index DB + (tuỳ chọn) Redis cache feed

### Phase 7 (optional)

- [ ] WebSocket thông báo
- [ ] Export journal CSV
