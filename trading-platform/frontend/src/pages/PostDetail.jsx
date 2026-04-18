import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { alpha, useTheme } from '@mui/material/styles'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import SendIcon from '@mui/icons-material/Send'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { APP_VIEWPORT_MAX_PX } from '../constants/layout'
import { POST_CARD_RADIUS_PX, tradingListCard } from '../theme/listCardStyles'
import { postAPI } from '../services/api'

function userInitial(username) {
  return (username?.charAt(0) || '?').toUpperCase()
}

export default function PostDetail() {
  const theme = useTheme()
  const { id } = useParams()
  const nav = useNavigate()
  const qc = useQueryClient()
  const postId = Number(id)
  const [comment, setComment] = useState('')

  const postQ = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postAPI.getById(postId).then((r) => r.data),
    enabled: Number.isFinite(postId) && postId > 0,
  })

  const likeM = useMutation({
    mutationFn: () => postAPI.like(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post', postId] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Like failed'),
  })

  const unlikeM = useMutation({
    mutationFn: () => postAPI.unlike(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post', postId] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  const commentM = useMutation({
    mutationFn: (content) => postAPI.comment(postId, content),
    onSuccess: () => {
      setComment('')
      qc.invalidateQueries({ queryKey: ['post', postId] })
      qc.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Comment added')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Comment failed'),
  })

  if (!Number.isFinite(postId) || postId <= 0) {
    return (
      <Box sx={{ p: 3, maxWidth: `${APP_VIEWPORT_MAX_PX}px`, mx: 'auto' }}>
        <Typography>Invalid post.</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => nav('/feed')}>
          Back to posts
        </Button>
      </Box>
    )
  }

  if (postQ.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (postQ.isError) {
    return (
      <Box sx={{ p: 3, maxWidth: `${APP_VIEWPORT_MAX_PX}px`, width: '100%', mx: 'auto' }}>
        <Typography color="error">{postQ.error?.response?.data?.error || 'Could not load post.'}</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => nav('/feed')}>
          Back to posts
        </Button>
      </Box>
    )
  }

  const p = postQ.data
  const symbols = Array.isArray(p.symbols) ? p.symbols : []
  const comments = Array.isArray(p.comments) ? p.comments : []
  const liked = Boolean(p.liked_by_me)
  const busy = likeM.isPending || unlikeM.isPending
  const author = p.user?.username || 'User'

  const toggleLike = () => {
    if (liked) unlikeM.mutate()
    else likeM.mutate()
  }

  return (
    <Box sx={{ maxWidth: `${APP_VIEWPORT_MAX_PX}px`, width: '100%', mx: 'auto', py: 3, px: 2 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => nav(-1)}
        variant="text"
        color="primary"
        sx={{ mb: 2, textTransform: 'none', fontWeight: 600 }}
      >
        Back
      </Button>

      <Card
        elevation={0}
        sx={{
          ...tradingListCard(theme, {
            accent: theme.palette.primary.main,
            radiusPx: POST_CARD_RADIUS_PX,
            interactive: false,
          }),
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: 'primary.dark',
                }}
              >
                {userInitial(author)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: 0.02 }}>
                    {author}
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
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                  {new Date(p.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
            <IconButton
              aria-label={liked ? 'Unlike' : 'Like'}
              onClick={toggleLike}
              disabled={busy}
              color={liked ? 'error' : 'default'}
              sx={{
                flexShrink: 0,
                bgcolor: liked ? alpha(theme.palette.error.main, 0.12) : alpha(theme.palette.action.hover, 0.5),
                '&:hover': {
                  bgcolor: liked ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.action.hover, 0.9),
                },
              }}
            >
              {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Stack>

          <Typography variant="body1" sx={{ mt: 2.5, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {p.content}
          </Typography>

          {(symbols.length > 0 || p.timeframe || p.analysis_type) && (
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 2 }}>
              {symbols.map((s) => (
                <Chip
                  key={s}
                  size="small"
                  label={s}
                  variant="outlined"
                  sx={{
                    borderColor: alpha(theme.palette.secondary.main, 0.45),
                    color: 'secondary.dark',
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  }}
                />
              ))}
              {p.timeframe && <Chip size="small" variant="outlined" label={p.timeframe} />}
              {p.analysis_type && <Chip size="small" variant="outlined" label={p.analysis_type} />}
            </Stack>
          )}

          {p.chart_image_url && (
            <CardMedia
              component="img"
              image={p.chart_image_url}
              alt="Chart"
              sx={{
                mt: 2,
                borderRadius: `${Math.max(POST_CARD_RADIUS_PX - 6, 4)}px`,
                maxHeight: 380,
                objectFit: 'contain',
                bgcolor: alpha(theme.palette.grey[200], 0.5),
                border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              }}
            />
          )}
        </CardContent>

        <Stack
          direction="row"
          alignItems="center"
          spacing={2.5}
          sx={{
            px: 2,
            py: 1.25,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Stack direction="row" alignItems="center" gap={0.5}>
            <FavoriteBorderIcon sx={{ fontSize: 18, opacity: 0.75 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {p.likes_count} likes
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <ChatBubbleOutlinedIcon sx={{ fontSize: 18, opacity: 0.75 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {p.comments_count} comments
            </Typography>
          </Stack>
        </Stack>
      </Card>

      <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1.5 }}>
        Comments
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.9),
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'stretch' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Write a comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const t = comment.trim()
                if (t) commentM.mutate(t)
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            disabled={commentM.isPending || !comment.trim()}
            onClick={() => commentM.mutate(comment.trim())}
            sx={{ borderRadius: 999, px: 2.5, textTransform: 'none', fontWeight: 600, alignSelf: { xs: 'stretch', sm: 'center' } }}
          >
            Send
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={1.5}>
        {comments.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            No comments yet.
          </Typography>
        )}
        {comments.map((c) => (
          <Card
            key={c.id}
            elevation={0}
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: alpha(theme.palette.divider, 0.9),
              bgcolor: alpha(theme.palette.grey[50], 0.6),
            }}
          >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                    color: 'secondary.dark',
                  }}
                >
                  {userInitial(c.user?.username)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle2" fontWeight={700}>
                      {c.user?.username || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.created_at).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {c.content}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
