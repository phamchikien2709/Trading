import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { alpha, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { PageHeader, PagePrimaryButton } from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  formDialogActionsSx,
  formDialogContentSx,
  formDialogPaperSx,
  formDialogTitleSx,
} from "../theme/formDialogStyles";
import { APP_VIEWPORT_MAX_PX } from "../constants/layout";
import { tradingListCard } from "../theme/listCardStyles";
import { journalAPI } from "../services/api";

function tenHuongGiaoDich(h) {
  if (h === "LONG") return "Mua";
  if (h === "SHORT") return "Bán";
  return h;
}

const defaultForm = () => ({
  symbol: "EURUSD",
  direction: "LONG",
  entry_price: 1.08,
  exit_price: 1.09,
  volume: 1,
  notes: "",
  traded_at: new Date().toISOString().slice(0, 16),
});

export default function Journal() {
  const theme = useTheme();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmDeleteJournalId, setConfirmDeleteJournalId] = useState(null);

  const { data: journals = [], isLoading } = useQuery({
    queryKey: ["journals"],
    queryFn: () => journalAPI.getAll().then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: defaultForm(),
  });

  const createM = useMutation({
    mutationFn: (payload) => journalAPI.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journals"] });
      toast.success("Đã lưu nhật ký");
      reset(defaultForm());
      setCreateOpen(false);
    },
    onError: (e) => toast.error(e.response?.data?.error || "Thất bại"),
  });

  const delM = useMutation({
    mutationFn: (id) => journalAPI.delete(id),
    onSuccess: () => {
      setConfirmDeleteJournalId(null);
      qc.invalidateQueries({ queryKey: ["journals"] });
      toast.success("Đã xóa");
      setSelected(null);
    },
    onError: (e) => {
      setConfirmDeleteJournalId(null);
      toast.error(e.response?.data?.error || "Không xóa được");
    },
  });

  const openCreate = () => {
    reset(defaultForm());
    setCreateOpen(true);
  };

  return (
    <Box
      sx={{
        maxWidth: `${APP_VIEWPORT_MAX_PX}px`,
        width: "100%",
        mx: "auto",
        py: 3,
        px: 2,
      }}
    >
      <PageHeader
        title="Nhật ký"
        subtitle="Các giao dịch hiển thị dạng thẻ. Nhấn thẻ để xem chi tiết hoặc xóa."
        action={
          <PagePrimaryButton startIcon={<AddIcon />} onClick={openCreate}>
            Thêm nhật ký
          </PagePrimaryButton>
        }
      />

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="sm"
        scroll="body"
        PaperProps={{ sx: formDialogPaperSx(theme) }}
      >
        <DialogTitle sx={formDialogTitleSx}>Thêm nhật ký</DialogTitle>
        <form
          id="journal-create-form"
          onSubmit={handleSubmit((values) => {
            createM.mutate({
              ...values,
              entry_price: Number(values.entry_price),
              exit_price: Number(values.exit_price),
              volume: Number(values.volume),
              traded_at: new Date(values.traded_at).toISOString(),
            });
          })}
        >
          <DialogContent sx={formDialogContentSx}>
            <Stack spacing={2.25}>
              <TextField
                label="Mã"
                {...register("symbol")}
                fullWidth
                required
              />
              <TextField
                label="Hướng"
                select
                {...register("direction")}
                fullWidth
              >
                <MenuItem value="LONG">Mua</MenuItem>
                <MenuItem value="SHORT">Bán</MenuItem>
              </TextField>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Giá vào"
                  type="number"
                  inputProps={{ step: "0.0001" }}
                  {...register("entry_price")}
                  fullWidth
                />
                <TextField
                  label="Giá ra"
                  type="number"
                  inputProps={{ step: "0.0001" }}
                  {...register("exit_price")}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Khối lượng"
                  type="number"
                  {...register("volume")}
                  fullWidth
                />
                <TextField
                  label="Thời điểm giao dịch"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  {...register("traded_at")}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Ghi chú"
                multiline
                minRows={2}
                {...register("notes")}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={formDialogActionsSx(theme)}>
            <Button
              onClick={() => setCreateOpen(false)}
              color="inherit"
              sx={{ color: "text.secondary" }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="journal-create-form"
              variant="contained"
              disabled={createM.isPending}
            >
              Lưu
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
        scroll="body"
        PaperProps={{ sx: formDialogPaperSx(theme) }}
      >
        {selected && (
          <>
            <DialogTitle sx={formDialogTitleSx}>
              {selected.symbol} · {tenHuongGiaoDich(selected.direction)}
            </DialogTitle>
            <DialogContent sx={{ ...formDialogContentSx, pt: 1 }} dividers>
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  Thời điểm giao dịch
                </Typography>
                <Typography variant="body1">
                  {new Date(selected.traded_at).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Giá và khối lượng
                </Typography>
                <Typography variant="body1">
                  Vào {Number(selected.entry_price).toFixed(5)} → Ra{" "}
                  {Number(selected.exit_price).toFixed(5)} · KL{" "}
                  {selected.volume}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lãi lỗ
                </Typography>
                <Typography variant="h6">
                  {Number(selected.pnl).toFixed(2)}
                </Typography>
                {selected.screenshot_url && (
                  <Box
                    component="img"
                    src={selected.screenshot_url}
                    alt="Ảnh chụp màn hình"
                    sx={{
                      maxWidth: "100%",
                      borderRadius: 1,
                      border: 1,
                      borderColor: "divider",
                    }}
                  />
                )}
                {selected.notes && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Ghi chú
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {selected.notes}
                    </Typography>
                  </>
                )}
              </Stack>
            </DialogContent>
            <DialogActions
              sx={{
                ...formDialogActionsSx(theme),
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlinedIcon />}
                disabled={delM.isPending}
                onClick={() => setConfirmDeleteJournalId(selected.id)}
              >
                Xóa
              </Button>
              <Button
                color="inherit"
                sx={{ color: "text.secondary" }}
                onClick={() => setSelected(null)}
              >
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteJournalId != null}
        onClose={() => setConfirmDeleteJournalId(null)}
        title="Xóa nhật ký giao dịch?"
        description="Thao tác không thể hoàn tác. Bản ghi sẽ bị xóa vĩnh viễn."
        danger
        confirmLabel="Xóa"
        loading={delM.isPending}
        onConfirm={() => {
          if (confirmDeleteJournalId != null) delM.mutate(confirmDeleteJournalId);
        }}
      />

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6, mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <Stack spacing={2.25} sx={{ mt: 3 }}>
        {!isLoading &&
          journals.map((j) => {
            const pnl = Number(j.pnl) || 0;
            const isLong = j.direction === "LONG";
            const accent = isLong
              ? theme.palette.secondary.main
              : theme.palette.error.light;
            const pnlColor = pnl >= 0 ? "success.main" : "error.main";
            return (
              <Card
                key={j.id}
                elevation={0}
                onClick={() => setSelected(j)}
                sx={{
                  ...tradingListCard(theme, {
                    accent,
                  }),
                  cursor: "pointer",
                }}
              >
                <CardContent sx={{ py: 2.25 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={2}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={1.5}
                      flexWrap="wrap"
                    >
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        sx={{ letterSpacing: 1, fontFamily: "inherit" }}
                      >
                        {j.symbol}
                      </Typography>
                      <Chip
                        icon={
                          isLong ? (
                            <TrendingUpIcon sx={{ "&&": { fontSize: 18 } }} />
                          ) : (
                            <TrendingDownIcon sx={{ "&&": { fontSize: 18 } }} />
                          )
                        }
                        label={tenHuongGiaoDich(j.direction)}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          letterSpacing: 0.5,
                          border: "1px solid",
                          borderColor: alpha(accent, 0.55),
                          color: accent,
                          bgcolor: alpha(accent, 0.12),
                          "& .MuiChip-icon": { color: accent },
                        }}
                      />
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        flexShrink: 0,
                        textAlign: "right",
                        maxWidth: "42%",
                      }}
                    >
                      {new Date(j.traded_at).toLocaleString()}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    alignItems="baseline"
                    spacing={1}
                    sx={{ mt: 2 }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontWeight: 700,
                      }}
                    >
                      Lãi lỗ
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{ color: pnlColor, lineHeight: 1 }}
                    >
                      {pnl >= 0 ? "+" : ""}
                      {pnl.toFixed(2)}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1.5, fontVariantNumeric: "tabular-nums" }}
                  >
                    {Number(j.entry_price).toFixed(5)} →{" "}
                    {Number(j.exit_price).toFixed(5)} · kl {j.volume}
                  </Typography>
                  {j.notes && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        mt: 1.25,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.45,
                      }}
                    >
                      {j.notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </Stack>

      {!isLoading && journals.length === 0 && (
        <Typography sx={{ mt: 4, textAlign: "center" }} color="text.secondary">
          Chưa có bản ghi. Dùng nút &quot;Thêm nhật ký&quot; để thêm.
        </Typography>
      )}
    </Box>
  );
}
