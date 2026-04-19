import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { alpha, useTheme } from "@mui/material/styles";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageHeader } from "../components/PageHeader";
import { APP_VIEWPORT_MAX_PX } from "../constants/layout";
import { LIST_CARD_RADIUS_PX, tradingListCard } from "../theme/listCardStyles";
import { notificationAPI } from "../services/api";

const typeLabel = {
  like: "Thích bài",
  comment: "Bình luận",
  follow: "Theo dõi",
  expert_rating: "Đánh giá chuyên gia",
};

export default function Notifications() {
  const theme = useTheme();
  const nav = useNavigate();
  const qc = useQueryClient();
  const accent = theme.palette.secondary.main;

  const listQ = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationAPI.list().then((r) => r.data),
  });

  const markReadM = useMutation({
    mutationFn: (id) => notificationAPI.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notificationsUnread"] });
    },
    onError: (e) =>
      toast.error(e.response?.data?.error || "Không cập nhật được"),
  });

  const markAllM = useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notificationsUnread"] });
      toast.success("Đã đánh dấu đã đọc");
    },
    onError: (e) =>
      toast.error(e.response?.data?.error || "Thao tác thất bại"),
  });

  const items = Array.isArray(listQ.data?.items) ? listQ.data.items : [];
  const unread = items.filter((n) => !n.read_at).length;

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["notificationsUnread"] });
  }, [qc]);

  const openItem = (n) => {
    if (!n.read_at) markReadM.mutate(n.id);
    if (n.post_id != null && n.post_id > 0) {
      nav(`/posts/${n.post_id}`);
    }
  };

  return (
    <Box sx={{ maxWidth: `${APP_VIEWPORT_MAX_PX}px`, width: "100%", mx: "auto", py: 3, px: 2 }}>
      <PageHeader
        title="Thông báo"
        subtitle="Thích, bình luận, theo dõi và đánh giá chuyên gia liên quan đến bạn."
        action={
          unread > 0 ? (
            <Button
              variant="outlined"
              size="medium"
              disabled={markAllM.isPending}
              onClick={() => markAllM.mutate()}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 999 }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          ) : null
        }
      />

      {listQ.isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {listQ.isError && (
        <Typography color="error" sx={{ mt: 2 }}>
          {listQ.error?.response?.data?.error || "Không tải được thông báo."}
        </Typography>
      )}

      {!listQ.isLoading && !listQ.isError && items.length === 0 && (
        <Stack alignItems="center" spacing={1.5} sx={{ py: 8, color: "text.secondary" }}>
          <NotificationsNoneOutlinedIcon sx={{ fontSize: 48, opacity: 0.5 }} />
          <Typography variant="body1">Chưa có thông báo.</Typography>
        </Stack>
      )}

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {items.map((n) => (
          <Card
            key={n.id}
            elevation={0}
            sx={{
              ...tradingListCard(theme, { accent, interactive: true }),
              borderRadius: `${LIST_CARD_RADIUS_PX}px`,
              opacity: n.read_at ? 0.72 : 1,
            }}
          >
            <CardActionArea
              onClick={() => openItem(n)}
              disabled={markReadM.isPending}
              sx={{ alignItems: "stretch" }}
            >
              <CardContent sx={{ py: 1.75, px: 2 }}>
                <Stack direction="row" alignItems="flex-start" spacing={1.25} flexWrap="wrap">
                  <Chip
                    size="small"
                    label={typeLabel[n.type] || n.type}
                    sx={{
                      fontWeight: 700,
                      borderColor: alpha(accent, 0.45),
                      color: "secondary.dark",
                      bgcolor: alpha(accent, 0.08),
                    }}
                    variant="outlined"
                  />
                  {!n.read_at && (
                    <Chip size="small" color="primary" label="Mới" sx={{ fontWeight: 700 }} />
                  )}
                </Stack>
                <Typography variant="body1" sx={{ mt: 1, fontWeight: n.read_at ? 500 : 600 }}>
                  {n.body}
                </Typography>
                {n.actor?.username && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    Từ @{n.actor.username}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                  {new Date(n.created_at).toLocaleString()}
                  {n.post_id != null && n.post_id > 0 ? " · Nhấn để mở bài viết" : ""}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
