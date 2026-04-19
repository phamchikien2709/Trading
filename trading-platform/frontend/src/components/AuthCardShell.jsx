import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { alpha, useTheme } from "@mui/material/styles";

const AUTH_FORM_MAX_PX = 440;

/** Khung đăng nhập / đăng ký căn giữa, thẻ paper có viền nhẹ (đồng bộ với các trang MUI khác). */
export default function AuthCardShell({ children }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        px: 2,
        py: { xs: 3, sm: 5 },
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: AUTH_FORM_MAX_PX,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.06)}`,
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>{children}</CardContent>
      </Card>
    </Box>
  );
}
