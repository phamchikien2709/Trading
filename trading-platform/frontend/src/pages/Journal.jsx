import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { alpha, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import FormGroup from "@mui/material/FormGroup";
import { PageHeader, PagePrimaryButton } from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { APP_VIEWPORT_MAX_PX } from "../constants/layout";
import { tradingListCard } from "../theme/listCardStyles";
import { journalAPI, journalChecklistTemplateAPI } from "../services/api";

/** @param {unknown} raw */
function parseChecklistSnapshot(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** @param {unknown} items */
function templateItemsList(items) {
  if (items == null) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === "string") {
    try {
      const v = JSON.parse(items);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return [];
}

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

/** @param {import('@mui/material/styles').Theme} theme */
function journalDrawerPaperSx(theme) {
  return {
    width: { xs: "100%", sm: 440 },
    maxWidth: "100vw",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    bgcolor: "background.paper",
    borderLeft: `1px solid ${theme.palette.divider}`,
    boxShadow:
      theme.palette.mode === "dark"
        ? `-16px 0 48px ${alpha("#000", 0.5)}`
        : `-16px 0 48px ${alpha("#0f172a", 0.12)}`,
  };
}

/** @param {import('@mui/material/styles').Theme} theme */
function journalDrawerFooterSx(theme) {
  return {
    flexShrink: 0,
    px: 2.5,
    py: 2,
    gap: 1.5,
    borderTop: `1px solid ${theme.palette.divider}`,
    bgcolor: alpha(theme.palette.primary.main, 0.04),
  };
}

/**
 * @param {{ title: string; subtitle?: string; onClose: () => void; theme: import('@mui/material/styles').Theme }} p
 */
function JournalDrawerHeader({ title, subtitle, onClose, theme }) {
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      spacing={1}
      sx={{
        flexShrink: 0,
        px: 2.5,
        pt: 2.5,
        pb: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 55%)`,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="h6"
          fontWeight={800}
          letterSpacing={0.02}
          lineHeight={1.25}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, lineHeight: 1.45 }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <IconButton
        aria-label="Đóng"
        onClick={onClose}
        size="small"
        sx={{
          mt: -0.25,
          color: "text.secondary",
          bgcolor: alpha(theme.palette.action.hover, 0.08),
          "&:hover": { bgcolor: alpha(theme.palette.action.hover, 0.15) },
        }}
      >
        <CloseRoundedIcon />
      </IconButton>
    </Stack>
  );
}

/**
 * @param {{ step: number; title: string; children: import('react').ReactNode; theme: import('@mui/material/styles').Theme }} p
 */
function JournalFormSection({ step, title, children, theme }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        mb: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.03),
        borderColor: alpha(theme.palette.primary.main, 0.12),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.25,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8125rem",
            fontWeight: 800,
            color: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.14),
          }}
        >
          {step}
        </Box>
        <Typography variant="subtitle1" fontWeight={800}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
}

export default function Journal() {
  const theme = useTheme();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmDeleteJournalId, setConfirmDeleteJournalId] = useState(null);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState(null);
  const [checklistDetailId, setChecklistDetailId] = useState(
    /** @type {number | null} */ (null),
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    /** @type {number | ''} */ (""),
  );
  const [tickById, setTickById] = useState(
    /** @type {Record<string, boolean>} */ ({}),
  );
  const [tplDraftName, setTplDraftName] = useState("");
  const [tplDraftRules, setTplDraftRules] = useState("");

  const { data: journals = [], isLoading } = useQuery({
    queryKey: ["journals"],
    queryFn: () => journalAPI.getAll().then((r) => r.data),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["journal-checklist-templates"],
    queryFn: () => journalChecklistTemplateAPI.getAll().then((r) => r.data),
  });

  const {
    data: checklistDetail,
    isLoading: checklistDetailLoading,
    isError: checklistDetailError,
  } = useQuery({
    queryKey: ["journal-checklist-template", checklistDetailId],
    queryFn: () =>
      journalChecklistTemplateAPI
        .getById(/** @type {number} */ (checklistDetailId))
        .then((r) => r.data),
    enabled: checklistDetailId != null,
  });

  const activeTpl = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId],
  );
  const activeTplItems = useMemo(
    () => templateItemsList(activeTpl?.items),
    [activeTpl?.items],
  );

  useEffect(() => {
    if (!createOpen) {
      setTickById({});
      return;
    }
    if (selectedTemplateId === "" || !activeTpl) {
      setTickById({});
      return;
    }
    const items = templateItemsList(activeTpl.items);
    if (!items.length) {
      setTickById({});
      return;
    }
    const init = {};
    for (const it of items) init[it.id] = false;
    setTickById(init);
  }, [createOpen, selectedTemplateId, activeTpl?.id]);

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

  const createTplM = useMutation({
    mutationFn: (body) => journalChecklistTemplateAPI.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-checklist-templates"] });
      toast.success("Đã tạo checklist");
      setTplDraftName("");
      setTplDraftRules("");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Không tạo được"),
  });

  const delTplM = useMutation({
    mutationFn: (id) => journalChecklistTemplateAPI.delete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["journal-checklist-templates"] });
      qc.removeQueries({ queryKey: ["journal-checklist-template", id] });
      setConfirmDeleteTemplateId(null);
      setChecklistDetailId((cur) => (cur === id ? null : cur));
      toast.success(
        "Đã ẩn checklist (lưu trong DB, không dùng cho bản ghi mới)",
      );
    },
    onError: (e) => {
      setConfirmDeleteTemplateId(null);
      toast.error(e.response?.data?.error || "Không xóa được");
    },
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

  const allRulesTicked =
    activeTplItems.length > 0 && activeTplItems.every((it) => tickById[it.id]);

  const openCreate = () => {
    reset(defaultForm());
    const first = templates[0]?.id;
    setSelectedTemplateId(first ?? "");
    setCreateOpen(true);
  };

  const saveNewTemplate = () => {
    const lines = tplDraftRules
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!tplDraftName.trim()) {
      toast.error("Nhập tên checklist");
      return;
    }
    if (!lines.length) {
      toast.error("Thêm ít nhất một rule (mỗi dòng một rule)");
      return;
    }
    createTplM.mutate({
      name: tplDraftName.trim(),
      items: lines.map((label) => ({ label })),
    });
  };

  useEffect(() => {
    if (!createOpen || selectedTemplateId !== "") return;
    const first = templates[0]?.id;
    if (first != null) setSelectedTemplateId(first);
  }, [createOpen, selectedTemplateId, templates]);

  useEffect(() => {
    if (checklistDetailId == null || !checklistDetailError) return;
    toast.error("Không tải được checklist");
    setChecklistDetailId(null);
  }, [checklistDetailError, checklistDetailId]);

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
        subtitle="Checklist tự đặt → tick đủ mới lưu. Chạm thẻ để mở chi tiết (panel bên phải)."
        action={
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Button
              variant="outlined"
              size="large"
              startIcon={<AssignmentOutlinedIcon />}
              onClick={() => setManageTemplatesOpen(true)}
              sx={{
                alignSelf: { xs: "stretch", sm: "center" },
                borderRadius: 2,
                px: 2.25,
                py: 1.1,
                fontWeight: 700,
                borderColor: alpha(theme.palette.primary.main, 0.35),
                "&:hover": {
                  borderColor: alpha(theme.palette.primary.main, 0.55),
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                },
              }}
            >
              Checklist
            </Button>
            <PagePrimaryButton startIcon={<AddIcon />} onClick={openCreate}>
              Thêm nhật ký
            </PagePrimaryButton>
          </Stack>
        }
      />

      <Drawer
        anchor="right"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        PaperProps={{ sx: journalDrawerPaperSx(theme) }}
        slotProps={{
          backdrop: { sx: { bgcolor: alpha("#0f172a", 0.45) } },
        }}
      >
        <JournalDrawerHeader
          theme={theme}
          title="Thêm nhật ký"
          subtitle="Bước 1: checklist. Bước 2: thông tin lệnh."
          onClose={() => setCreateOpen(false)}
        />
        <Box
          component="form"
          id="journal-create-form"
          onSubmit={handleSubmit((values) => {
            if (!templates.length) {
              toast.error("Tạo checklist trước (nút Checklist)");
              return;
            }
            if (selectedTemplateId === "") {
              toast.error("Chọn checklist");
              return;
            }
            if (!activeTplItems.length) {
              toast.error("Checklist đang chọn không có rule");
              return;
            }
            if (!activeTplItems.every((it) => tickById[it.id])) {
              toast.error("Tick đủ mọi rule trước khi lưu");
              return;
            }
            const checklist_snapshot = activeTplItems.map((it) => ({
              id: it.id,
              label: it.label,
              checked: !!tickById[it.id],
            }));
            createM.mutate({
              ...values,
              entry_price: Number(values.entry_price),
              exit_price: Number(values.exit_price),
              volume: Number(values.volume),
              traded_at: new Date(values.traded_at).toISOString(),
              checklist_template_id: selectedTemplateId,
              checklist_snapshot,
            });
          })}
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <Box sx={{ flex: 1, overflow: "auto", px: 2.5, py: 2 }}>
            {!templates.length ? (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                Chưa có checklist. Mở nút &quot;Checklist&quot; trên trang để
                thêm rule.
              </Alert>
            ) : null}
            <JournalFormSection
              step={1}
              title="Checklist trước khi vào lệnh"
              theme={theme}
            >
              <Stack spacing={2}>
                <TextField
                  label="Chọn checklist"
                  select
                  value={
                    selectedTemplateId === "" ? "" : String(selectedTemplateId)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedTemplateId(v === "" ? "" : Number(v));
                  }}
                  fullWidth
                  required
                  helperText="Tick đủ mọi dòng bên dưới — nút Lưu chỉ bật khi đã xong."
                >
                  {templates.map((t) => (
                    <MenuItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </MenuItem>
                  ))}
                </TextField>
                {activeTplItems.length > 0 ? (
                  <Box
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      p: 1.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        mb: 1,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                      }}
                    >
                      XÁC NHẬN TỪNG RULE
                    </Typography>
                    <FormGroup sx={{ gap: 0.25 }}>
                      {activeTplItems.map((it) => (
                        <FormControlLabel
                          key={it.id}
                          sx={{
                            alignItems: "flex-start",
                            mx: 0,
                            py: 0.75,
                            px: 1,
                            borderRadius: 1.5,
                            "&:hover": {
                              bgcolor: alpha(theme.palette.action.hover, 0.06),
                            },
                          }}
                          control={
                            <Checkbox
                              checked={!!tickById[it.id]}
                              onChange={(_, checked) =>
                                setTickById((prev) => ({
                                  ...prev,
                                  [it.id]: checked,
                                }))
                              }
                              sx={{ pt: 0.35 }}
                            />
                          }
                          label={
                            <Typography
                              variant="body2"
                              sx={{ lineHeight: 1.45 }}
                            >
                              {it.label}
                            </Typography>
                          }
                        />
                      ))}
                    </FormGroup>
                  </Box>
                ) : null}
              </Stack>
            </JournalFormSection>
            <JournalFormSection step={2} title="Thông tin lệnh" theme={theme}>
              <Stack spacing={2}>
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
            </JournalFormSection>
          </Box>
          <Stack
            direction="row"
            justifyContent="flex-end"
            sx={journalDrawerFooterSx(theme)}
          >
            <Button
              onClick={() => setCreateOpen(false)}
              color="inherit"
              sx={{ color: "text.secondary" }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                createM.isPending ||
                !templates.length ||
                selectedTemplateId === "" ||
                !activeTplItems.length ||
                !allRulesTicked
              }
            >
              Lưu nhật ký
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={manageTemplatesOpen}
        onClose={() => setManageTemplatesOpen(false)}
        PaperProps={{ sx: journalDrawerPaperSx(theme) }}
        slotProps={{
          backdrop: { sx: { bgcolor: alpha("#0f172a", 0.45) } },
        }}
      >
        <JournalDrawerHeader
          theme={theme}
          title="Checklist của tôi"
          subtitle="Mỗi dòng trong ô rule là một điều kiện; dùng khi thêm nhật ký."
          onClose={() => setManageTemplatesOpen(false)}
        />
        <Box sx={{ flex: 1, overflow: "auto", px: 2.5, py: 2 }}>
          <JournalFormSection step={1} title="Tạo checklist mới" theme={theme}>
            <Stack spacing={2}>
              <TextField
                label="Tên checklist"
                value={tplDraftName}
                onChange={(e) => setTplDraftName(e.target.value)}
                fullWidth
                placeholder="VD: Setup London killzone"
              />
              <TextField
                label="Danh sách rule (mỗi dòng một rule)"
                value={tplDraftRules}
                onChange={(e) => setTplDraftRules(e.target.value)}
                multiline
                minRows={5}
                fullWidth
                placeholder={
                  "HTF đồng thuận hướng trade\nCó vùng POI / OB rõ\nKhông tin trong 30 phút"
                }
              />
              <Button
                variant="contained"
                onClick={saveNewTemplate}
                disabled={createTplM.isPending}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 700,
                }}
              >
                Lưu checklist
              </Button>
            </Stack>
          </JournalFormSection>
          <Typography
            variant="subtitle2"
            fontWeight={800}
            sx={{ mb: 0.5, letterSpacing: 0.04 }}
          >
            Đã lưu
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1.5 }}
          >
            Nhấn thẻ để xem rule — checklist cố định, không sửa sau khi tạo.
          </Typography>
          {!templates.length ? (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: "center",
                borderRadius: 2,
                borderStyle: "dashed",
                bgcolor: alpha(theme.palette.action.hover, 0.04),
              }}
            >
              <Typography color="text.secondary" variant="body2">
                Chưa có checklist. Tạo bản đầu tiên ở khối phía trên.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.25}>
              {templates.map((t, idx) => (
                <Paper
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  variant="outlined"
                  onClick={() => setChecklistDetailId(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setChecklistDetailId(t.id);
                    }
                  }}
                  sx={{
                    p: 1.75,
                    pr: 6,
                    borderRadius: 2,
                    position: "relative",
                    cursor: "pointer",
                    borderColor: alpha(theme.palette.divider, 0.9),
                    "&:hover": {
                      borderColor: alpha(theme.palette.primary.main, 0.35),
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                    },
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                    <Box
                      sx={{
                        minWidth: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: "text.secondary",
                        bgcolor: alpha(theme.palette.action.hover, 0.12),
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800} sx={{ lineHeight: 1.3 }}>
                        {t.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {templateItemsList(t.items).length} rule
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton
                    aria-label="Ẩn checklist"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteTemplateId(t.id);
                    }}
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 8,
                      color: "text.secondary",
                      "&:hover": {
                        color: "error.main",
                        bgcolor: alpha(theme.palette.error.main, 0.08),
                      },
                    }}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
        <Stack
          direction="row"
          justifyContent="flex-end"
          sx={journalDrawerFooterSx(theme)}
        >
          <Button
            variant="contained"
            onClick={() => setManageTemplatesOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Xong
          </Button>
        </Stack>
      </Drawer>

      <Drawer
        anchor="right"
        open={checklistDetailId != null}
        onClose={() => setChecklistDetailId(null)}
        ModalProps={{ sx: { zIndex: theme.zIndex.drawer + 2 } }}
        PaperProps={{
          sx: {
            ...journalDrawerPaperSx(theme),
            zIndex: theme.zIndex.drawer + 2,
          },
        }}
        slotProps={{
          backdrop: { sx: { bgcolor: alpha("#0f172a", 0.52) } },
        }}
      >
        <JournalDrawerHeader
          theme={theme}
          title={checklistDetail?.name ?? "Checklist"}
          onClose={() => setChecklistDetailId(null)}
        />
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 2.5, py: 2 }}>
          {checklistDetailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : checklistDetail ? (
            <Stack spacing={2}>
              <Typography variant="caption" color="text.secondary">
                Tạo lúc {new Date(checklistDetail.created_at).toLocaleString()}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: 1 }}
                >
                  Danh sách rule
                </Typography>
                <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                  {templateItemsList(checklistDetail.items).map((it, i) => (
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      spacing={1.5}
                      key={it.id}
                    >
                      <Box
                        sx={{
                          minWidth: 26,
                          height: 26,
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          color: "primary.main",
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ lineHeight: 1.5, pt: 0.2 }}
                      >
                        {it.label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          ) : null}
        </Box>
        <Stack
          direction="row"
          justifyContent="flex-end"
          sx={journalDrawerFooterSx(theme)}
        >
          <Button
            variant="contained"
            onClick={() => setChecklistDetailId(null)}
            sx={{ borderRadius: 2 }}
          >
            Đóng
          </Button>
        </Stack>
      </Drawer>

      <Drawer
        anchor="right"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        PaperProps={{ sx: journalDrawerPaperSx(theme) }}
        slotProps={{
          backdrop: { sx: { bgcolor: alpha("#0f172a", 0.45) } },
        }}
      >
        {selected ? (
          <>
            <JournalDrawerHeader
              theme={theme}
              title={selected.symbol}
              subtitle={tenHuongGiaoDich(selected.direction)}
              onClose={() => setSelected(null)}
            />
            <Box sx={{ flex: 1, overflow: "auto", px: 2.5, py: 2 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Chip
                  size="small"
                  label={tenHuongGiaoDich(selected.direction)}
                  color={selected.direction === "LONG" ? "secondary" : "error"}
                  variant={
                    selected.direction === "LONG" ? "filled" : "outlined"
                  }
                  sx={{ fontWeight: 800 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(selected.traded_at).toLocaleString()}
                </Typography>
              </Stack>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.default, 0.45),
                }}
              >
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: 1 }}
                >
                  Giá · khối lượng
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ mt: 0.75, fontVariantNumeric: "tabular-nums" }}
                >
                  Vào <strong>{Number(selected.entry_price).toFixed(5)}</strong>{" "}
                  → Ra <strong>{Number(selected.exit_price).toFixed(5)}</strong>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Khối lượng {selected.volume}
                </Typography>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  borderColor: alpha(
                    Number(selected.pnl) >= 0
                      ? theme.palette.success.main
                      : theme.palette.error.main,
                    0.35,
                  ),
                  bgcolor: alpha(
                    Number(selected.pnl) >= 0
                      ? theme.palette.success.main
                      : theme.palette.error.main,
                    0.06,
                  ),
                }}
              >
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: 1 }}
                >
                  Lãi lỗ
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    mt: 0.5,
                    color:
                      Number(selected.pnl) >= 0 ? "success.main" : "error.main",
                  }}
                >
                  {Number(selected.pnl) >= 0 ? "+" : ""}
                  {Number(selected.pnl).toFixed(2)}
                </Typography>
              </Paper>
              {selected.screenshot_url ? (
                <Box
                  component="img"
                  src={selected.screenshot_url}
                  alt="Ảnh chụp màn hình"
                  sx={{
                    maxWidth: "100%",
                    borderRadius: 2,
                    border: 1,
                    borderColor: "divider",
                    mb: 2,
                  }}
                />
              ) : null}
              {selected.notes ? (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ letterSpacing: 1 }}
                  >
                    Ghi chú
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, whiteSpace: "pre-wrap", lineHeight: 1.5 }}
                  >
                    {selected.notes}
                  </Typography>
                </Paper>
              ) : null}
              {parseChecklistSnapshot(selected.checklist_snapshot).length >
              0 ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    borderColor: alpha(theme.palette.primary.main, 0.22),
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  }}
                >
                  <Typography
                    variant="overline"
                    color="primary"
                    sx={{ letterSpacing: 1 }}
                  >
                    Checklist khi vào lệnh
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1.5 }}>
                    {parseChecklistSnapshot(selected.checklist_snapshot).map(
                      (row) => (
                        <Stack
                          direction="row"
                          alignItems="flex-start"
                          spacing={1.25}
                          key={row.id}
                        >
                          <CheckCircleRoundedIcon
                            sx={{
                              fontSize: 22,
                              color: row.checked
                                ? "success.main"
                                : "action.disabled",
                              mt: 0.1,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ lineHeight: 1.45, pt: 0.15 }}
                          >
                            {row.label}
                          </Typography>
                        </Stack>
                      ),
                    )}
                  </Stack>
                </Paper>
              ) : null}
            </Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              flexWrap="wrap"
              sx={journalDrawerFooterSx(theme)}
            >
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlinedIcon />}
                disabled={delM.isPending}
                onClick={() => setConfirmDeleteJournalId(selected.id)}
                sx={{ borderRadius: 2 }}
              >
                Xóa
              </Button>
              <Button
                variant="contained"
                onClick={() => setSelected(null)}
                sx={{ borderRadius: 2 }}
              >
                Đóng
              </Button>
            </Stack>
          </>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={confirmDeleteJournalId != null}
        onClose={() => setConfirmDeleteJournalId(null)}
        title="Xóa nhật ký giao dịch?"
        description="Thao tác không thể hoàn tác. Bản ghi sẽ bị xóa vĩnh viễn."
        danger
        confirmLabel="Xóa"
        loading={delM.isPending}
        onConfirm={() => {
          if (confirmDeleteJournalId != null)
            delM.mutate(confirmDeleteJournalId);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteTemplateId != null}
        onClose={() => setConfirmDeleteTemplateId(null)}
        title="Ẩn checklist?"
        description="Soft delete: bản ghi vẫn trong database (đánh dấu xóa). Nhật ký cũ vẫn giữ snapshot; checklist này không chọn được cho nhật ký mới."
        danger
        confirmLabel="Ẩn"
        loading={delTplM.isPending}
        onConfirm={() => {
          if (confirmDeleteTemplateId != null)
            delTplM.mutate(confirmDeleteTemplateId);
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
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? `0 12px 28px ${alpha("#000", 0.35)}`
                        : `0 12px 28px ${alpha("#0f172a", 0.1)}`,
                  },
                  "&:active": { transform: "translateY(0)" },
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
        <Paper
          variant="outlined"
          sx={{
            mt: 4,
            py: 4,
            px: 3,
            textAlign: "center",
            borderRadius: 3,
            borderStyle: "dashed",
            bgcolor: alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <Typography variant="body1" fontWeight={700} color="text.primary">
            Chưa có nhật ký
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 360, mx: "auto" }}
          >
            Tạo checklist trước, rồi dùng &quot;Thêm nhật ký&quot; — panel sẽ mở
            từ bên phải.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
