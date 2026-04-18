# TDD — Dashboard period stats

## Goal

Dashboard lọc journal theo **Tất cả / Tháng này / Năm nay**, gom **theo ngày | tháng | năm** để thống kê và biểu đồ (client-side, không đổi API).

## Approach

- `traded_at` so sánh theo local midnight bounds cho preset.
- Cards (tổng PnL, số lệnh, win, win rate) tính trên `filteredJournals`.
- Line chart: cumulative theo từng lệnh trong `filteredJournals` (thứ tự thời gian).
- Bar chart: tổng PnL mỗi bucket (sort theo `key` ISO).

## Checklist (mirror)

- [x] Helpers: khoảng thời gian (tháng/năm) + bucket key theo granularity
- [x] UI: preset range + nhóm ngày/tháng/năm (MUI ToggleButtonGroup)
- [x] Thống kê & biểu đồ theo dữ liệu đã lọc (cards + cumulative line + bar theo bucket)
- [x] `npm run build` + `npm run lint` (frontend)
