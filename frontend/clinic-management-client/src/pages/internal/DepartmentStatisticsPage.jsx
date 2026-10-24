import { useState } from "react";
import { Alert, Box, Button, Chip, LinearProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PageHeader from "../../components/common/PageHeader";
import useDepartmentStatistics from "../../hooks/useDepartmentStatistics";
import { currentStatisticsMonth, statisticsDateErrors } from "../../utils/departmentStatistics";

const metrics = [
    { key: "visitCount", label: "Lượt khám", hint: "Hồ sơ đã bắt đầu khám hoặc đã hoàn thành", color: "primary.main" },
    { key: "pendingScheduleRequestCount", label: "Yêu cầu ca chờ duyệt", hint: "Yêu cầu đăng ký ca đang chờ xử lý", color: "warning.main" },
    { key: "approvedScheduleRequestCount", label: "Yêu cầu ca đã duyệt", hint: "Bao gồm yêu cầu được Admin duyệt", color: "success.main" },
];
const displayDate = date => date.split("-").reverse().join("/");

export default function DepartmentStatisticsPage() {
    const [period, setPeriod] = useState(currentStatisticsMonth);
    const [draft, setDraft] = useState(period);
    const [validation, setValidation] = useState({});
    const { data, loading, error, fields, refresh } = useDepartmentStatistics(period);

    function apply(event) {
        event.preventDefault();
        const errors = statisticsDateErrors(draft);
        setValidation(errors);
        if (Object.keys(errors).length) return;
        if (period.fromDate === draft.fromDate && period.toDate === draft.toDate) refresh();
        else setPeriod({ ...draft });
    }

    return <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", minHeight: "100%" }}>
        <PageHeader title="Thống kê khoa" subtitle="Theo dõi lượt khám và yêu cầu đăng ký ca làm việc của khoa." />
        <Paper component="form" onSubmit={apply} sx={{ p: 2.5, my: 2.5 }}>
            <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2, alignItems: { sm: "flex-start" }, flexWrap: "wrap" }}>
                {[{ name: "fromDate", label: "Từ ngày" }, { name: "toDate", label: "Đến ngày" }].map(field =>
                    <TextField key={field.name} type="date" label={field.label} size="small" value={draft[field.name]}
                        onChange={event => { setDraft({ ...draft, [field.name]: event.target.value }); setValidation({}); }}
                        error={Boolean(validation[field.name] || fields?.[field.name])}
                        helperText={validation[field.name] || fields?.[field.name]?.join(" ")}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: "9999-12-30" } }} />)}
                <Button type="submit" variant="contained">Áp dụng</Button>
                <Button startIcon={<RefreshIcon />} onClick={refresh} disabled={loading}>Làm mới</Button>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Kỳ thống kê: {displayDate(period.fromDate)} – {displayDate(period.toDate)} • Giờ Việt Nam (UTC+07)
            </Typography>
        </Paper>
        {loading && <Box role="status" aria-label="Đang tải thống kê"><LinearProgress /><Typography sx={{ mt: 2 }}>Đang tải thống kê khoa…</Typography></Box>}
        {error && <Alert severity="error" action={<Button color="inherit" onClick={refresh}>Thử lại</Button>}>{error}</Alert>}
        {data && <Box aria-live="polite">
            <Stack direction="row" sx={{ mb: 2, gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <Typography variant="h6" component="h2">{data.departmentName}</Typography>
                <Chip label="Khoa của tôi" color="primary" variant="outlined" size="small" />
            </Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
                {metrics.map(metric => <Paper key={metric.key} sx={{ p: 3, borderTop: 4, borderColor: metric.color }}>
                    <Typography component="h3" variant="subtitle1">{metric.label}</Typography>
                    <Typography data-testid={metric.key} variant="h3" color={metric.color} sx={{ my: 1.5, fontWeight: 800 }}>
                        {data[metric.key].toLocaleString("vi-VN")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{metric.hint}</Typography>
                </Paper>)}
            </Box>
            {metrics.every(metric => data[metric.key] === 0) && <Alert severity="info" sx={{ mt: 2 }}>Khoa chưa có lượt khám hoặc yêu cầu ca trong kỳ đã chọn.</Alert>}
        </Box>}
    </Box>;
}
