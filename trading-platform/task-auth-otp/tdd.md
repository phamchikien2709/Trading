# TDD — Auth OTP

## Mục tiêu

- Đăng ký: email + tên → OTP email → verify → mật khẩu + xác nhận → tạo user.
- Quên MK: email → OTP → mật khẩu mới.

## Thiết kế

- Bảng `email_otp_challenges`: `email`, `purpose` (`signup` | `password_reset`), `code_hash`, `username` (chỉ signup), `expires_at`, `attempts`.
- Sau verify OTP: JWT ngắn hạn (`aud` = `signup_complete` | `password_reset`), body kèm khi `complete`.
- Mail: `SMTP_*` nếu có; không có `SMTP_HOST` → log OTP ra stdout (dev).

## Checklist (mirror)

- [x] Thêm model + AutoMigrate + SQL tham chiếu
- [x] Backend: gửi OTP (SMTP hoặc log dev) + JWT setup token
- [x] Backend: route mới, gỡ `/api/register` cũ
- [x] Frontend: đăng ký 3 bước + API client
- [x] Frontend: quên mật khẩu 3 bước + link từ Login
- [x] `go build` / `npm run build` chứng minh
