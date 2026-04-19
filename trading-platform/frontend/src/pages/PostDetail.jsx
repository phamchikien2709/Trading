import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { alpha, useTheme } from "@mui/material/styles";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { APP_VIEWPORT_MAX_PX } from "../constants/layout";
import { LIST_CARD_RADIUS_PX, tradingListCard } from "../theme/listCardStyles";
import { authAPI, postAPI } from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";

function userInitial(username) {
  return (username?.charAt(0) || "?").toUpperCase();
}

export default function PostDetail() {
  const theme = useTheme();
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const postId = Number(id);
  const [comment, setComment] = useState("");
  const [confirmDeletePostOpen, setConfirmDeletePostOpen] = useState(false);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null);

  const postQ = useQuery({
    queryKey: ["post", postId],
    queryFn: () => postAPI.getById(postId).then((r) => r.data),
    enabled: Number.isFinite(postId) && postId > 0,
  });

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => authAPI.getProfile().then((r) => r.data),
  });

  const likeM = useMutation({
    mutationFn: () => postAPI.like(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["notificationsUnread"] });
    },
    onError: (e) =>
      toast.error(e.response?.data?.error || "Thao tác thích thất bại"),
  });

  const unlikeM = useMutation({
    mutationFn: () => postAPI.unlike(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["notificationsUnread"] });
    },
  });

  const commentM = useMutation({
    mutationFn: (content) => postAPI.comment(postId, content),
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["post", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["notificationsUnread"] });
      toast.success("Đã thêm bình luận");
    },
    onError: (e) =>
      toast.error(e.response?.data?.error || "Gửi bình luận thất bại"),
  });

  const deletePostM = useMutation({
    mutationFn: () => postAPI.deletePost(postId),
    onSuccess: () => {
      setConfirmDeletePostOpen(false);
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Đã xóa bài viết");
      nav("/feed", { replace: true });
    },
    onError: (e) => {
      setConfirmDeletePostOpen(false);
      toast.error(e.response?.data?.error || "Không xóa được bài viết");
    },
  });

  const deleteCommentM = useMutation({
    mutationFn: (commentId) => postAPI.deleteComment(postId, commentId),
    onSuccess: () => {
      setConfirmDeleteCommentId(null);
      qc.invalidateQueries({ queryKey: ["post", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Đã xóa bình luận");
    },
    onError: (e) => {
      setConfirmDeleteCommentId(null);
      toast.error(e.response?.data?.error || "Không xóa được bình luận");
    },
  });

  if (!Number.isFinite(postId) || postId <= 0) {
    return (
      <Box sx={{ p: 3, maxWidth: `${APP_VIEWPORT_MAX_PX}px`, mx: "auto" }}>
        <Typography>Bài viết không hợp lệ.</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => nav("/feed")}>
          Về danh sách bài viết
        </Button>
      </Box>
    );
  }

  if (postQ.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (postQ.isError) {
    return (
      <Box
        sx={{
          p: 3,
          maxWidth: `${APP_VIEWPORT_MAX_PX}px`,
          width: "100%",
          mx: "auto",
        }}
      >
        <Typography color="error">
          {postQ.error?.response?.data?.error || "Không tải được bài viết."}
        </Typography>
        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => nav("/feed")}
        >
          Về danh sách bài viết
        </Button>
      </Box>
    );
  }

  const p = postQ.data;
  const symbols = Array.isArray(p.symbols) ? p.symbols : [];
  const comments = Array.isArray(p.comments) ? p.comments : [];
  const liked = Boolean(p.liked_by_me);
  const busy = likeM.isPending || unlikeM.isPending;
  const author = p.user?.username || "Người dùng";
  const myId = profileQ.data?.id;
  const isPostOwner = myId != null && myId === p.user_id;
  const authorProfileTo =
    p.user_id != null && p.user_id > 0 ? `/profile/${p.user_id}` : null;

  const toggleLike = () => {
    if (liked) unlikeM.mutate();
    else likeM.mutate();
  };

  const cardAccent = theme.palette.secondary.main;

  return (
    <Box
      sx={{
        maxWidth: `${APP_VIEWPORT_MAX_PX}px`,
        width: "100%",
        mx: "auto",
        py: 3,
        px: 2,
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => nav(-1)}
        variant="text"
        color="primary"
        sx={{ mb: 2, textTransform: "none", fontWeight: 600 }}
      >
        Quay lại
      </Button>

      <Card
        elevation={0}
        sx={{
          ...tradingListCard(theme, {
            accent: cardAccent,
            interactive: false,
          }),
        }}
      >
        <CardContent sx={{ py: 2.25 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={2}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
              sx={{ minWidth: 0 }}
            >
              <Avatar
                component={authorProfileTo ? RouterLink : "div"}
                {...(authorProfileTo ? { to: authorProfileTo } : {})}
                sx={{
                  width: 48,
                  height: 48,
                  fontWeight: 700,
                  bgcolor: alpha(cardAccent, 0.15),
                  color: "secondary.dark",
                  ...(authorProfileTo
                    ? { textDecoration: "none", cursor: "pointer" }
                    : {}),
                }}
              >
                {userInitial(author)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={1}
                  flexWrap="wrap"
                >
                  <Typography
                    component={authorProfileTo ? RouterLink : "span"}
                    {...(authorProfileTo ? { to: authorProfileTo } : {})}
                    variant="h5"
                    fontWeight={800}
                    sx={{
                      letterSpacing: 1,
                      fontFamily: "inherit",
                      ...(authorProfileTo
                        ? {
                            color: "inherit",
                            textDecoration: "none",
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" },
                          }
                        : {}),
                    }}
                  >
                    {author}
                  </Typography>
                  <Chip
                    icon={
                      <ArticleOutlinedIcon sx={{ "&&": { fontSize: 18 } }} />
                    }
                    size="small"
                    label="Bài viết"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      border: "1px solid",
                      borderColor: alpha(cardAccent, 0.55),
                      color: cardAccent,
                      bgcolor: alpha(cardAccent, 0.12),
                      "& .MuiChip-icon": { color: cardAccent },
                    }}
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.25 }}
                >
                  {new Date(p.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ flexShrink: 0 }}
            >
              {isPostOwner && (
                <IconButton
                  aria-label="Xóa bài viết"
                  color="warning"
                  disabled={deletePostM.isPending || busy}
                  onClick={() => setConfirmDeletePostOpen(true)}
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.12),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.warning.main, 0.22),
                    },
                  }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              )}
              <IconButton
                aria-label={liked ? "Bỏ thích" : "Thích"}
                onClick={toggleLike}
                disabled={busy}
                color={liked ? "error" : "default"}
                sx={{
                  bgcolor: liked
                    ? alpha(theme.palette.error.main, 0.12)
                    : alpha(theme.palette.action.hover, 0.5),
                  "&:hover": {
                    bgcolor: liked
                      ? alpha(theme.palette.error.main, 0.2)
                      : alpha(theme.palette.action.hover, 0.9),
                  },
                }}
              >
                {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Stack>
          </Stack>

          <Typography
            variant="body2"
            sx={{ mt: 2, whiteSpace: "pre-wrap", lineHeight: 1.55 }}
          >
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
                    borderColor: alpha(cardAccent, 0.45),
                    color: "secondary.dark",
                    bgcolor: alpha(cardAccent, 0.08),
                  }}
                />
              ))}
              {p.timeframe && (
                <Chip size="small" variant="outlined" label={p.timeframe} />
              )}
              {p.analysis_type && (
                <Chip size="small" variant="outlined" label={p.analysis_type} />
              )}
            </Stack>
          )}

          {p.chart_image_url && (
            <CardMedia
              component="img"
              image={p.chart_image_url}
              alt="Biểu đồ"
              sx={{
                mt: 2,
                borderRadius: `${Math.max(LIST_CARD_RADIUS_PX - 6, 4)}px`,
                maxHeight: 380,
                objectFit: "contain",
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
            bgcolor: alpha(cardAccent, 0.04),
          }}
        >
          <Stack direction="row" alignItems="center" gap={0.5}>
            <FavoriteBorderIcon sx={{ fontSize: 18, opacity: 0.75 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              {p.likes_count} lượt thích
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <ChatBubbleOutlinedIcon sx={{ fontSize: 18, opacity: 0.75 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              {p.comments_count} bình luận
            </Typography>
          </Stack>
        </Stack>
      </Card>

      <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1.5 }}>
        Bình luận
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 3,
          border: "none",
          boxShadow: "none",
          bgcolor: alpha(
            theme.palette.text.primary,
            theme.palette.mode === "dark" ? 0.06 : 0.04,
          ),
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          alignItems={{ xs: "stretch", sm: "flex-end" }}
        >
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={12}
            size="small"
            placeholder="Viết bình luận…"
            helperText="Viết bình luận…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const t = e.currentTarget.value.trim();
                if (t) commentM.mutate(t);
              }
            }}
            FormHelperTextProps={{ sx: { mx: 0, mt: 0.75 } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                alignItems: "flex-start",
                bgcolor: alpha(
                  theme.palette.background.paper,
                  theme.palette.mode === "dark" ? 0.35 : 0.85,
                ),
                "& fieldset": {
                  borderColor: alpha(theme.palette.divider, 0.35),
                },
                "&:hover fieldset": {
                  borderColor: alpha(theme.palette.divider, 0.55),
                },
              },
            }}
          />
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            disabled={commentM.isPending || !comment.trim()}
            onClick={() => commentM.mutate(comment.trim())}
            sx={{
              borderRadius: 999,
              px: 2.5,
              textTransform: "none",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Gửi
          </Button>
        </Stack>
      </Paper>

      {comments.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          Chưa có bình luận.
        </Typography>
      ) : (
        <Box
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: alpha(
              theme.palette.text.primary,
              theme.palette.mode === "dark" ? 0.04 : 0.025,
            ),
          }}
        >
          {comments.map((c, idx) => {
            const commentProfileTo =
              c.user_id != null && c.user_id > 0
                ? `/profile/${c.user_id}`
                : null;
            return (
            <Box
              key={c.id}
              sx={{
                px: { xs: 1.25, sm: 2 },
                py: 1.75,
                borderBottom:
                  idx < comments.length - 1
                    ? `1px solid ${alpha(theme.palette.divider, 0.55)}`
                    : "none",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar
                  component={commentProfileTo ? RouterLink : "div"}
                  {...(commentProfileTo ? { to: commentProfileTo } : {})}
                  sx={{
                    width: 40,
                    height: 40,
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                    color: "secondary.dark",
                    ...(commentProfileTo
                      ? { textDecoration: "none", cursor: "pointer" }
                      : {}),
                  }}
                >
                  {userInitial(c.user?.username)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                    flexWrap="wrap"
                  >
                    <Stack
                      direction="row"
                      alignItems="baseline"
                      gap={1}
                      flexWrap="wrap"
                      sx={{ minWidth: 0 }}
                    >
                      <Typography
                        component={commentProfileTo ? RouterLink : "span"}
                        {...(commentProfileTo ? { to: commentProfileTo } : {})}
                        variant="subtitle2"
                        fontWeight={700}
                        sx={
                          commentProfileTo
                            ? {
                                color: "inherit",
                                textDecoration: "none",
                                cursor: "pointer",
                                "&:hover": { textDecoration: "underline" },
                              }
                            : undefined
                        }
                      >
                        {c.user?.username || "Người dùng"}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ flexShrink: 0 }}
                      >
                        {new Date(c.created_at).toLocaleString()}
                      </Typography>
                    </Stack>
                    {myId != null && myId === c.user_id && (
                      <IconButton
                        size="small"
                        aria-label="Xóa bình luận"
                        color="warning"
                        disabled={deleteCommentM.isPending}
                        onClick={() => setConfirmDeleteCommentId(c.id)}
                        sx={{ ml: "auto" }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.75,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.55,
                      color: "text.primary",
                    }}
                  >
                    {c.content}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            );
          })}
        </Box>
      )}

      <ConfirmDialog
        open={confirmDeletePostOpen}
        onClose={() => setConfirmDeletePostOpen(false)}
        title="Xóa bài viết?"
        description="Thao tác không thể hoàn tác. Bài viết, lượt thích và bình luận liên quan sẽ bị xóa."
        danger
        confirmLabel="Xóa"
        loading={deletePostM.isPending}
        onConfirm={() => deletePostM.mutate()}
      />

      <ConfirmDialog
        open={confirmDeleteCommentId != null}
        onClose={() => setConfirmDeleteCommentId(null)}
        title="Xóa bình luận?"
        description="Bình luận sẽ bị gỡ khỏi bài viết."
        danger
        confirmLabel="Xóa"
        loading={deleteCommentM.isPending}
        onConfirm={() => {
          if (confirmDeleteCommentId != null)
            deleteCommentM.mutate(confirmDeleteCommentId);
        }}
      />
    </Box>
  );
}
