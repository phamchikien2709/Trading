import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  formDialogActionsSx,
  formDialogContentSx,
  formDialogPaperSx,
  formDialogTitleSx,
} from '../theme/formDialogStyles'

export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
  loading = false,
  onConfirm,
}) {
  const theme = useTheme()

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!loading) onClose()
      }}
      fullWidth
      maxWidth="xs"
      scroll="body"
      PaperProps={{ sx: formDialogPaperSx(theme) }}
    >
      <DialogTitle sx={formDialogTitleSx}>{title}</DialogTitle>
      <DialogContent sx={formDialogContentSx}>
        {description != null && description !== '' && (
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {description}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={formDialogActionsSx(theme)}>
        <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="inherit" disabled={loading} onClick={onClose} sx={{ minWidth: 88 }}>
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            color={danger ? 'error' : 'primary'}
            disabled={loading}
            onClick={() => onConfirm?.()}
            sx={{ minWidth: 100, gap: 1 }}
          >
            {loading && <CircularProgress size={18} color="inherit" />}
            {loading ? 'Đang xử lý…' : confirmLabel}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}
