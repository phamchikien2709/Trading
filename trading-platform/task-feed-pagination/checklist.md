# Feed pagination (20 / page, load more)

- [x] Backend: `GET /feed` — query `after_id`, keyset + `limit 21`, JSON `{ items, has_more }`
- [x] Frontend: `postAPI.getFeed({ after_id })` + `useInfiniteQuery` + sentinel `IntersectionObserver`
- [x] Chạy `go build` (backend) và `npm run build` (frontend)
