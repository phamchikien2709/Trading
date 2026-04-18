# Trading platform — checklist

## Documentation & memory bank

- [x] Khởi tạo `memory-bank/` (6 file core + `lessons.md`)
- [x] Tạo `trading-platform/checklist.md` và `trading-platform/tdd.md`

## Phase 1: Setup & database

- [x] Cấu trúc thư mục `backend/`, `frontend/`, `docker-compose.yml`, `README.md`
- [x] PostgreSQL schema hoặc migration tương đương spec (`migrations/001_schema.sql` + GORM AutoMigrate)
- [x] Backend: `go mod`, Echo, GORM, kết nối DB, `.env.example`
- [x] Frontend: Vite React, Tailwind, dependencies cốt lõi

## Phase 2: Backend

- [x] Auth JWT + middleware
- [x] CRUD trading journal
- [x] Posts + newsfeed + like/unlike + comments
- [x] Follow/unfollow

## Phase 3: Frontend

- [x] Login / Register
- [x] Dashboard + journal UI
- [x] Feed + create post + profile

## Phase 4: Storage

- [ ] Cloudinary account setup
- [ ] Image upload API
- [ ] Component upload ảnh (journal/post) — hiện dùng URL chart thủ công

## Phase 5: Docker & deploy

- [x] Dockerfile backend + frontend
- [x] `docker-compose` đầy đủ dịch vụ (Postgres, Redis, backend, frontend)
- [ ] Deploy lên VPS (manual / tùy bạn)

## Phase 6: Testing & tối ưu

- [ ] Unit test handlers (ít nhất auth/feed path)
- [ ] Index DB + (tuỳ chọn) Redis cache feed

## Phase 7 (optional)

- [ ] WebSocket thông báo
- [ ] Export journal CSV
