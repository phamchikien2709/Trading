import {
  BrowserRouter,
  Link as RouterLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DynamicFeedOutlinedIcon from "@mui/icons-material/DynamicFeedOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SearchIcon from "@mui/icons-material/Search";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Journal from "./pages/Journal";
import Feed from "./pages/Feed";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import NotificationsNavLink from "./components/NotificationsNavLink";
import { APP_VIEWPORT_MAX_PX } from "./constants/layout";
import { authAPI } from "./services/api";

/** Palette gần Facebook cho header (logo, tab active, pill tìm kiếm). */
const HEADER_FB = {
  blue: "#1877F2",
  surface: "#F0F2F5",
  iconMuted: "#65676B",
  border: "#dddfe2",
};

function HomeRedirect() {
  return (
    <Navigate
      to={localStorage.getItem("token") ? "/dashboard" : "/login"}
      replace
    />
  );
}

/** Nền trang trí tùy chọn; tối ưu cho giao diện sáng. */
function ThemeHeroBackdrop() {
  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        position: "absolute",
        left: "50%",
        top: theme.spacing(2),
        transform: "translateX(-50%)",
        width: `min(${APP_VIEWPORT_MAX_PX}px, calc(100% - 24px))`,
        height: "min(586px, 48vh)",
        borderRadius: 2,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
        bgcolor: alpha(theme.palette.primary.main, 0.06),
        backgroundImage: "url(/theme.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.45,
        boxShadow: `inset 0 0 80px ${alpha(theme.palette.background.default, 0.75)}`,
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.2)} 0%, ${alpha(theme.palette.background.default, 0.92)} 100%)`,
        },
      })}
    />
  );
}

function navMatch(pathname, to) {
  if (to === "/feed")
    return pathname === "/feed" || pathname.startsWith("/posts/");
  if (to === "/notifications") return pathname === "/notifications";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function CenterNavIcon({ to, title, active, children }) {
  return (
    <Tooltip title={title}>
      <Box
        component={RouterLink}
        to={to}
        aria-current={active ? "page" : undefined}
        sx={{
          height: 56,
          minWidth: { xs: 56, sm: 72 },
          px: { xs: 0.5, sm: 1.5 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          color: active ? HEADER_FB.blue : HEADER_FB.iconMuted,
          borderBottom: active ? `3px solid ${HEADER_FB.blue}` : "3px solid transparent",
          boxSizing: "border-box",
          borderRadius: "10px 10px 0 0",
          "&:hover": {
            bgcolor: "rgba(0, 0, 0, 0.05)",
          },
        }}
      >
        <Box sx={{ "& .MuiSvgIcon-root": { fontSize: { xs: 26, sm: 28 } } }}>
          {children}
        </Box>
      </Box>
    </Tooltip>
  );
}

function AppHeader() {
  const theme = useTheme();
  const { pathname } = useLocation();
  const authed = !!localStorage.getItem("token");

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => authAPI.getProfile().then((r) => r.data),
    enabled: authed,
  });

  const profileName =
    profileQ.data?.display_name ||
    profileQ.data?.username ||
    profileQ.data?.email ||
    "";

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: "#ffffff",
        borderBottom: `1px solid ${HEADER_FB.border}`,
        boxShadow: "none",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          maxWidth: `${APP_VIEWPORT_MAX_PX}px`,
          width: "100%",
          mx: "auto",
          px: { xs: 1, sm: 2 },
          minHeight: 56,
          height: 56,
          display: "grid",
          gridTemplateColumns: authed ? "1fr auto 1fr" : "auto 1fr auto",
          alignItems: "center",
          columnGap: { xs: 0.5, sm: 1 },
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.75, sm: 1 },
            justifySelf: "start",
          }}
        >
          <Box
            component={RouterLink}
            to={authed ? "/dashboard" : "/login"}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
              color: "inherit",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: HEADER_FB.blue,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.35rem",
                fontFamily: theme.typography.fontFamily,
              }}
              aria-hidden
            >
              M
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                display: { xs: "none", md: "block" },
                fontWeight: 700,
                color: HEADER_FB.blue,
                letterSpacing: 0.01,
              }}
            >
              My Platform
            </Typography>
          </Box>
          <Box
            component="label"
            sx={{
              flex: "1 1 auto",
              maxWidth: { xs: 160, sm: 240, md: 320 },
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              bgcolor: HEADER_FB.surface,
              cursor: "text",
            }}
          >
            <SearchIcon sx={{ fontSize: 20, color: HEADER_FB.iconMuted }} />
            <InputBase
              placeholder="Tìm kiếm trên My Platform"
              inputProps={{ "aria-label": "Tìm kiếm trên My Platform" }}
              sx={{
                flex: 1,
                fontSize: "0.9375rem",
                "& .MuiInputBase-input": {
                  p: 0,
                  "&::placeholder": {
                    color: HEADER_FB.iconMuted,
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>
        </Box>

        {authed ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              height: 56,
              justifySelf: "center",
            }}
          >
            <CenterNavIcon
              to="/dashboard"
              title="Tổng quan"
              active={navMatch(pathname, "/dashboard")}
            >
              <DashboardOutlinedIcon />
            </CenterNavIcon>
            <CenterNavIcon
              to="/journal"
              title="Nhật ký"
              active={navMatch(pathname, "/journal")}
            >
              <MenuBookOutlinedIcon />
            </CenterNavIcon>
            <CenterNavIcon
              to="/feed"
              title="Bài viết"
              active={navMatch(pathname, "/feed")}
            >
              <DynamicFeedOutlinedIcon />
            </CenterNavIcon>
          </Box>
        ) : (
          <Box aria-hidden sx={{ minWidth: 0 }} />
        )}

        <Box
          sx={{
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: { xs: 0.5, sm: 0.75 },
            justifySelf: "end",
          }}
        >
          {authed ? (
            <>
              <NotificationsNavLink active={navMatch(pathname, "/notifications")} />
              <Tooltip title={profileName ? `Hồ sơ — ${profileName}` : "Hồ sơ"}>
                <Box
                  component={RouterLink}
                  to="/profile"
                  sx={{
                    position: "relative",
                    display: "inline-flex",
                    textDecoration: "none",
                  }}
                >
                  <Avatar
                    src={profileQ.data?.avatar_url || undefined}
                    alt={profileName || "Hồ sơ"}
                    sx={{
                      width: 40,
                      height: 40,
                      border: "2px solid #fff",
                      boxShadow: `0 0 0 1px ${HEADER_FB.border}`,
                    }}
                  >
                    {(profileName || "?").charAt(0).toUpperCase()}
                  </Avatar>
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      right: -2,
                      bottom: -2,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      bgcolor: HEADER_FB.surface,
                      border: `2px solid #fff`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.55rem",
                      color: HEADER_FB.iconMuted,
                      lineHeight: 1,
                    }}
                  >
                    ▼
                  </Box>
                </Box>
              </Tooltip>
            </>
          ) : (
            <>
              <Button
                component={RouterLink}
                to="/login"
                variant="text"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: HEADER_FB.blue,
                  minWidth: "auto",
                }}
              >
                Đăng nhập
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: HEADER_FB.blue,
                  boxShadow: "none",
                  px: 1.5,
                  "&:hover": { bgcolor: "#166fe5", boxShadow: "none" },
                }}
              >
                Đăng ký
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function Layout({ children }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <AppHeader />
      <Box
        component="main"
        sx={{ flex: 1, position: "relative", overflow: "hidden" }}
      >
        <ThemeHeroBackdrop />
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            maxWidth: `${APP_VIEWPORT_MAX_PX}px`,
            width: "100%",
            mx: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid rgba(15, 23, 42, 0.12)",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.1)",
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal"
            element={
              <ProtectedRoute>
                <Journal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route path="/posts/new" element={<Navigate to="/feed" replace />} />
          <Route
            path="/posts/:id"
            element={
              <ProtectedRoute>
                <PostDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
