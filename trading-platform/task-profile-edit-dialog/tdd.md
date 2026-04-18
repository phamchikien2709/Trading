# TDD: Profile edit dialog

## Mục tiêu

Trang Hồ sơ: hiển thị avatar và bio rõ ràng; nút **Chỉnh sửa** góc phải mở dialog (MUI `Dialog`) để sửa `avatar_url` và `bio`, gọi `PUT /profile` qua `authAPI.updateProfile`.

## Checklist (mirror)

- [x] Header có nút chỉnh sửa góc phải, card chỉ hiển thị avatar + bio
- [x] Dialog chỉnh sửa avatar URL + bio, lưu qua API hiện có
- [x] Giữ đăng xuất; chạy lint/build frontend nếu có script

## Ghi chú kỹ thuật

- Reuse `formDialogStyles` giống `CreatePostDialog.jsx`.
- `react-hook-form`: reset khi mở dialog và có `profileQ.data`.
