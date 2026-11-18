import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    MenuItem,
    Pagination,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    AccessTimeOutlined,
    CalendarMonthOutlined,
    CancelOutlined,
    FilterAltOutlined,
    RefreshOutlined,
    RestartAltOutlined,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import useMyAppointments from "../../hooks/useMyAppointments";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import AppointmentArrivalGuide from "../../components/patient/AppointmentArrivalGuide";
import { cancelMyAppointment } from "../../api/patientAppointmentApi";
import useAuth from "../../hooks/useAuth";
import getApiErrorMessage from "../../utils/errorHandler";
import {
    clinicButtonSx,
    clinicColors,
    clinicFieldSx,
    clinicPageCanvasSx,
    clinicPrimaryButtonSx,
    clinicSecondaryButtonSx,
    clinicSurfaceSx,
} from "../../components/common/clinicUi";

const statuses = [
    ["Pending", "Chờ xác nhận"],
    ["Confirmed", "Đã xác nhận"],
    ["InProgress", "Đang khám"],
    ["Completed", "Hoàn tất"],
    ["Cancelled", "Đã hủy"],
];

const STATUS_BAR_COLOR = {
    Pending: "#D97706",
    Confirmed: "#0B4F8A",
    InProgress: "#1D4ED8",
    Completed: "#059669",
    Cancelled: "#DC2626",
};

const dateText = value => {
    const [year, month, day] = String(value || "").slice(0, 10).split("-");
    return day ? `${day}/${month}/${year}` : "Chưa có ngày khám";
};
const dateParts = value => {
    const [year, month, day] = String(value || "").slice(0, 10).split("-");
    return day ? { day, month, year } : null;
};
const timeText = value => String(value || "").slice(0, 5);

