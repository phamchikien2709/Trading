import { alpha, createTheme } from '@mui/material/styles'

/** Light UI + Roboto; primary accent for cards / chrome. */
export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1e56a8', light: '#4a7fd4', dark: '#153f7d' },
    secondary: { main: '#0d9488', light: '#2dd4bf', dark: '#0f766e' },
    background: {
      default: '#f0f4f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: alpha('#1e293b', 0.1),
    success: { main: '#15803d' },
    error: { main: '#b91c1c' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${alpha('#1e56a8', 0.35)} ${alpha('#cbd5e1', 0.8)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          boxShadow: `0 2px 10px ${alpha('#1e56a8', 0.28)}`,
        },
      },
    },
  },
})
