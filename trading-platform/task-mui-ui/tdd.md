# TDD — MUI feed / post detail / journal

## Goal

Material UI cho feed và journal; bài viết mở trang chi tiết với like + comment; journal tạo bằng popup, xem chi tiết bằng popup.

## API

- `GET /api/posts/:id`: post + `User` + `Comments` (kèm `User`), chỉ khi post thuộc user hoặc user được follow (cùng logic feed).
- `Post.liked_by_me`: `gorm:"-"`, set ở `GetPost` và batch trong `GetNewsfeed`.

## UI

- MUI `Card`, `AppBar`, `Dialog`, `IconButton` (Favorite), `List` comments.
- Feed: bỏ form comment inline; nút / click → `/posts/:id`.

## Checklist mirror

- [x] Backend: `GET /api/posts/:id` + `liked_by_me` trên feed
- [x] Frontend: cài MUI, `ThemeProvider` + `CssBaseline`
- [x] Trang `PostDetail`, route `/posts/:id`, API `getPost`
- [x] `Feed` MUI: card, điều hướng chi tiết, like dựa `liked_by_me`
- [x] `Journal` MUI: dialog tạo mới, dialog chi tiết khi click hàng
- [x] `npm run build` pass