function AppointmentCard({ appointment, onCancel, canCancel }) {
    const { appointmentId, status, checkedInAt, bookVerifiedAt } = appointment;
    const awaitingArrival = !checkedInAt && !["Cancelled", "Completed", "InProgress"].includes(status);
    const parts = dateParts(appointment.appointmentDate);
    const barColor = STATUS_BAR_COLOR[status] || "#64748B";

    return (
        <Paper
            component="article"
            aria-labelledby={`my-appointment-${appointmentId}`}
            variant="outlined"
            sx={{
                ...clinicSurfaceSx,
                p: { xs: 2.5, sm: 3 },
                borderRadius: "14px",
                borderLeft: `5px solid ${barColor}`,
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                "&:hover": {
                    borderColor: "#0B4F8A",
                    borderLeftColor: barColor,
                    boxShadow: "0 8px 20px rgba(10, 37, 64, 0.07)",
                },
            }}
        >
            <Stack spacing={2.25}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
                >
                    <Stack direction="row" spacing={1.75} sx={{ alignItems: "center", minWidth: 0 }}>
                        {parts && (
                            <Box
                                sx={{
                                    width: 60,
                                    height: 62,
                                    borderRadius: "12px",
                                    bgcolor: "#E6F0FA",
                                    border: "1px solid #90BCE6",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Typography sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1, color: "#0B4F8A", fontVariantNumeric: "tabular-nums" }}>
                                    {parts.day}/{parts.month}
                                </Typography>
                                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#0A2540", mt: 0.2 }}>
                                    {parts.year}
                                </Typography>
                            </Box>
                        )}
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                component="h2"
                                id={`my-appointment-${appointmentId}`}
                                sx={{ fontSize: 18, fontWeight: 800, color: "#0A2540" }}
                            >
                                Lịch hẹn #{appointmentId}
                            </Typography>
                            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.4, color: "#0B4F8A" }}>
                                <AccessTimeOutlined sx={{ fontSize: 16 }} />
                                <Typography sx={{ fontSize: 14, fontWeight: 750, fontVariantNumeric: "tabular-nums" }}>
                                    {dateText(appointment.appointmentDate)} · {timeText(appointment.startTime)} – {timeText(appointment.endTime)}
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>
                    <Box sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
                        <StatusBadge status={status} />
                    </Box>
                </Stack>

                <Box
                    component="dl"
                    sx={{
                        m: 0,
                        p: 2,
                        borderRadius: "12px",
                        bgcolor: "#F4F7FA",
                        border: "1px solid #DCE7F2",
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 2,
                        "& dt": { fontSize: 12, fontWeight: 750, color: clinicColors.muted, mb: 0.35, textTransform: "uppercase", letterSpacing: "0.02em" },
                        "& dd": { m: 0, fontSize: 15, color: "#0A2540", overflowWrap: "anywhere" },
                    }}
                >
                    <Box>
                        <Box component="dt">Bác sĩ tiếp nhận</Box>
                        <Box component="dd" sx={{ fontWeight: 750 }}>
                            {appointment.doctorName || "Đang cập nhật"}
                        </Box>
                    </Box>
                    <Box>
                        <Box component="dt">Chuyên khoa</Box>
                        <Box component="dd" sx={{ fontWeight: 700, color: "#0B4F8A" }}>
                            {appointment.departmentName || "Đang cập nhật"}
                        </Box>
                    </Box>
                    <Box>
                        <Box component="dt">Họ tên người khám</Box>
                        <Box component="dd" sx={{ fontWeight: 650 }}>
                            {appointment.patientName}
                        </Box>
                    </Box>
                    <Box>
                        <Box component="dt">Lý do khám</Box>
                        <Box component="dd" sx={{ whiteSpace: "pre-wrap", color: "#1E293B" }}>
                            {appointment.reason || "Không có ghi chú"}
                        </Box>
                    </Box>
                </Box>

                <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{ flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}
                >
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                        {checkedInAt ? (
                            <Chip
                                size="small"
                                label="Đã check-in tại quầy"
                                color="success"
                                variant="outlined"
                                sx={{ fontWeight: 700, borderRadius: "8px", bgcolor: "#ECFDF5", color: "#065F46", borderColor: "#6EE7B7" }}
                            />
                        ) : (
                            awaitingArrival && (
                                <Chip
                                    size="small"
                                    label="Chưa check-in"
                                    variant="outlined"
                                    sx={{ fontWeight: 650, borderRadius: "8px", bgcolor: "#F8FAFC", borderColor: "#B8CCE0", color: "#334155" }}
                                />
                            )
                        )}
                        {bookVerifiedAt && (
                            <Chip
                                size="small"
                                label="Đã xác minh sổ tại quầy"
                                color="success"
                                variant="outlined"
                                sx={{ fontWeight: 700, borderRadius: "8px", bgcolor: "#ECFDF5", color: "#065F46", borderColor: "#6EE7B7" }}
                            />
                        )}
                    </Stack>

                    {canCancel &&
                        !checkedInAt &&
                        ["Pending", "Confirmed"].includes(status) &&
                        `${appointment.appointmentDate.slice(0, 10)}T${appointment.startTime}` >
                        new Intl.DateTimeFormat("sv-SE", {
                            timeZone: "Asia/Ho_Chi_Minh",
                            dateStyle: "short",
                            timeStyle: "medium",
                        })
                            .format(new Date())
                            .replace(" ", "T") && (
                            <Button
                                color="error"
                                variant="outlined"
                                size="small"
                                startIcon={<CancelOutlined sx={{ fontSize: 16 }} />}
                                onClick={() => onCancel(appointment)}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderRadius: "8px",
                                    borderColor: "#FCA5A5",
                                    bgcolor: "#FEF2F2",
                                    color: "#991B1B",
                                    "&:hover": { bgcolor: "#FEE2E2", borderColor: "#EF4444" },
                                }}
                            >
                                Hủy lịch hẹn
                            </Button>
                        )}
                </Stack>

                {status === "Pending" && (
                    <Typography
                        sx={{
                            fontSize: 13.5,
                            lineHeight: 1.65,
                            color: "#92400E",
                            bgcolor: "#FFFBEB",
                            border: "1px solid #FCD34D",
                            p: 1.5,
                            borderRadius: "10px",
                        }}
                    >
                        Lịch hẹn đang chờ lễ tân xác nhận. Bạn chưa hoàn tất thủ tục check-in tại quầy.
                    </Typography>
                )}
                {status === "Confirmed" && !checkedInAt && (
                    <Typography
                        sx={{
                            fontSize: 13.5,
                            lineHeight: 1.65,
                            color: "#0A2540",
                            bgcolor: "#EAF2FA",
                            border: "1px solid #90BCE6",
                            p: 1.5,
                            borderRadius: "10px",
                        }}
                    >
                        Lịch đã được xác nhận. Khi đến khám, vui lòng ghé quầy lễ tân trước 10–15 phút để xác minh sổ khám và check-in.
                    </Typography>
                )}
            </Stack>
        </Paper>
    );
}

