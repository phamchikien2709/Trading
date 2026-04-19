# Journal checklist — TDD

## Goal

Nhật ký giao dịch chỉ tạo được khi người dùng chọn **checklist đã định nghĩa** và **mọi rule đều được tick**; snapshot lưu theo bản ghi để xem lại sau.

## Thiết kế

- Bảng `journal_checklist_templates`: `user_id`, `name`, `items` (JSONB: `[{id, label}, ...]`).
- `trading_journals`: thêm `checklist_template_id` (nullable, legacy), `checklist_snapshot` (JSONB: `[{id, label, checked}]`).
- **Create / Update (khi gửi snapshot)**: load template theo `user_id`, so khớp độ dài + `id`/`label` từng dòng, bắt buộc `checked: true` hết.

## Checklist (mirror)

- [x] Model + migration: `journal_checklist_templates`, cột journal `checklist_template_id` + `checklist_snapshot`
- [x] API CRUD template + validate tạo/sửa journal phải khớp template và tick đủ
- [x] Frontend: quản lý checklist + form journal (chọn template, tick hết mới Lưu)
- [x] `go build` backend; smoke UI
