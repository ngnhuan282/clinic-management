import { Alert, Box, Button, Chip, LinearProgress, MenuItem, Pagination, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { CalendarMonthOutlined, RefreshOutlined, RestartAltOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import useMyAppointments from "../../hooks/useMyAppointments";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import AppointmentArrivalGuide from "../../components/patient/AppointmentArrivalGuide";
import { clinicButtonSx, clinicColors, clinicFieldSx, clinicPrimaryButtonSx, clinicSecondaryButtonSx, clinicSurfaceSx } from "../../components/common/clinicUi";

const statuses = [
    ["Pending", "Chờ xác nhận"], ["Confirmed", "Đã xác nhận"],
    ["InProgress", "Đang khám"], ["Completed", "Hoàn tất"], ["Cancelled", "Đã hủy"],
];
const dateText = value => {
    const [year, month, day] = String(value || "").slice(0, 10).split("-");
    return day ? `${day}/${month}/${year}` : "Chưa có ngày khám";
};
const timeText = value => String(value || "").slice(0, 5);

function AppointmentCard({ appointment }) {
    const { appointmentId, status, checkedInAt, bookVerifiedAt } = appointment;
    const awaitingArrival = !checkedInAt && !["Cancelled", "Completed", "InProgress"].includes(status);
    return <Paper component="article" aria-labelledby={`my-appointment-${appointmentId}`} variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                <Box>
                    <Typography component="h2" id={`my-appointment-${appointmentId}`} sx={{ fontSize: 17, fontWeight: 600, color: clinicColors.heading }}>
                        Lịch hẹn #{appointmentId}
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 14, color: clinicColors.muted }}>
                        {dateText(appointment.appointmentDate)} · {timeText(appointment.startTime)}–{timeText(appointment.endTime)}
                    </Typography>
                </Box>
                <Box><StatusBadge status={status} /></Box>
            </Stack>
            <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2,
                "& dt": { fontSize: 12, color: clinicColors.muted, mb: 0.5 },
                "& dd": { m: 0, fontSize: 14, color: clinicColors.heading, overflowWrap: "anywhere" } }}>
                <Box><Box component="dt">Bác sĩ</Box><Box component="dd">{appointment.doctorName || "Đang cập nhật"}</Box></Box>
                <Box><Box component="dt">Chuyên khoa</Box><Box component="dd">{appointment.departmentName || "Đang cập nhật"}</Box></Box>
                <Box><Box component="dt">Người khám</Box><Box component="dd">{appointment.patientName}</Box></Box>
                <Box><Box component="dt">Lý do khám</Box><Box component="dd" sx={{ whiteSpace: "pre-wrap" }}>{appointment.reason || "Không có ghi chú"}</Box></Box>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 1.5, borderTop: `1px solid ${clinicColors.border}` }}>
                {checkedInAt ? <Chip size="small" label="Đã check-in" color="success" variant="outlined" />
                    : awaitingArrival && <Chip size="small" label="Chưa check-in" variant="outlined" />}
                {bookVerifiedAt && <Chip size="small" label="Đã xác minh sổ tại quầy" color="success" variant="outlined" />}
            </Stack>
            {status === "Pending" && <Typography sx={{ fontSize: 13, lineHeight: 1.7, color: clinicColors.muted }}>
                Lịch hẹn đang chờ lễ tân xác nhận. Bạn chưa hoàn tất thủ tục check-in tại quầy.
            </Typography>}
            {status === "Confirmed" && !checkedInAt && <Typography sx={{ fontSize: 13, lineHeight: 1.7, color: clinicColors.muted }}>
                Lịch đã được xác nhận. Khi đến khám, hãy đến quầy lễ tân để xác minh sổ và check-in; nếu chưa có, mất hoặc quên sổ, báo lễ tân để được hỗ trợ.
            </Typography>}
        </Stack>
    </Paper>;
}