export default function MyAppointmentsPage() {
    const { filters, dateError, data, error, loading, setFilter, setPageNumber, resetFilters, refresh } =
        useMyAppointments();
    const filtered = Boolean(filters.dateFrom || filters.dateTo || filters.status);
    const { permissions } = useAuth();
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");

    async function confirmCancellation() {
        setCancelling(true);
        setCancelError("");
        try {
            await cancelMyAppointment(cancelTarget.appointmentId);
            setCancelTarget(null);
            refresh();
        } catch (err) {
            setCancelError(getApiErrorMessage(err));
            refresh();
        } finally {
            setCancelling(false);
        }
    }

    return (
        <Box sx={clinicPageCanvasSx}>
            <Container maxWidth="lg">
                <Stack spacing={3}>
                    <ClinicPageHeader
                        eyebrow="Theo dõi lịch khám"
                        title="Lịch hẹn của tôi"
                        icon={CalendarMonthOutlined}
                        description="Quản lý các lịch hẹn đã đặt, kiểm tra trạng thái tiếp nhận và hướng dẫn chuẩn bị trước khi đến quầy."
                        actions={
                            <Button
                                component={Link}
                                to="/booking"
                                variant="contained"
                                startIcon={<CalendarMonthOutlined />}
                                sx={{ ...clinicPrimaryButtonSx, px: 2.5 }}
                            >
                                Đặt lịch khám mới
                            </Button>
                        }
                    />

                    <AppointmentArrivalGuide />

                    {/* Filter Card */}
                    <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2.5, sm: 3 }, borderRadius: "14px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
                            <FilterAltOutlined fontSize="small" />
                            <Typography sx={{ fontSize: 15, fontWeight: 750, color: "#0A2540" }}>
                                Tìm kiếm & lọc lịch hẹn
                            </Typography>
                        </Box>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Từ ngày"
                                value={filters.dateFrom}
                                onChange={event => setFilter("dateFrom", event.target.value)}
                                sx={clinicFieldSx}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: filters.dateTo || undefined } }}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Đến ngày"
                                value={filters.dateTo}
                                onChange={event => setFilter("dateTo", event.target.value)}
                                error={Boolean(dateError)}
                                sx={clinicFieldSx}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: filters.dateFrom || undefined } }}
                            />
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Trạng thái"
                                value={filters.status}
                                onChange={event => setFilter("status", event.target.value)}
                                sx={clinicFieldSx}
                            >
                                <MenuItem value="">Tất cả trạng thái</MenuItem>
                                {statuses.map(([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <Button
                                onClick={resetFilters}
                                startIcon={<RestartAltOutlined />}
                                sx={{ ...clinicButtonSx, whiteSpace: "nowrap" }}
                            >
                                Đặt lại
                            </Button>
                            <Button
                                variant="outlined"
                                disabled={loading || Boolean(dateError)}
                                onClick={refresh}
                                startIcon={<RefreshOutlined />}
                                sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap" }}
                            >
                                Làm mới
                            </Button>
                        </Stack>
                    </Paper>

                    {dateError && (
                        <Alert severity="warning" sx={{ borderRadius: "10px" }}>
                            {dateError}
                        </Alert>
                    )}
                    {error && (
                        <Alert
                            severity="error"
                            sx={{ borderRadius: "10px" }}
                            action={
                                <Button color="inherit" onClick={refresh}>
                                    Thử lại
                                </Button>
                            }
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Content List */}
                    <Stack spacing={2.25} aria-busy={loading}>
                        {loading ? (
                            <>
                                <LinearProgress aria-label="Đang tải lịch hẹn" sx={{ borderRadius: 1 }} />
                                {Array.from({ length: 3 }, (_, index) => (
                                    <Paper key={index} variant="outlined" sx={{ ...clinicSurfaceSx, p: 3, borderRadius: "14px" }}>
                                        <Stack spacing={1.5}>
                                            <Skeleton width="40%" height={30} />
                                            <Skeleton width="60%" />
                                            <Skeleton variant="rounded" height={96} sx={{ borderRadius: "10px" }} />
                                        </Stack>
                                    </Paper>
                                ))}
                            </>
                        ) : (
                            !error &&
                            !dateError && (
                                <>
                                    <Typography aria-live="polite" sx={{ fontSize: 14, color: clinicColors.muted, fontWeight: 650 }}>
                                        {data?.totalItems || 0} lịch hẹn{filtered ? " phù hợp" : ""}
                                    </Typography>
                                    {!data?.items.length && (
                                        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 4, borderRadius: "14px" }}>
                                            <EmptyState
                                                title={filtered ? "Không tìm thấy lịch hẹn phù hợp" : "Chưa có lịch hẹn nào"}
                                                message={
                                                    filtered
                                                        ? "Không có lịch hẹn phù hợp với bộ lọc hiện tại."
                                                        : "Bạn chưa có lịch hẹn. Chọn Đặt lịch khám mới để đăng ký buổi khám."
                                                }
                                            />
                                        </Paper>
                                    )}
                                    {data?.items.map(appointment => (
                                        <AppointmentCard
                                            key={appointment.appointmentId}
                                            appointment={appointment}
                                            canCancel={permissions.includes("appointments.cancelOwn")}
                                            onCancel={value => {
                                                setCancelTarget(value);
                                                setCancelError("");
                                            }}
                                        />
                                    ))}
                                    {data?.totalPages > 1 && (
                                        <Stack
                                            direction={{ xs: "column", sm: "row" }}
                                            spacing={1.5}
                                            sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, pt: 1 }}
                                        >
                                            <Typography sx={{ fontSize: 13.5, color: clinicColors.muted }}>
                                                Trang {filters.pageNumber}/{data.totalPages} · {data.totalItems} lịch hẹn
                                            </Typography>
                                            <Pagination
                                                count={data.totalPages}
                                                page={filters.pageNumber}
                                                onChange={(_, value) => setPageNumber(value)}
                                                color="primary"
                                                shape="rounded"
                                                size="small"
                                                getItemAriaLabel={(type, value) =>
                                                    type === "next"
                                                        ? "Trang tiếp"
                                                        : type === "previous"
                                                            ? "Trang trước"
                                                            : `Trang ${value}`
                                                }
                                            />
                                        </Stack>
                                    )}
                                </>
                            )
                        )}
                    </Stack>
                </Stack>

                {/* Cancel Confirmation Dialog */}
                <Dialog
                    open={Boolean(cancelTarget)}
                    onClose={cancelling ? undefined : () => setCancelTarget(null)}
                    fullWidth
                    maxWidth="xs"
                >
                    <DialogTitle sx={{ fontWeight: 800, fontSize: 18.5, color: "#0A2540", pt: 3 }}>
                        Hủy lịch hẹn #{cancelTarget?.appointmentId}
                    </DialogTitle>
                    <DialogContent>
                        <Typography sx={{ fontSize: 15, color: "#1E293B", lineHeight: 1.65 }}>
                            Bạn có chắc chắn muốn hủy lịch khám ngày{" "}
                            <strong>{dateText(cancelTarget?.appointmentDate)}</strong> lúc{" "}
                            <strong>{timeText(cancelTarget?.startTime)}</strong> không?
                        </Typography>
                        {cancelError && (
                            <Alert severity="error" sx={{ mt: 2, borderRadius: "10px" }}>
                                {cancelError}
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                        <Button
                            disabled={cancelling}
                            onClick={() => setCancelTarget(null)}
                            variant="outlined"
                            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
                        >
                            Giữ lịch hẹn
                        </Button>
                        <Button
                            color="error"
                            variant="contained"
                            disabled={cancelling}
                            onClick={confirmCancellation}
                            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 750 }}
                        >
                            {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
