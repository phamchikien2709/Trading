import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { alpha, useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
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
import CreatePostDialog from '../components/CreatePostDialog'
import { PageHeader, PagePrimaryButton } from '../components/PageHeader'
import { APP_VIEWPORT_MAX_PX } from '../constants/layout'
import { POST_CARD_RADIUS_PX, tradingListCard } from '../theme/listCardStyles'
import { postAPI } from '../services/api'

export default function Feed() {
  const theme = useTheme()
  const nav = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const qc = useQueryClient()
  const feedQ = useQuery({
    queryKey: ['feed'],
    queryFn: () => postAPI.getFeed().then((r) => r.data),
  })

  const likeM = useMutation({
    mutationFn: (id) => postAPI.like(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
    onError: (e) => toast.error(e.response?.data?.error || 'Like failed'),
  })

  const unlikeM = useMutation({
    mutationFn: (id) => postAPI.unlike(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })

  const posts = feedQ.data || []

  return (
    <Box sx={{ maxWidth: `${APP_VIEWPORT_MAX_PX}px`, width: '100%', mx: 'auto', py: 3, px: 2 }}>
      <PageHeader
        title="Posts"
        subtitle="From you and people you follow. Open a card for full thread and comments."
        action={
          <PagePrimaryButton startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            New post
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
                  accent: theme.palette.primary.main,
                  radiusPx: POST_CARD_RADIUS_PX,
                }),
              }}
            >
              <CardActionArea onClick={() => nav(`/posts/${p.id}`)} sx={{ alignItems: 'stretch' }}>
                <CardContent sx={{ pb: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: 0.02 }}>
                        {p.user?.username || 'User'}
                      </Typography>
                      <Chip
                        size="small"
                        label="Post"
                        sx={{
                          height: 22,
                          fontWeight: 700,
                          fontSize: 10,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          borderColor: alpha(theme.palette.primary.main, 0.45),
                          color: 'primary.dark',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          border: '1px solid',
                        }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, opacity: 0.9 }}>
                      {new Date(p.created_at).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{
                      mt: 1.75,
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
                            borderColor: alpha(theme.palette.secondary.main, 0.45),
                            color: 'secondary.light',
                            bgcolor: alpha(theme.palette.secondary.main, 0.08),
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
                        borderRadius: `${Math.max(POST_CARD_RADIUS_PX - 6, 4)}px`,
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
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
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
                <IconButton
                  size="small"
                  aria-label={liked ? 'Unlike' : 'Like'}
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
            </Card>
          )
        })}
      </Stack>

      {!feedQ.isLoading && posts.length === 0 && (
        <Typography sx={{ mt: 4 }} color="text.secondary">
          No posts yet. Use &quot;New post&quot; to publish.
        </Typography>
      )}
    </Box>
  )
}