export default function MyAppointmentsPage() {
    const { filters, dateError, data, error, loading, setFilter, setPageNumber, resetFilters, refresh } = useMyAppointments();
    const filtered = Boolean(filters.dateFrom || filters.dateTo || filters.status);
    return <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <Stack spacing={2.5}>
            <ClinicPageHeader title="Lịch hẹn của tôi" icon={CalendarMonthOutlined}
                description="Theo dõi lịch đã đặt, trạng thái xác nhận và thủ tục check-in của bạn."
                actions={<Button component={Link} to="/booking" variant="contained" startIcon={<CalendarMonthOutlined />} sx={clinicPrimaryButtonSx}>Đặt lịch khám</Button>} />
            <AppointmentArrivalGuide />
            <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2.5 }}>
                <Typography component="h2" sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Tìm lịch hẹn</Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                    <TextField fullWidth size="small" type="date" label="Từ ngày" value={filters.dateFrom}
                        onChange={event => setFilter("dateFrom", event.target.value)}
                        sx={clinicFieldSx} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: filters.dateTo || undefined } }} />
                    <TextField fullWidth size="small" type="date" label="Đến ngày" value={filters.dateTo}
                        onChange={event => setFilter("dateTo", event.target.value)} error={Boolean(dateError)}
                        sx={clinicFieldSx} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: filters.dateFrom || undefined } }} />
                    <TextField select fullWidth size="small" label="Trạng thái" value={filters.status}
                        onChange={event => setFilter("status", event.target.value)} sx={clinicFieldSx}>
                        <MenuItem value="">Tất cả trạng thái</MenuItem>
                        {statuses.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                    </TextField>
                    <Button onClick={resetFilters} startIcon={<RestartAltOutlined />} sx={{ ...clinicButtonSx, whiteSpace: "nowrap" }}>Đặt lại</Button>
                    <Button variant="outlined" disabled={loading || Boolean(dateError)} onClick={refresh} startIcon={<RefreshOutlined />} sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap" }}>Làm mới</Button>
                </Stack>
            </Paper>
            {dateError && <Alert severity="warning">{dateError}</Alert>}
            {error && <Alert severity="error" action={<Button color="inherit" onClick={refresh}>Thử lại</Button>}>{error}</Alert>}
            <Stack spacing={2} aria-busy={loading}>
                {loading ? <>
                    <LinearProgress aria-label="Đang tải lịch hẹn" />
                    {Array.from({ length: 3 }, (_, index) => <Paper key={index} variant="outlined" sx={{ ...clinicSurfaceSx, p: 3 }}>
                        <Stack spacing={1.5}><Skeleton width="40%" height={30} /><Skeleton width="60%" /><Skeleton variant="rounded" height={90} /></Stack>
                    </Paper>)}
                </> : !error && !dateError && <>
                    <Typography aria-live="polite" sx={{ fontSize: 13, color: clinicColors.muted }}>{data?.totalItems || 0} lịch hẹn{filtered ? " phù hợp" : ""}</Typography>
                    {!data?.items.length && <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2 }}>
                        <EmptyState message={filtered ? "Không có lịch hẹn phù hợp với bộ lọc." : "Bạn chưa có lịch hẹn. Chọn Đặt lịch khám để đặt lịch mới."} />
                    </Paper>}
                    {data?.items.map(appointment => <AppointmentCard key={appointment.appointmentId} appointment={appointment} />)}
                    {data?.totalPages > 1 && <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                        <Typography sx={{ fontSize: 13, color: clinicColors.muted }}>Trang {filters.pageNumber}/{data.totalPages} · {data.totalItems} lịch hẹn</Typography>
                        <Pagination count={data.totalPages} page={filters.pageNumber} onChange={(_, value) => setPageNumber(value)} color="primary" shape="rounded" size="small"
                            getItemAriaLabel={(type, value) => type === "next" ? "Trang tiếp" : type === "previous" ? "Trang trước" : `Trang ${value}`} />
                    </Stack>}
                </>}
            </Stack>
        </Stack>
    </Box>;
}
