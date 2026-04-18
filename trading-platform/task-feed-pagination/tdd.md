# TDD: Feed pagination

## Goal

Phân trang newsfeed 20 bài/lần; client load thêm khi scroll gần cuối (IntersectionObserver). API ổn định khi có bài mới: **keyset** theo `(created_at DESC, id DESC)` với `after_id` = id bài cuối trang trước (server resolve `created_at`). Feed gồm **mọi post** (user đã đăng nhập); journal vẫn private theo `user_id` JWT.

## API

- `GET /feed` — optional `after_id` (uint).
- Response: `{ "items": Post[], "has_more": bool }` (luôn tối đa 20 `items`; `has_more` khi còn trang sau).

## Checklist (mirror)

- [x] Backend: `GET /feed` — query `after_id`, keyset + `limit 21`, JSON `{ items, has_more }`
- [x] Frontend: `postAPI.getFeed({ after_id })` + `useInfiniteQuery` + sentinel `IntersectionObserver`
- [x] Chạy `go build` (backend) và `npm run build` (frontend)
