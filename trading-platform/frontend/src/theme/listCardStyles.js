import { alpha } from '@mui/material/styles'

/** Bán kính thống nhất cho thẻ danh sách bài viết và nhật ký. */
export const LIST_CARD_RADIUS_PX = 24
/** @deprecated Bí danh — dùng LIST_CARD_RADIUS_PX */
export const JOURNAL_CARD_RADIUS_PX = LIST_CARD_RADIUS_PX
/** @deprecated Bí danh — dùng LIST_CARD_RADIUS_PX */
export const POST_CARD_RADIUS_PX = LIST_CARD_RADIUS_PX

/**
 * Thẻ danh sách tùy chỉnh — thanh nhấn trái, nền gradient mềm, có thể nổi khi di chuột.
 * @param {import('@mui/material/styles').Theme} theme
 * @param {{ accent?: string; interactive?: boolean; radiusPx?: number }} [tuyChon]
 */
export function tradingListCard(theme, tuyChon = {}) {
  const accent = tuyChon.accent ?? theme.palette.secondary.main
  const interactive = tuyChon.interactive !== false
  const radiusPx = tuyChon.radiusPx ?? LIST_CARD_RADIUS_PX
  const isDark = theme.palette.mode === 'dark'

  const baseBg = isDark
    ? alpha('#131b26', 0.65)
    : alpha(theme.palette.background.paper, 0.97)
  const gradA = isDark
    ? alpha('#2a3d52', 0.35)
    : alpha(accent, 0.09)
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
