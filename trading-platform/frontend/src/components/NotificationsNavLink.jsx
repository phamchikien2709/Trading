import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import { notificationAPI } from "../services/api";

const FB_BLUE = "#1877F2";
const FB_SURFACE = "#F0F2F5";
const FB_MUTED = "#65676B";

export default function NotificationsNavLink({ active }) {
  const unreadQ = useQuery({
    queryKey: ["notificationsUnread"],
    queryFn: () =>
      notificationAPI.unreadCount().then((r) => Number(r.data.unread_count) || 0),
    refetchInterval: 90_000,
  });
  const count = unreadQ.data ?? 0;

  return (
    <Badge
      badgeContent={count > 0 ? (count > 99 ? "99+" : count) : 0}
      color="error"
      overlap="circular"
      invisible={count === 0}
      sx={{
        "& .MuiBadge-badge": {
          fontWeight: 700,
          minWidth: 18,
          height: 18,
          px: 0.5,
          border: "2px solid #fff",
        },
      }}
    >
      <IconButton
        component={RouterLink}
        to="/notifications"
        aria-label="Thông báo"
        sx={{
          bgcolor: FB_SURFACE,
          width: 40,
          height: 40,
          color: active ? FB_BLUE : FB_MUTED,
          "&:hover": { bgcolor: "#e4e6eb" },
        }}
      >
        <NotificationsOutlinedIcon sx={{ fontSize: 22 }} />
      </IconButton>
    </Badge>
  );
}
