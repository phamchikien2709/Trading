# TDD — Header kiểu Facebook

## Mục tiêu

Thanh điều hướng sticky: nền trắng, viền dưới nhẹ, cao ~56px; màu accent `#1877F2`; nền pill/icon `#F0F2F5`; icon inactive `#65676B`.

## Checklist (mirror)

- [x] Thêm `tdd.md` + checklist mirror
- [x] Layout 3 cột: trái (logo + search pill), giữa (tab icon), phải (thông báo + avatar)
- [x] Cập nhật `NotificationsNavLink` (icon tròn + badge)
- [x] Chạy `npm run lint` trong `frontend/`

## Ghi chú kỹ thuật

- Giữ `navMatch` và routes hiện tại.
- Tab giữa: `/dashboard`, `/journal`, `/feed` — gạch chân active 3px màu `#1877F2`.
- Phải: `/notifications` (badge), `/profile` (Avatar từ `authAPI.getProfile`, cache `["profile"]`).
