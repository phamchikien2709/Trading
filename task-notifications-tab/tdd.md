# TDD: Tab thông báo

## Hành vi

- Bảng `notifications`: người nhận `user_id`, loại (`like` | `comment` | `follow` | `expert_rating`), `body`, `actor_id`, `post_id` tuỳ chọn, `read_at`.
- Không thông báo khi tác động lên chính mình (tự thích/tự comment — tự thích đã chặn; comment chủ bài vẫn có thể comment — skip nếu `commenter == owner`).
- `GET /notifications` + `GET /notifications/unread-count`; `POST /notifications/:id/read`, `POST /notifications/read-all`.

## Checklist mirror

- [x] Model + AutoMigrate + migration SQL tham chiếu
- [x] API: list, unread-count, mark read, mark all read
- [x] Tạo thông báo: thích bài, bình luận, theo dõi, đánh giá chuyên gia
- [x] Frontend: trang `/notifications`, tab nav + badge chưa đọc
- [x] `go test` / `npm run build`
