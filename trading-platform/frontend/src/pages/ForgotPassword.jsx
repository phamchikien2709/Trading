import { useEffect, useState } from "react";
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
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AuthCardShell from "../components/AuthCardShell";
import { authAPI } from "../services/api";

const SK_EMAIL = "reset_otp_email";
const SK_SETUP = "reset_setup_token";

const stepLabels = ["Email", "OTP", "Mật khẩu mới"];

const step1Schema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
});

const step2Schema = z.object({
  code: z.string().min(4, "Nhập mã OTP"),
});

const step3Schema = z
  .object({
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const form1 = useForm({ resolver: zodResolver(step1Schema) });
  const form2 = useForm({ resolver: zodResolver(step2Schema) });
  const form3 = useForm({ resolver: zodResolver(step3Schema) });

  useEffect(() => {
    const token = sessionStorage.getItem(SK_SETUP);
    const email = sessionStorage.getItem(SK_EMAIL);
    if (token && email) {
      setStep(3);
    } else if (email) {
      setStep(2);
    }
  }, []);

  const onStep1 = async (data) => {
    setLoading(true);
    try {
      await authAPI.passwordResetRequest({ email: data.email });
      sessionStorage.setItem(SK_EMAIL, data.email.trim().toLowerCase());
      toast.success("Nếu email tồn tại, bạn sẽ nhận được mã OTP");
      setStep(2);
    } catch (e) {
      toast.error(e.response?.data?.error || "Không thể gửi yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  const onStep2 = async (data) => {
    const email = sessionStorage.getItem(SK_EMAIL);
    if (!email) {
      toast.error("Phiên hết hạn — vui lòng nhập lại email");
      setStep(1);
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.passwordResetVerify({
        email,
        code: data.code.trim(),
      });
      sessionStorage.setItem(SK_SETUP, res.data.setup_token);
      toast.success("Xác nhận OTP thành công");
      setStep(3);
    } catch (e) {
      toast.error(e.response?.data?.error || "OTP không hợp lệ");
    } finally {
      setLoading(false);
    }
  };

  const onStep3 = async (data) => {
    const token = sessionStorage.getItem(SK_SETUP);
    if (!token) {
      toast.error("Phiên hết hạn — vui lòng xác nhận OTP lại");
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      await authAPI.passwordResetComplete({
        setup_token: token,
        password: data.password,
      });
      sessionStorage.removeItem(SK_EMAIL);
      sessionStorage.removeItem(SK_SETUP);
      toast.success("Đã đặt lại mật khẩu — vui lòng đăng nhập");
      nav("/login", { replace: true });
    } catch (e) {
      toast.error(e.response?.data?.error || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  const clearResetSession = () => {
    sessionStorage.removeItem(SK_EMAIL);
    sessionStorage.removeItem(SK_SETUP);
    setStep(1);
  };

  const emailShown = sessionStorage.getItem(SK_EMAIL) || "";

  return (
    <AuthCardShell>
      <Typography variant="h5" component="h1" gutterBottom>
        Quên mật khẩu
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/login" fontWeight={600}>
          Quay lại đăng nhập
        </Link>
      </Typography>

      <Stepper activeStep={step - 1} alternativeLabel sx={{ mb: 3 }}>
        {stepLabels.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {step === 1 && (
        <Box component="form" onSubmit={form1.handleSubmit(onStep1)} noValidate>
          <Stack spacing={2.5}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              fullWidth
              error={!!form1.formState.errors.email}
              helperText={form1.formState.errors.email?.message}
              {...form1.register("email")}
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
                <CircularProgress size={22} color="inherit" aria-label="Đang gửi" />
              ) : (
                "Gửi mã OTP"
              )}
            </Button>
          </Stack>
        </Box>
      )}

      {step === 2 && (
        <Box component="form" onSubmit={form2.handleSubmit(onStep2)} noValidate>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Nhập mã OTP đã gửi tới{" "}
              <Box component="span" fontWeight={600} color="text.primary">
                {emailShown}
              </Box>
            </Typography>
            <TextField
              label="Mã OTP"
              inputMode="numeric"
              autoComplete="one-time-code"
              fullWidth
              inputProps={{ style: { letterSpacing: "0.2em" } }}
              error={!!form2.formState.errors.code}
              helperText={form2.formState.errors.code?.message}
              {...form2.register("code")}
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
                <CircularProgress size={22} color="inherit" aria-label="Đang xác nhận" />
              ) : (
                "Xác nhận OTP"
              )}
            </Button>
            <Button type="button" variant="text" onClick={clearResetSession} sx={{ textTransform: "none" }}>
              Quay lại đổi email
            </Button>
          </Stack>
        </Box>
      )}

      {step === 3 && (
        <Box component="form" onSubmit={form3.handleSubmit(onStep3)} noValidate>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Nhập mật khẩu mới.
            </Typography>
            <TextField
              label="Mật khẩu mới"
              type="password"
              autoComplete="new-password"
              fullWidth
              error={!!form3.formState.errors.password}
              helperText={form3.formState.errors.password?.message}
              {...form3.register("password")}
            />
            <TextField
              label="Xác nhận mật khẩu"
              type="password"
              autoComplete="new-password"
              fullWidth
              error={!!form3.formState.errors.confirmPassword}
              helperText={form3.formState.errors.confirmPassword?.message}
              {...form3.register("confirmPassword")}
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
                <CircularProgress size={22} color="inherit" aria-label="Đang lưu" />
              ) : (
                "Đặt lại mật khẩu"
              )}
            </Button>
          </Stack>
        </Box>
      )}
    </AuthCardShell>
  );
}
