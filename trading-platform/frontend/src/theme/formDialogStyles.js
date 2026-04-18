import { alpha } from '@mui/material/styles'
import { POST_CARD_RADIUS_PX } from './listCardStyles'

/** Shared “form sheet” look for New post / New journal dialogs. */
export function formDialogPaperSx(theme) {
  return {
    borderRadius: `${POST_CARD_RADIUS_PX}px`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
    backgroundImage: `
      linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 45%),
      linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.grey[50], 0.98)} 100%)
    `,
    boxShadow: `0 20px 50px ${alpha('#0f172a', 0.12)}, 0 0 1px ${alpha(theme.palette.primary.main, 0.15)}`,
    overflow: 'hidden',
  }
}

export const formDialogTitleSx = {
  px: 2.5,
  pt: 2.5,
  pb: 1,
  fontSize: '1.125rem',
  fontWeight: 800,
  letterSpacing: 0.02,
  lineHeight: 1.3,
}

export const formDialogContentSx = {
  px: 2.5,
  pt: 0.5,
  pb: 1,
}

export const formDialogActionsSx = (theme) => ({
  px: 2.5,
  py: 2,
  gap: 1,
  borderTop: `1px solid ${theme.palette.divider}`,
  bgcolor: alpha(theme.palette.primary.main, 0.03),
})
