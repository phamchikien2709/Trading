import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { APP_VIEWPORT_MAX_PX } from "../constants/layout";
import { authAPI, journalAPI } from "../services/api";

function startOfLocalMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfLocalYear(d) {
  const x = new Date(d.getFullYear(), 0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalYear(d) {
  const x = new Date(d.getFullYear(), 11, 31);
  x.setHours(23, 59, 59, 999);
  return x;
}

function rangeFromPreset(preset) {
  const now = new Date();
  if (preset === "this_month") {
    return {
      from: startOfLocalMonth(now),
      to: endOfLocalMonth(now),
      label: "Tháng này",
    };
  }
  if (preset === "this_year") {
    return {
      from: startOfLocalYear(now),
      to: endOfLocalYear(now),
      label: "Năm nay",
    };
  }
  return { from: null, to: null, label: "Toàn bộ" };
}

function bucketKey(tradedAt, granularity) {
  const d = new Date(tradedAt);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (granularity === "year") return String(y);
  if (granularity === "month") return `${y}-${m}`;
  return `${y}-${m}-${day}`;
}

function formatBucketLabel(key, granularity) {
  if (granularity === "year") return key;
  if (granularity === "month") {
    const [ys, ms] = key.split("-");
    const date = new Date(Number(ys), Number(ms) - 1, 1);
    return date.toLocaleDateString("vi-VN", {
      month: "short",
      year: "numeric",
    });
  }
  const parts = key.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
}

function granularityLabel(granLabel) {
  if (granLabel === "day") return "Theo ngày";
  if (granLabel === "month") return "Theo tháng";
  return "Theo năm";
}

export default function Dashboard() {
  const theme = useTheme();
  const [rangePreset, setRangePreset] = useState("all");
  const [granularity, setGranularity] = useState("day");

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => authAPI.getProfile().then((r) => r.data),
  });
  const journalsQ = useQuery({
    queryKey: ["journals"],
    queryFn: () => journalAPI.getAll().then((r) => r.data),
  });

  const journals = useMemo(() => journalsQ.data ?? [], [journalsQ.data]);

  const {
    from,
    to,
    label: rangeLabel,
  } = useMemo(() => rangeFromPreset(rangePreset), [rangePreset]);

  const filteredJournals = useMemo(() => {
    if (from == null || to == null) return journals;
    const t0 = from.getTime();
    const t1 = to.getTime();
    return journals.filter((j) => {
      const t = new Date(j.traded_at).getTime();
      return !Number.isNaN(t) && t >= t0 && t <= t1;
    });
  }, [journals, from, to]);

  const totalPnl = useMemo(
    () => filteredJournals.reduce((s, j) => s + (Number(j.pnl) || 0), 0),
    [filteredJournals],
  );
  const wins = useMemo(
    () => filteredJournals.filter((j) => (Number(j.pnl) || 0) > 0).length,
    [filteredJournals],
  );

  const pnlSeries = useMemo(() => {
    const sorted = [...filteredJournals].sort(
      (a, b) => new Date(a.traded_at) - new Date(b.traded_at),
    );
    return sorted.reduce((acc, j, idx) => {
      const prev = acc.length ? acc[acc.length - 1].cumulative : 0;
      const cumulative = Number((prev + (Number(j.pnl) || 0)).toFixed(2));
      acc.push({
        i: idx + 1,
        label: new Date(j.traded_at).toLocaleDateString("vi-VN", {
          month: "short",
          day: "numeric",
        }),
        cumulative,
      });
      return acc;
    }, []);
  }, [filteredJournals]);

  const bucketSeries = useMemo(() => {
    const map = new Map();
    for (const j of filteredJournals) {
      const key = bucketKey(j.traded_at, granularity);
      if (key == null) continue;
      if (!map.has(key)) {
        map.set(key, { key, pnl: 0, count: 0, wins: 0 });
      }
      const row = map.get(key);
      const pnl = Number(j.pnl) || 0;
      row.pnl += pnl;
      row.count += 1;
      if (pnl > 0) row.wins += 1;
    }
    const sorted = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
    return sorted.map((b) => ({
      key: b.key,
      label: formatBucketLabel(b.key, granularity),
      pnl: Number(b.pnl.toFixed(2)),
      count: b.count,
      wins: b.wins,
    }));
  }, [filteredJournals, granularity]);

  const profitColor = totalPnl >= 0 ? "success.main" : "error.main";

  const tooltipPaper = {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    boxShadow: theme.shadows[2],
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
      <Typography variant="h4" component="h1" fontWeight={700}>
        Tổng quan
      </Typography>
      {(profileQ.isLoading || journalsQ.isLoading) && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {profileQ.data && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Đang đăng nhập là <strong>{profileQ.data.username}</strong>
        </Typography>
      )}

      {!journalsQ.isLoading && (
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                Khoảng thời gian
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={rangePreset}
                onChange={(_, v) => {
                  if (v != null) setRangePreset(v);
                }}
                sx={{ mb: 2 }}
              >
                <ToggleButton value="all">Toàn bộ</ToggleButton>
                <ToggleButton value="this_month">Tháng này</ToggleButton>
                <ToggleButton value="this_year">Năm nay</ToggleButton>
              </ToggleButtonGroup>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                Nhóm biểu đồ lãi lỗ
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={granularity}
                onChange={(_, v) => {
                  if (v != null) setGranularity(v);
                }}
              >
                <ToggleButton value="day">Ngày</ToggleButton>
                <ToggleButton value="month">Tháng</ToggleButton>
                <ToggleButton value="year">Năm</ToggleButton>
              </ToggleButtonGroup>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.5 }}
              >
                Thống kê và biểu đồ theo <strong>{rangeLabel}</strong>
                {rangePreset !== "all" ? " (theo ngày giao dịch)." : "."} Biểu
                đồ cột: {granularityLabel(granularity).toLowerCase()}.
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Tổng lãi lỗ (nhật ký)
              </Typography>
              <Typography
                variant="h3"
                sx={{ color: profitColor, fontWeight: 800, mt: 0.5 }}
              >
                {totalPnl >= 0 ? "+" : ""}
                {totalPnl.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tổng các giao dịch đã ghi trong khoảng đã chọn. Sửa trong mục
                Nhật ký.
              </Typography>
            </CardContent>
          </Card>

          <Grid container>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Giao dịch đã ghi
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {filteredJournals.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Giao dịch thắng
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {wins}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Tỷ lệ thắng
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {filteredJournals.length
                      ? `${Math.round((100 * wins) / filteredJournals.length)}%`
                      : "—"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                Lãi lỗ theo kỳ ({granularityLabel(granularity)})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tổng lãi lỗ theo{" "}
                {granularity === "day"
                  ? "ngày dương lịch"
                  : granularity === "month"
                    ? "tháng dương lịch"
                    : "năm dương lịch"}{" "}
                trong khoảng đã chọn.
              </Typography>
              {bucketSeries.length === 0 ? (
                <Typography color="text.secondary">
                  Chưa có dữ liệu nhật ký trong khoảng này — hãy ghi giao dịch
                  hoặc mở rộng bộ lọc thời gian.
                </Typography>
              ) : (
                <Box sx={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={bucketSeries}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.palette.divider}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{
                          fill: theme.palette.text.secondary,
                          fontSize: 11,
                        }}
                      />
                      <YAxis
                        tick={{
                          fill: theme.palette.text.secondary,
                          fontSize: 11,
                        }}
                      />
                      <Tooltip
                        contentStyle={tooltipPaper}
                        labelStyle={{ color: theme.palette.text.primary }}
                        formatter={(value, name) => {
                          if (name === "pnl") return [value, "Lãi lỗ"];
                          return [value, name];
                        }}
                      />
                      <Bar dataKey="pnl" name="Lãi lỗ" radius={[4, 4, 0, 0]}>
                        {bucketSeries.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={
                              entry.pnl >= 0
                                ? theme.palette.success.main
                                : theme.palette.error.main
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Lãi lỗ luỹ kế (từng giao dịch trong khoảng)
              </Typography>
              {pnlSeries.length === 0 ? (
                <Typography color="text.secondary">
                  Chưa có dữ liệu nhật ký trong khoảng này — hãy ghi giao dịch
                  để xem đường cong.
                </Typography>
              ) : (
                <Box sx={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={pnlSeries}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.palette.divider}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{
                          fill: theme.palette.text.secondary,
                          fontSize: 11,
                        }}
                      />
                      <YAxis
                        tick={{
                          fill: theme.palette.text.secondary,
                          fontSize: 11,
                        }}
                      />
                      <Tooltip
                        contentStyle={tooltipPaper}
                        labelStyle={{ color: theme.palette.text.primary }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        name="Lãi lỗ"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
