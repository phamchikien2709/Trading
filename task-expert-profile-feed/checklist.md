# Task: Profile từ bình luận + đánh giá chuyên gia (feed)

- [x] Backend: model `ExpertRating`, cột `expert_rating_*` trên `users`, AutoMigrate
- [x] Backend: `GET /users/:id` (public), `POST /users/:id/expert-rating`
- [x] Backend: feed sắp xếp ưu tiên bài phân tích + điểm chuyên gia + cursor đúng
- [x] Frontend: route `/profile/:userId`, API client, Profile công khai + đánh giá sao
- [x] Frontend: PostDetail — bấm avatar/tên comment (và tác giả bài) → profile
- [x] Chứng minh: `go test ./...` (backend), `npm run build` (frontend)
