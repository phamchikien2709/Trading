import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { APP_VIEWPORT_MAX_PX } from "../constants/layout";
import {
  formDialogActionsSx,
  formDialogContentSx,
  formDialogPaperSx,
  formDialogTitleSx,
} from "../theme/formDialogStyles";
import ConfirmDialog from "../components/ConfirmDialog";
import { authAPI } from "../services/api";

export default function Profile() {
  const theme = useTheme();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => authAPI.getProfile().then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { bio: "", avatar_url: "" },
  });
  const [pendingProfile, setPendingProfile] = useState(null);

  useEffect(() => {
    if (!editOpen || !profileQ.data) return;
    reset({
      bio: profileQ.data.bio || "",
      avatar_url: profileQ.data.avatar_url || "",
    });
  }, [editOpen, profileQ.data, reset]);

  const updateM = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: () => {
      setPendingProfile(null);
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Đã cập nhật hồ sơ");
      setEditOpen(false);
    },
    onError: (e) => {
      setPendingProfile(null);
      toast.error(e.response?.data?.error || "Cập nhật thất bại");
    },
  });

  const u = profileQ.data;
  const initial = u?.username?.charAt(0)?.toUpperCase() || "?";

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  };

  return (
    <Box sx={{ maxWidth: `${APP_VIEWPORT_MAX_PX}px`, width: "100%", mx: "auto", py: 3, px: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Hồ sơ
        </Typography>
        {u && (
          <IconButton
            color="primary"
            aria-label="Chỉnh sửa hồ sơ"
            onClick={() => setEditOpen(true)}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <EditIcon />
          </IconButton>
        )}
      </Stack>

      {profileQ.isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {u && (
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                alignItems={{ sm: "flex-start" }}
              >
                <Avatar
                  src={u.avatar_url || undefined}
                  alt={u.username}
                  sx={{
                    width: 112,
                    height: 112,
                    fontSize: 40,
                    fontWeight: 700,
                    border: "2px solid",
                    borderColor: "primary.main",
                  }}
                >
                  {initial}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h5" fontWeight={700}>
                    {u.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {u.email}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="overline" color="text.secondary">
                    Giới thiệu
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}
                  >
                    {u.bio?.trim() ? u.bio : "Chưa có phần giới thiệu."}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                fullWidth
                onClick={() => setLogoutConfirmOpen(true)}
              >
                Đăng xuất
              </Button>
            </CardContent>
          </Card>
        </Stack>
      )}

      <Dialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setPendingProfile(null);
        }}
        fullWidth
        maxWidth="sm"
        scroll="body"
        PaperProps={{ sx: formDialogPaperSx(theme) }}
      >
        <DialogTitle sx={formDialogTitleSx}>Chỉnh sửa hồ sơ</DialogTitle>
        <form
          onSubmit={handleSubmit((data) => {
            setPendingProfile({
              bio: data.bio,
              avatar_url: data.avatar_url,
            });
          })}
        >
          <DialogContent sx={formDialogContentSx}>
            <Stack spacing={2.25}>
              <TextField
                label="Giới thiệu"
                multiline
                minRows={3}
                fullWidth
                {...register("bio")}
              />
              <TextField
                label="Địa chỉ ảnh đại diện"
                fullWidth
                placeholder="Dán liên kết ảnh đầy đủ"
                {...register("avatar_url")}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={formDialogActionsSx(theme)}>
            <Button
              onClick={() => {
                setEditOpen(false);
                setPendingProfile(null);
              }}
              color="inherit"
              sx={{ color: "text.secondary" }}
            >
              Hủy
            </Button>
            <Button type="submit" variant="contained" disabled={updateM.isPending}>
              Lưu
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={pendingProfile != null}
        onClose={() => !updateM.isPending && setPendingProfile(null)}
        title="Lưu thay đổi hồ sơ?"
        description="Cập nhật phần giới thiệu và địa chỉ ảnh đại diện trên tài khoản của bạn."
        confirmLabel="Lưu"
        loading={updateM.isPending}
        onConfirm={() => {
          if (pendingProfile) updateM.mutate(pendingProfile);
        }}
      />

      <ConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="Đăng xuất?"
        description="Bạn sẽ cần đăng nhập lại để tiếp tục dùng tài khoản."
        confirmLabel="Đăng xuất"
        cancelLabel="Ở lại"
        danger
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          logout();
        }}
      />
    </Box>
  );
}
