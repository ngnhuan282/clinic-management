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
    Divider,
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

const dateText = value => {
    const [year, month, day] = String(value || "").slice(0, 10).split("-");
    return day ? `${day}/${month}/${year}` : "Chưa có ngày khám";
};
const timeText = value => String(value || "").slice(0, 5);

function AppointmentCard({ appointment, onCancel, canCancel }) {
    const { appointmentId, status, checkedInAt, bookVerifiedAt } = appointment;
    const awaitingArrival = !checkedInAt && !["Cancelled", "Completed", "InProgress"].includes(status);

    return (
        <Paper
            component="article"
            aria-labelledby={`my-appointment-${appointmentId}`}
            variant="outlined"
            sx={{
                ...clinicSurfaceSx,
                p: { xs: 2.5, sm: 3.25 },
                borderRadius: "14px",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                    borderColor: "#90caf9",
                    boxShadow: "0 6px 18px rgba(25, 118, 210, 0.07)",
                },
            }}
        >
            <Stack spacing={2}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
                >
                    <Box>
                        <Typography
                            component="h2"
                            id={`my-appointment-${appointmentId}`}
                            sx={{ fontSize: 17, fontWeight: 750, color: "#0f2c4d" }}
                        >
                            Lịch hẹn #{appointmentId}
                        </Typography>
                        <Typography sx={{ mt: 0.5, fontSize: 14, color: clinicColors.muted }}>
                            {dateText(appointment.appointmentDate)} · {timeText(appointment.startTime)} – {timeText(appointment.endTime)}
                        </Typography>
                    </Box>
                    <Box>
                        <StatusBadge status={status} />
                    </Box>
                </Stack>

                <Divider sx={{ borderColor: "#f1f5f9" }} />

                <Box
                    component="dl"
                    sx={{
                        m: 0,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 2,
                        "& dt": { fontSize: 12.5, fontWeight: 600, color: clinicColors.muted, mb: 0.5 },
                        "& dd": { m: 0, fontSize: 14.5, color: "#1f2937", overflowWrap: "anywhere" },
                    }}
                >
                    <Box>
                        <Box component="dt">Bác sĩ tiếp nhận</Box>
                        <Box component="dd" sx={{ fontWeight: 650 }}>{appointment.doctorName || "Đang cập nhật"}</Box>
                    </Box>
                    <Box>
                        <Box component="dt">Chuyên khoa</Box>
                        <Box component="dd">{appointment.departmentName || "Đang cập nhật"}</Box>
                    </Box>
                    <Box>
                        <Box component="dt">Họ tên người khám</Box>
                        <Box component="dd">{appointment.patientName}</Box>
                    </Box>
                    <Box>
                        <Box component="dt">Lý do khám</Box>
                        <Box component="dd" sx={{ whiteSpace: "pre-wrap" }}>
                            {appointment.reason || "Không có ghi chú"}
                        </Box>
                    </Box>
                </Box>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 1.5, borderTop: `1px solid ${clinicColors.border}` }}>
                    {checkedInAt ? (
                        <Chip size="small" label="Đã check-in tại quầy" color="success" variant="outlined" sx={{ fontWeight: 600, borderRadius: "6px" }} />
                    ) : (
                        awaitingArrival && <Chip size="small" label="Chưa check-in" variant="outlined" sx={{ fontWeight: 600, borderRadius: "6px" }} />
                    )}
                    {bookVerifiedAt && (
                        <Chip size="small" label="Đã xác minh sổ tại quầy" color="success" variant="outlined" sx={{ fontWeight: 600, borderRadius: "6px" }} />
                    )}
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
                                size="small"
                                startIcon={<CancelOutlined sx={{ fontSize: 16 }} />}
                                onClick={() => onCancel(appointment)}
                                sx={{ textTransform: "none", fontWeight: 650, borderRadius: "6px" }}
                            >
                                Hủy lịch hẹn
                            </Button>
                        )}
                </Stack>

                {status === "Pending" && (
                    <Typography sx={{ fontSize: 13, lineHeight: 1.7, color: "#d97706", bgcolor: "#fffbeb", p: 1.5, borderRadius: "8px" }}>
                        Lịch hẹn đang chờ lễ tân xác nhận. Bạn chưa hoàn tất thủ tục check-in tại quầy.
                    </Typography>
                )}
                {status === "Confirmed" && !checkedInAt && (
                    <Typography sx={{ fontSize: 13, lineHeight: 1.7, color: clinicColors.muted, bgcolor: "#f8fafc", p: 1.5, borderRadius: "8px" }}>
                        Lịch đã được xác nhận. Khi đến khám, hãy đến quầy lễ tân để xác minh sổ và check-in; nếu chưa có, mất hoặc quên sổ, hãy báo lễ tân để được hỗ trợ.
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
        } catch (error) {
            setCancelError(getApiErrorMessage(error));
            refresh();
        } finally {
            setCancelling(false);
        }
    }

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "85vh", py: { xs: 3.5, md: 5.5 } }}>
            <Container maxWidth="lg">
                <Stack spacing={3}>
                    <ClinicPageHeader
                        title="Lịch hẹn của tôi"
                        icon={CalendarMonthOutlined}
                        description="Theo dõi các lịch hẹn đã đặt, trạng thái tiếp nhận và hướng dẫn thủ tục check-in tại phòng khám."
                        actions={
                            <Button
                                component={Link}
                                to="/booking"
                                variant="contained"
                                startIcon={<CalendarMonthOutlined />}
                                sx={{
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    minHeight: 42,
                                    px: 2.5,
                                    boxShadow: "0 2px 6px rgba(25, 118, 210, 0.25)",
                                }}
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
                            <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>
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
                                sx={{ ...clinicButtonSx, whiteSpace: "nowrap", borderRadius: "8px" }}
                            >
                                Đặt lại
                            </Button>
                            <Button
                                variant="outlined"
                                disabled={loading || Boolean(dateError)}
                                onClick={refresh}
                                startIcon={<RefreshOutlined />}
                                sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap", borderRadius: "8px" }}
                            >
                                Làm mới
                            </Button>
                        </Stack>
                    </Paper>

                    {dateError && <Alert severity="warning" sx={{ borderRadius: "10px" }}>{dateError}</Alert>}
                    {error && (
                        <Alert severity="error" sx={{ borderRadius: "10px" }} action={<Button color="inherit" onClick={refresh}>Thử lại</Button>}>
                            {error}
                        </Alert>
                    )}

                    {/* Content List */}
                    <Stack spacing={2} aria-busy={loading}>
                        {loading ? (
                            <>
                                <LinearProgress aria-label="Đang tải lịch hẹn" sx={{ borderRadius: 1 }} />
                                {Array.from({ length: 3 }, (_, index) => (
                                    <Paper key={index} variant="outlined" sx={{ ...clinicSurfaceSx, p: 3, borderRadius: "14px" }}>
                                        <Stack spacing={1.5}>
                                            <Skeleton width="40%" height={30} />
                                            <Skeleton width="60%" />
                                            <Skeleton variant="rounded" height={90} sx={{ borderRadius: "10px" }} />
                                        </Stack>
                                    </Paper>
                                ))}
                            </>
                        ) : (
                            !error &&
                            !dateError && (
                                <>
                                    <Typography aria-live="polite" sx={{ fontSize: 13.5, color: clinicColors.muted, fontWeight: 500 }}>
                                        {data?.totalItems || 0} lịch hẹn{filtered ? " phù hợp" : ""}
                                    </Typography>
                                    {!data?.items.length && (
                                        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 4, borderRadius: "14px" }}>
                                            <EmptyState
                                                message={
                                                    filtered
                                                        ? "Không có lịch hẹn phù hợp với bộ lọc."
                                                        : "Bạn chưa có lịch hẹn. Chọn Đặt lịch khám để đặt lịch mới."
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
                                            <Typography sx={{ fontSize: 13, color: clinicColors.muted }}>
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
                                                    type === "next" ? "Trang tiếp" : type === "previous" ? "Trang trước" : `Trang ${value}`
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
                    slotProps={{
                        paper: {
                            sx: {
                                borderRadius: "16px",
                                p: 1,
                            },
                        },
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: "#0f2c4d" }}>
                        Hủy lịch hẹn #{cancelTarget?.appointmentId}
                    </DialogTitle>
                    <DialogContent>
                        <Typography sx={{ fontSize: 14.5, color: "#374151", lineHeight: 1.6 }}>
                            Bạn có chắc chắn muốn hủy lịch khám ngày <strong>{dateText(cancelTarget?.appointmentDate)}</strong> lúc{" "}
                            <strong>{timeText(cancelTarget?.startTime)}</strong> không?
                        </Typography>
                        {cancelError && <Alert severity="error" sx={{ mt: 2, borderRadius: "8px" }}>{cancelError}</Alert>}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                        <Button
                            disabled={cancelling}
                            onClick={() => setCancelTarget(null)}
                            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
                        >
                            Giữ lịch hẹn
                        </Button>
                        <Button
                            color="error"
                            variant="contained"
                            disabled={cancelling}
                            onClick={confirmCancellation}
                            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}
                        >
                            {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
