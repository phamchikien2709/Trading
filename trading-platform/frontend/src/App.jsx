import { BrowserRouter, Link as RouterLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Journal from './pages/Journal'
import Feed from './pages/Feed'
import PostDetail from './pages/PostDetail'
import Profile from './pages/Profile'
import { APP_VIEWPORT_MAX_PX } from './constants/layout'

function HomeRedirect() {
  return <Navigate to={localStorage.getItem('token') ? '/dashboard' : '/login'} replace />
}

/** Nền trang trí tùy chọn; tối ưu cho giao diện sáng. */
function ThemeHeroBackdrop() {
  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        position: 'absolute',
        left: '50%',
        top: theme.spacing(2),
        transform: 'translateX(-50%)',
        width: `min(${APP_VIEWPORT_MAX_PX}px, calc(100% - 24px))`,
        height: 'min(586px, 48vh)',
        borderRadius: 2,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        bgcolor: alpha(theme.palette.primary.main, 0.06),
        backgroundImage: 'url(/theme.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.45,
        boxShadow: `inset 0 0 80px ${alpha(theme.palette.background.default, 0.75)}`,
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.2)} 0%, ${alpha(theme.palette.background.default, 0.92)} 100%)`,
        },
      })}
    />
  )
}

function navMatch(pathname, to) {
  if (to === '/feed') return pathname === '/feed' || pathname.startsWith('/posts/')
  return pathname === to || pathname.startsWith(`${to}/`)
}

function AppHeader() {
  const theme = useTheme()
  const { pathname } = useLocation()
  const authed = !!localStorage.getItem('token')

  const navBtn = (to, label) => {
    const active = navMatch(pathname, to)
    return (
      <Button
        component={RouterLink}
        to={to}
        variant="text"
        color="primary"
        size="medium"
        sx={{
          fontWeight: active ? 700 : 500,
          textTransform: 'none',
          borderRadius: 2,
          px: 1.5,
          color: active ? 'primary.dark' : 'text.secondary',
          bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        {label}
      </Button>
    )
  }

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        backgroundColor: alpha(theme.palette.background.paper, 0.88),
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          maxWidth: `${APP_VIEWPORT_MAX_PX}px`,
          width: '100%',
          mx: 'auto',
          px: { xs: 2, sm: 2.5 },
          minHeight: { xs: 56, sm: 64 },
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          variant="h6"
          component={RouterLink}
          to={authed ? '/dashboard' : '/login'}
          sx={{
            flexGrow: { xs: 1, sm: 0 },
            mr: { sm: 3 },
            fontWeight: 700,
            color: 'primary.main',
            textDecoration: 'none',
            letterSpacing: 0.02,
          }}
        >
          Nền tảng giao dịch
        </Typography>
        {authed && (
          <Stack direction="row" flexWrap="wrap" alignItems="center" spacing={0.25} useFlexGap sx={{ flexGrow: { sm: 1 }, justifyContent: { sm: 'flex-end' } }}>
            {navBtn('/dashboard', 'Tổng quan')}
            {navBtn('/journal', 'Nhật ký')}
            {navBtn('/feed', 'Bài viết')}
            {navBtn('/profile', 'Hồ sơ')}
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  )
}

function Layout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader />
      <Box component="main" sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ThemeHeroBackdrop />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            maxWidth: `${APP_VIEWPORT_MAX_PX}px`,
            width: '100%',
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid rgba(15, 23, 42, 0.12)',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
  )
}
