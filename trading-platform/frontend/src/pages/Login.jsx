import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AuthCardShell from "../components/AuthCardShell";
import { authAPI } from "../services/api";

const schema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export default function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.login(data);
      localStorage.setItem("token", res.data.token);
      toast.success("Chào mừng bạn quay lại");
      nav("/dashboard", { replace: true });
    } catch (e) {
      toast.error(e.response?.data?.error || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardShell>
      <Typography variant="h5" component="h1" gutterBottom>
        Đăng nhập
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Chưa có tài khoản?{" "}
          <Link component={RouterLink} to="/register" fontWeight={600}>
            Đăng ký
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Link component={RouterLink} to="/forgot-password" fontWeight={600}>
            Quên mật khẩu?
          </Link>
        </Typography>
      </Stack>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register("email")}
          />
          <TextField
            label="Mật khẩu"
            type="password"
            autoComplete="current-password"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register("password")}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            sx={{ py: 1.25, textTransform: "none", fontWeight: 600 }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" aria-label="Đang đăng nhập" />
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </Stack>
      </Box>
    </AuthCardShell>
  );
}
