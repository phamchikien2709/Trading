import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { APP_VIEWPORT_MAX_PX } from '../constants/layout'
import { authAPI, journalAPI } from '../services/api'

export default function Dashboard() {
  const theme = useTheme()
  const profileQ = useQuery({ queryKey: ['profile'], queryFn: () => authAPI.getProfile().then((r) => r.data) })
  const journalsQ = useQuery({ queryKey: ['journals'], queryFn: () => journalAPI.getAll().then((r) => r.data) })

  const journals = useMemo(() => journalsQ.data ?? [], [journalsQ.data])
  const totalPnl = useMemo(() => journals.reduce((s, j) => s + (Number(j.pnl) || 0), 0), [journals])
  const wins = useMemo(() => journals.filter((j) => (Number(j.pnl) || 0) > 0).length, [journals])

  const pnlSeries = useMemo(() => {
    const sorted = [...journals].sort((a, b) => new Date(a.traded_at) - new Date(b.traded_at))
    return sorted.reduce((acc, j, idx) => {
      const prev = acc.length ? acc[acc.length - 1].cumulative : 0
      const cumulative = Number((prev + (Number(j.pnl) || 0)).toFixed(2))
      acc.push({
        i: idx + 1,
        label: new Date(j.traded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        cumulative,
      })
      return acc
    }, [])
  }, [journals])

  const profitColor = totalPnl >= 0 ? 'success.main' : 'error.main'

  return (
    <Box sx={{ maxWidth: `${APP_VIEWPORT_MAX_PX}px`, width: '100%', mx: 'auto', py: 3, px: 2 }}>
      <Typography variant="h4" component="h1" fontWeight={700}>
        Dashboard
      </Typography>
      {(profileQ.isLoading || journalsQ.isLoading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {profileQ.data && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Signed in as <strong>{profileQ.data.username}</strong>
        </Typography>
      )}

      {!journalsQ.isLoading && (
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Total profit (journal PnL)
              </Typography>
              <Typography variant="h3" sx={{ color: profitColor, fontWeight: 800, mt: 0.5 }}>
                {totalPnl >= 0 ? '+' : ''}
                {totalPnl.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Sum of all logged trades. Add or edit entries in Journal.
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Trades logged
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {journals.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Winning trades
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {wins}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Win rate
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {journals.length ? `${Math.round((100 * wins) / journals.length)}%` : '—'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Cumulative PnL
              </Typography>
              {pnlSeries.length === 0 ? (
                <Typography color="text.secondary">No journal data yet — log trades to see the curve.</Typography>
              ) : (
                <Box sx={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <LineChart data={pnlSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="label" tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                      <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                          boxShadow: theme.shadows[2],
                        }}
                        labelStyle={{ color: theme.palette.text.primary }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        name="PnL"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>

          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            <Button component={RouterLink} to="/journal" variant="contained">
              Journal
            </Button>
            <Button component={RouterLink} to="/feed" variant="outlined">
              Posts
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  )
}
