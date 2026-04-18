import { alpha } from '@mui/material/styles'

/** Post list cards — squarer corners. */
export const POST_CARD_RADIUS_PX = 12
/** Journal list cards — larger corner radius. */
export const JOURNAL_CARD_RADIUS_PX = 24

/**
 * Custom list / chrome “card” — left accent bar, soft gradient, optional hover lift.
 * @param {import('@mui/material/styles').Theme} theme
 * @param {{ accent?: string; interactive?: boolean; radiusPx?: number }} [opts]
 */
export function tradingListCard(theme, opts = {}) {
  const accent = opts.accent ?? theme.palette.primary.main
  const interactive = opts.interactive !== false
  const radiusPx = opts.radiusPx ?? POST_CARD_RADIUS_PX
  const isDark = theme.palette.mode === 'dark'

  const baseBg = isDark
    ? alpha('#131b26', 0.65)
    : alpha(theme.palette.background.paper, 0.97)
  const gradA = isDark
    ? alpha('#2a3d52', 0.35)
    : alpha(theme.palette.primary.main, 0.07)
  const gradB = isDark
    ? alpha('#161d28', 0.95)
    : alpha(theme.palette.grey[100], 0.95)
  const shadowA = isDark ? alpha('#000', 0.35) : alpha('#1e293b', 0.09)
  const shadowB = isDark ? alpha('#000', 0.45) : alpha('#1e293b', 0.12)
  const inset = isDark ? alpha('#fff', 0.06) : alpha('#fff', 0.95)

  return {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: `${radiusPx}px`,
    pl: 2.5,
    border: `1px solid ${alpha(accent, isDark ? 0.2 : 0.22)}`,
    backgroundColor: baseBg,
    backgroundImage: `
      linear-gradient(135deg, ${gradA} 0%, transparent 46%),
      linear-gradient(165deg, ${alpha(theme.palette.background.paper, isDark ? 0.2 : 0.4)} 0%, ${gradB} 100%)
    `,
    boxShadow: `
      0 6px 24px ${shadowA},
      inset 0 1px 0 ${inset}
    `,
    backdropFilter: 'blur(10px)',
    transition: interactive ? 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease' : undefined,
    ...(interactive
      ? {
          '&:hover': {
            transform: 'translateY(-3px)',
            borderColor: alpha(accent, isDark ? 0.42 : 0.38),
            boxShadow: `
              0 14px 32px ${shadowB},
              0 0 20px ${alpha(accent, isDark ? 0.14 : 0.1)},
              inset 0 1px 0 ${inset}
            `,
          },
        }
      : {}),
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      background: `linear-gradient(180deg, ${accent} 0%, ${alpha(accent, 0.22)} 100%)`,
      boxShadow: `0 0 14px ${alpha(accent, isDark ? 0.35 : 0.25)}`,
    },
  }
}
