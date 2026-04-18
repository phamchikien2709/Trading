# Lessons (agent workflow)

Append one line per bug or important insight: **cause → fix**.

- Code/spec trong `ImplementFullProject.txt` là minh họa — luôn `go build` / `npm run build` trước khi coi là đúng; ví dụ snippet JWT middleware thiếu `import "os"` cho `JWT_SECRET`.
- Môi trường Windows có thể không có `go`/`docker` trên PATH — chạy `npm run build` cho frontend; backend kiểm chứng bằng `go build` hoặc `docker compose build backend` trên máy đã cài đủ công cụ.
- `@mui/icons-material` v9: một số tên submodule cũ (ví dụ `ChatBubbleOutline`, `DeleteOutline`) không còn trong `exports` — dùng bản `*Outlined` hoặc nâng/cấp đúng major; project đang pin **MUI v6** (`@mui/material` / `@mui/icons-material` ~6.4.x) để tránh lệch exports với Vite/Rolldown.
- Journal `direction` GORM `size:4` + `VARCHAR(4)` chặn `SHORT` (5 ký tự) — tăng ít nhất `size:5` / `VARCHAR(5)` và để AutoMigrate ALTER cột.
- `GetPost` lọc `user_id IN (followed)` khiến `GET /api/posts/:id` 404 dù post tồn tại — chi tiết bài nên load theo `id` (mọi user đã auth), giữ `LikedByMe` theo viewer.
