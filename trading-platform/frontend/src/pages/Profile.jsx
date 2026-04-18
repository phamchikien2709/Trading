import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LogoutIcon from "@mui/icons-material/Logout";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { APP_VIEWPORT_MAX_PX } from "../constants/layout";
import { authAPI } from "../services/api";

export default function Profile() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => authAPI.getProfile().then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { bio: "", avatar_url: "" },
  });

  useEffect(() => {
    if (!profileQ.data) return;
    reset({
      bio: profileQ.data.bio || "",
      avatar_url: profileQ.data.avatar_url || "",
    });
  }, [profileQ.data, reset]);

  const updateM = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Update failed"),
  });

  const u = profileQ.data;
  const initial = u?.username?.charAt(0)?.toUpperCase() || "?";

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  };

  return (
    <Box sx={{ maxWidth: `${APP_VIEWPORT_MAX_PX}px`, width: "100%", mx: "auto", py: 3, px: 2 }}>
      <Typography variant="h4" component="h1" fontWeight={700}>
        Profile
      </Typography>

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
                    Bio
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}
                  >
                    {u.bio?.trim() ? u.bio : "No bio yet."}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Edit profile
              </Typography>
              <form onSubmit={handleSubmit((data) => updateM.mutate(data))}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Bio"
                    multiline
                    minRows={3}
                    fullWidth
                    {...register("bio")}
                  />
                  <TextField
                    label="Avatar URL"
                    fullWidth
                    placeholder="https://…"
                    {...register("avatar_url")}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={updateM.isPending}
                  >
                    Save changes
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    fullWidth
                    sx={{ mt: 1 }}
                    onClick={logout}
                  >
                    Log out
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
