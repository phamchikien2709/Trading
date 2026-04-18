import { useMutation, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { alpha, useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ConfirmDialog from '../components/ConfirmDialog'
import CreatePostDialog from '../components/CreatePostDialog'
import { PageHeader, PagePrimaryButton } from '../components/PageHeader'
import { APP_VIEWPORT_MAX_PX } from '../constants/layout'
import { LIST_CARD_RADIUS_PX, tradingListCard } from '../theme/listCardStyles'
import { authAPI, postAPI } from '../services/api'

export default function Feed() {
  const theme = useTheme()
  const nav = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [confirmDeletePostId, setConfirmDeletePostId] = useState(null)
  const qc = useQueryClient()
  const profileQ = useQuery({
    queryKey: ['profile'],
    queryFn: () => authAPI.getProfile().then((r) => r.data),
  })
  const feedQ = useInfiniteQuery({
    queryKey: ['feed'],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      postAPI.getFeed(pageParam != null ? { after_id: pageParam } : {}).then((r) => r.data),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.has_more || !lastPage.items?.length) return undefined
      const tail = lastPage.items[lastPage.items.length - 1]
      return tail?.id
    },
  })

  const posts = feedQ.data?.pages.flatMap((p) => p.items ?? []) ?? []
  const loadMoreSentinelRef = useRef(null)

  useEffect(() => {
    const el = loadMoreSentinelRef.current
    if (!el) return undefined
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting)
        if (!hit) return
        if (!feedQ.hasNextPage || feedQ.isFetchingNextPage) return
        void feedQ.fetchNextPage()
      },
      { root: null, rootMargin: '240px', threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [feedQ.fetchNextPage, feedQ.hasNextPage, feedQ.isFetchingNextPage])

  const likeM = useMutation({
    mutationFn: (id) => postAPI.like(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
    onError: (e) => toast.error(e.response?.data?.error || 'Thao tác thích thất bại'),
  })

  const unlikeM = useMutation({
    mutationFn: (id) => postAPI.unlike(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })

  const deletePostM = useMutation({
    mutationFn: (id) => postAPI.deletePost(id),
    onSuccess: () => {
      setConfirmDeletePostId(null)
      qc.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Đã xóa bài viết')
    },
    onError: (e) => {
      setConfirmDeletePostId(null)
      toast.error(e.response?.data?.error || 'Không xóa được bài viết')
    },
  })

  const cardAccent = theme.palette.secondary.main

  return (
    <Box sx={{ maxWidth: `${APP_VIEWPORT_MAX_PX}px`, width: '100%', mx: 'auto', py: 3, px: 2 }}>
      <PageHeader
        title="Bài viết"
        subtitle="Từ bạn và người bạn theo dõi. Mở thẻ để xem đầy đủ và bình luận."
        action={
          <PagePrimaryButton startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Đăng bài
          </PagePrimaryButton>
        }
      />

      <CreatePostDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {feedQ.isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      <Stack spacing={2.25} sx={{ mt: 3 }}>
        {posts.map((p) => {
          const symbols = Array.isArray(p.symbols) ? p.symbols : []
          const liked = Boolean(p.liked_by_me)
          return (
            <Card
              key={p.id}
              elevation={0}
              sx={{
                ...tradingListCard(theme, {
                  accent: cardAccent,
                }),
              }}
            >
              <CardActionArea onClick={() => nav(`/posts/${p.id}`)} sx={{ alignItems: 'stretch' }}>
                <CardContent sx={{ py: 2.25 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                      <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 1, fontFamily: 'inherit' }}>
                        {p.user?.username || 'Người dùng'}
                      </Typography>
                      <Chip
                        icon={<ArticleOutlinedIcon sx={{ '&&': { fontSize: 18 } }} />}
                        label="Bài viết"
                        size="small"
                        sx={{
                          fontWeight: 800,
                          letterSpacing: 0.5,
                          border: '1px solid',
                          borderColor: alpha(cardAccent, 0.55),
                          color: cardAccent,
                          bgcolor: alpha(cardAccent, 0.12),
                          '& .MuiChip-icon': { color: cardAccent },
                        }}
                      />
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ flexShrink: 0, textAlign: 'right', maxWidth: '42%' }}
                    >
                      {new Date(p.created_at).toLocaleString()}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{
                      mt: 2,
                      lineHeight: 1.55,
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {p.content}
                  </Typography>

                  {symbols.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
                      {symbols.slice(0, 6).map((s) => (
                        <Chip
                          key={s}
                          size="small"
                          label={s}
                          variant="outlined"
                          sx={{
                            borderColor: alpha(cardAccent, 0.45),
                            color: 'secondary.dark',
                            bgcolor: alpha(cardAccent, 0.08),
                          }}
                        />
                      ))}
                    </Stack>
                  )}

                  {p.chart_image_url && (
                    <CardMedia
                      component="img"
                      image={p.chart_image_url}
                      alt=""
                      sx={{
                        mt: 2,
                        borderRadius: `${Math.max(LIST_CARD_RADIUS_PX - 6, 4)}px`,
                        maxHeight: 200,
                        objectFit: 'cover',
                        border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                      }}
                    />
                  )}
                </CardContent>
              </CardActionArea>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 2,
                  py: 1.25,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
                  bgcolor: alpha(cardAccent, 0.04),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2.5}>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <FavoriteBorderIcon sx={{ fontSize: 18, opacity: 0.75 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {p.likes_count}
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <ChatBubbleOutlinedIcon sx={{ fontSize: 18, opacity: 0.75 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {p.comments_count}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.25}>
                  {profileQ.data?.id === p.user_id && (
                    <IconButton
                      size="small"
                      aria-label="Xóa bài viết"
                      color="warning"
                      disabled={deletePostM.isPending}
                      sx={{
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.22) },
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setConfirmDeletePostId(p.id)
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    aria-label={liked ? 'Bỏ thích' : 'Thích'}
                    color={liked ? 'error' : 'default'}
                    sx={{
                      bgcolor: liked ? alpha(theme.palette.error.main, 0.12) : alpha(theme.palette.action.hover, 0.5),
                      '&:hover': {
                        bgcolor: liked ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.action.hover, 0.9),
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      if (liked) unlikeM.mutate(p.id)
                      else likeM.mutate(p.id)
                    }}
                  >
                    {liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                  </IconButton>
                </Stack>
              </Stack>
            </Card>
          )
        })}
        {posts.length > 0 && <Box ref={loadMoreSentinelRef} sx={{ height: 1 }} aria-hidden />}
      </Stack>

      {feedQ.isFetchingNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!feedQ.isLoading && !feedQ.hasNextPage && posts.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          Bạn đã xem hết bài mới nhất.
        </Typography>
      )}

      {!feedQ.isLoading && posts.length === 0 && (
        <Typography sx={{ mt: 4 }} color="text.secondary">
          Chưa có bài viết. Dùng &quot;Đăng bài&quot; để đăng.
        </Typography>
      )}

      <ConfirmDialog
        open={confirmDeletePostId != null}
        onClose={() => setConfirmDeletePostId(null)}
        title="Xóa bài viết?"
        description="Thao tác không thể hoàn tác. Bài viết, lượt thích và bình luận liên quan sẽ bị xóa."
        danger
        confirmLabel="Xóa"
        loading={deletePostM.isPending}
        onConfirm={() => {
          if (confirmDeletePostId != null) deletePostM.mutate(confirmDeletePostId)
        }}
      />
    </Box>
  )
}
