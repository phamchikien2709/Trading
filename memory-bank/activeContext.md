# Active context

## Current focus

Runnable stack under `trading-platform/`: **Go Echo API** + **Vite React + MUI UI** + **Docker Compose** (Postgres, Redis, Nginx frontend). Core MVP flows work; **Cloudinary upload (Phase 4)** and **tests/Redis cache (Phase 6)** remain the main implementation gaps.

**Journal checklist (2026-04):** user-defined templates (`GET`, `GET/:id`, `POST`, `DELETE /api/journal-checklist-templates`); **no PUT** — immutable after create. **Soft delete** via GORM `DeletedAt` on `journal_checklist_templates`. Creating a journal requires `checklist_template_id` + `checklist_snapshot` matching the template with every item `checked: true`. Legacy journal rows may have empty snapshot.

**Social (2026-04):** `GET /api/users/:id` (hồ sơ công khai + `my_expert_rating`, `i_follow`), `POST /api/users/:id/expert-rating` (1–5 sao); feed ưu tiên bài phân tích (`analysis_type` ≠ `news`) và điểm chuyên gia; `/profile/:userId` + link từ avatar/tên trong `PostDetail`.

**Thông báo (2026-04):** `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:id/read`, `POST /notifications/read-all`; tạo row khi thích / bình luận bài (chủ bài), theo dõi, đánh giá chuyên gia; tab **Thông báo** + badge số chưa đọc.

## Next steps (implementation order)

1. Phase 4: Cloudinary `upload` handler + frontend `ImageUpload` component; wire journal/post forms.
2. Phase 6: handler tests (`httptest`), extra DB indexes, optional Redis feed cache.
3. Optional Phase 7: WebSocket notifications, journal CSV export.

## Open decisions

- Whether to use SQL migration files only, GORM AutoMigrate, or both.
- Session table vs pure JWT for MVP.
- Exact public API path prefix (`/api` vs root) — keep consistent between Echo routes and `VITE_API_URL`.

## Recent changes

- **App shell header (2026-04):** thanh nav kiểu Facebook — grid 3 cột (logo + pill tìm kiếm | tab icon Tổng quan / Nhật ký / Bài viết | chuông + avatar), màu `#1877F2` / `#F0F2F5` / `#65676B`.
- **Auth OTP (2026-04):** đăng ký 3 bước (email+tên → OTP → mật khẩu) và quên mật khẩu tương tự; JWT setup token ngắn hạn sau verify; mail SMTP hoặc log dev.
- Scaffolded full stack in `trading-platform/` (backend, frontend, Docker, README).
- Feed: `GET /feed` paginated (`after_id`, 20/lần, `{ items, has_more }`); timeline **tất cả post** (user đã login). Journal API chỉ trả về bản ghi `user_id` = viewer.
- Dashboard: filter **All time / This month / This year** + nhóm **Day / Month / Year**; thống kê + bar PnL theo bucket + cumulative line trên journal đã lọc (client-side).
- **UI — list cards**: `tradingListCard` + `LIST_CARD_RADIUS_PX` unify **Feed** post cards and **Journal** rows (journal visual language as baseline); `PostDetail` main post matches.
- **UI — comments** (`PostDetail.jsx`): borderless composer + thread-style list; **multiline** input (`minRows` / `maxRows`), **Enter** sends, **Shift+Enter** newline; submit reads `e.currentTarget.value` on keydown to avoid stale state.
- **Public profile + expert rating**: link từ bình luận/tác giả bài; đánh giá sao cập nhật `expert_rating_avg` và thứ tự feed.
