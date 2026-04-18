import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import {
  formDialogActionsSx,
  formDialogContentSx,
  formDialogPaperSx,
  formDialogTitleSx,
} from '../theme/formDialogStyles'
import { postAPI } from '../services/api'

const defaultValues = {
  content: '',
  chart_image_url: '',
  timeframe: '1H',
  symbols: 'EURUSD',
}

export default function CreatePostDialog({ open, onClose }) {
  const theme = useTheme()
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm({ defaultValues })

  useEffect(() => {
    if (open) reset(defaultValues)
  }, [open, reset])

  const m = useMutation({
    mutationFn: (payload) => postAPI.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Đã đăng bài')
      reset(defaultValues)
      onClose()
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Thất bại'),
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="body"
      PaperProps={{ sx: formDialogPaperSx(theme) }}
    >
      <DialogTitle sx={formDialogTitleSx}>Đăng bài mới</DialogTitle>
      <form
        id="create-post-dialog-form"
        onSubmit={handleSubmit((v) => {
          const symbols = v.symbols
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          m.mutate({
            content: v.content,
            chart_image_url: v.chart_image_url || undefined,
            timeframe: v.timeframe,
            symbols,
            analysis_type: 'technical',
          })
        })}
      >
        <DialogContent sx={formDialogContentSx}>
          <Stack spacing={2.25}>
            <TextField
              label="Nội dung"
              multiline
              minRows={5}
              fullWidth
              required
              {...register('content', { required: 'Vui lòng nhập nội dung' })}
            />
            <TextField label="URL ảnh biểu đồ (tuỳ chọn)" fullWidth {...register('chart_image_url')} />
            <TextField label="Mã công cụ (cách nhau bằng dấu phẩy)" fullWidth {...register('symbols')} />
            <TextField label="Khung thời gian" fullWidth {...register('timeframe')} />
          </Stack>
        </DialogContent>
        <DialogActions sx={formDialogActionsSx(theme)}>
          <Button onClick={onClose} color="inherit" sx={{ color: 'text.secondary' }}>
            Hủy
          </Button>
          <Button type="submit" variant="contained" disabled={m.isPending}>
            Xuất bản
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
