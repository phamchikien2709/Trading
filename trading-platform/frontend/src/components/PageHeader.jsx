import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

/** Tiêu đề trang + phụ đề + tuỳ chọn nút bên phải (bố cục MUI). */
export function PageHeader({ title, subtitle, action }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'flex-start' }}
      spacing={2}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  )
}

/** Nút kêu gọi hành động dạng viên thuốc — dùng cho Đăng bài / Thêm nhật ký. */
export function PagePrimaryButton({ sx, children, ...rest }) {
  return (
    <Button
      variant="contained"
      size="large"
      sx={[
        {
          alignSelf: { xs: 'stretch', sm: 'center' },
          flexShrink: 0,
          borderRadius: 999,
          px: 3,
          py: 1.125,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
      {...rest}
    >
      {children}
    </Button>
  )
}
