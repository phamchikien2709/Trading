# TDD: Public profile & expert rating feed boost

## Mục tiêu

- Xem hồ sơ người khác (không lộ email); từ bình luận / tác giả bài nhấn vào để mở.
- Người dùng đăng nhập có thể cho điểm 1–5 (chuyên gia); trung bình lưu trên `users`, dùng để đẩy bài **phân tích** (`analysis_type` ≠ `news`) lên trước trong feed.

## API

- `GET /api/users/:id` → `{ id, username, avatar_url, bio, created_at, expert_rating_avg, expert_rating_count, my_expert_rating, i_follow }` (email chỉ khi xem chính mình).
- `POST /api/users/:id/expert-rating` body `{ "score": 1..5 }` — không cho tự chấm.

## Feed ordering

1. Bài phân tích (không phải `news`) trước bài `news`.
2. Trong nhóm phân tích: `expert_rating_avg` giảm dần (cùng điểm thì `created_at`, `id`).

## Checklist mirror

- [x] Backend: model `ExpertRating`, cột `expert_rating_*` trên `users`, AutoMigrate
- [x] Backend: `GET /users/:id` (public), `POST /users/:id/expert-rating`
- [x] Backend: feed sắp xếp ưu tiên bài phân tích + điểm chuyên gia + cursor đúng
- [x] Frontend: route `/profile/:userId`, API client, Profile công khai + đánh giá sao
- [x] Frontend: PostDetail — bấm avatar/tên comment (và tác giả bài) → profile
- [x] Chứng minh: `go test ./...` (backend), `npm run build` (frontend)
