# Lessons (agent workflow)

Append one line per bug or important insight: **cause → fix**.

- Code/spec trong `ImplementFullProject.txt` là minh họa — luôn `go build` / `npm run build` trước khi coi là đúng; ví dụ snippet JWT middleware thiếu `import "os"` cho `JWT_SECRET`.
- Môi trường Windows có thể không có `go`/`docker` trên PATH — chạy `npm run build` cho frontend; backend kiểm chứng bằng `go build` hoặc `docker compose build backend` trên máy đã cài đủ công cụ.
- `@mui/icons-material` v9: một số tên submodule cũ (ví dụ `ChatBubbleOutline`, `DeleteOutline`) không còn trong `exports` — dùng bản `*Outlined` hoặc nâng/cấp đúng major; project đang pin **MUI v6** (`@mui/material` / `@mui/icons-material` ~6.4.x) để tránh lệch exports với Vite/Rolldown.
- Journal `direction` GORM `size:4` + `VARCHAR(4)` chặn `SHORT` (5 ký tự) — tăng ít nhất `size:5` / `VARCHAR(5)` và để AutoMigrate ALTER cột.
- `GetPost` lọc `user_id IN (followed)` khiến `GET /api/posts/:id` 404 dù post tồn tại — chi tiết bài nên load theo `id` (mọi user đã auth), giữ `LikedByMe` theo viewer.
- `git push` HTTPS 403 “Permission denied to wrong GitHub user” — Windows Credential Manager đang dùng account GitHub khác owner repo; đăng nhập đúng account (PAT / `gh auth login`) hoặc thêm account hiện tại làm collaborator / dùng SSH key gắn đúng user.
- `GET /api/feed` phân trang: response là `{ items, has_more }`, query `after_id` (keyset theo `created_at,id`); timeline là **mọi post** (đã auth); journal chỉ `GET /journals` theo JWT user.
- Xóa post/comment: `DELETE /api/posts/:id` (chỉ `user_id` chủ bài), `DELETE /api/posts/:id/comments/:comment_id` (chỉ chủ comment); Echo đăng ký route comment **trước** route xóa post cùng prefix.
- Xác nhận xóa / lưu thay đổi: dùng `ConfirmDialog` (MUI) thay `window.confirm`; khi `loading`, chặn đóng popup backdrop/Escape.
- Việt hóa giao diện: dùng `toLocaleDateString('vi-VN', …)` cho nhãn trục thời gian; thông báo lỗi từ API (`error`) có thể vẫn tiếng Anh nếu backend chưa dịch — chỉ đảm bảo chuỗi tĩnh phía client là tiếng Việt.
- ESLint `react-hooks/immutability`: `useMemo` + `.map` gán `let x += …` bị coi là reassignment sau render — dùng `.reduce` tích lũy an toàn hoặc bỏ biến chạy nếu không cần.
- Bình luận đa dòng: `TextField` cần `multiline`; **Enter gửi** chỉ khi `!e.shiftKey` + `preventDefault`; **Shift+Enter** để xuống dòng — đọc nội dung gửi bằng `e.currentTarget.value` trong `onKeyDown` tránh closure `useState` cũ; textarea không hợp bo viền pill (`borderRadius: 999`) — dùng bo góc vừa (ví dụ `borderRadius: 2`).
