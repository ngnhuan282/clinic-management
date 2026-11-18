import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    AssignmentTurnedInOutlined,
    CancelOutlined,
    CheckCircleOutlineOutlined,
    CloseOutlined,
    EditCalendarOutlined,
    PersonSearchOutlined,
} from "@mui/icons-material";
import { formatDate } from "../../../utils/formatDate";
import {
    clinicButtonSx,
    clinicColors,
    clinicDialogActionsSx,
    clinicDialogPaperSx,
    clinicFieldSx,
    clinicPrimaryButtonSx,
    clinicSecondaryButtonSx,
} from "../../common/clinicUi";

const DIRECT_FORM_CARD_SX = {
    p: 2,
    border: "1px solid",
    borderColor: "#D4E1EE",
    bgcolor: "#F8FBFF",
    borderRadius: "12px",
};

function formatTime(value) {
    if (!value) return "--:--";
    return String(value).slice(0, 5);
}

export default function AppointmentDialogs({
    action,
    saving,
    dialogError,
    dialogForm,
    setDialogForm,
    departments,
    doctors,
    setDoctors,
    slots,
    setSlots,
    slotsLoading,
    patientMatches,
    setPatientMatches,
    matchingPatients,
    onMatchPatients,
    today,
    directDateOptions,
    onClose,
    onSubmit,
}) {
    if (!action) return null;

    const isScheduleDialog = action.type === "reschedule" || action.type === "create";
    const scheduleDisabled =
        slotsLoading || !dialogForm.doctorId || !dialogForm.appointmentDate || !dialogForm.startTime;
    const createDisabled =
        scheduleDisabled ||
        !dialogForm.patientName.trim() ||
        !dialogForm.patientPhone.trim() ||
        !dialogForm.reason.trim();

    const selectedDepartment = departments.find(
        department => String(department.departmentId) === String(dialogForm.departmentId)
    );
    const selectedDoctor = doctors.find(
        doctor => String(doctor.doctorId) === String(dialogForm.doctorId)
    );
    const selectedSlot = slots.find(slot => slot.startTime === dialogForm.startTime);

    const directSteps = [
        { label: "Chuyên khoa", complete: Boolean(dialogForm.departmentId) },
        { label: "Bác sĩ", complete: Boolean(dialogForm.doctorId) },
        { label: "Ngày khám", complete: Boolean(dialogForm.appointmentDate) },
        { label: "Khung giờ", complete: Boolean(dialogForm.startTime) },
        {
            label: "Bệnh nhân",
            complete: Boolean(
                dialogForm.patientName.trim() &&
                    dialogForm.patientPhone.trim() &&
                    dialogForm.reason.trim()
            ),
        },
        { label: "Hoàn tất", complete: !createDisabled },
    ];
    const firstIncomplete = directSteps.findIndex(step => !step.complete);
    const activeDirectStep = firstIncomplete === -1 ? 5 : firstIncomplete;

    const actionTitle =
        action.type === "confirm"
            ? "Xác nhận lịch hẹn"
            : action.type === "cancel"
            ? action.appointment?.status === "Pending"
                ? "Từ chối / Hủy lịch hẹn chờ duyệt"
                : "Hủy lịch hẹn"
            : action.type === "create"
            ? "Đặt lịch trực tiếp"
            : "Đổi lịch hẹn sang khung giờ trống";

    const dialogMaxWidth = action.type === "create" ? "md" : isScheduleDialog ? "sm" : "xs";

    return (
        <Dialog
            open={Boolean(action)}
            onClose={saving ? undefined : onClose}
            fullWidth
            maxWidth={dialogMaxWidth}
            slotProps={{
                paper: {
                    sx: {
                        ...clinicDialogPaperSx,
                        m: { xs: 1.25, sm: 2 },
                        width: { xs: "calc(100% - 20px)", sm: "100%" },
                        overflow: "hidden",
                    },
                },
            }}
        >
            {action.type === "create" ? (
                <>
                    <DialogTitle sx={{ p: 0 }}>
                        <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "center", p: { xs: 2, sm: 2.5 }, pb: 1.75, bgcolor: "#F8FBFF" }}
                        >
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: "11px",
                                    bgcolor: "#0B4F8A",
                                    color: "#FFFFFF",
                                    display: "grid",
                                    placeItems: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <AssignmentTurnedInOutlined />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                    <Typography variant="h6" component="span" sx={{ fontWeight: 800, color: clinicColors.heading }}>
                                        Đặt lịch khám trực tiếp tại quầy
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label="Walk-in / Đặt hộ"
                                        sx={{ bgcolor: "#E6F0FA", color: "#0B4F8A", fontWeight: 750 }}
                                    />
                                </Stack>
                                <Typography variant="body2" sx={{ color: clinicColors.muted, mt: 0.25 }}>
                                    Chỉ mở các ca bác sĩ đã duyệt và khung giờ chưa bị đặt. Đối chiếu SĐT trước để tránh tạo trùng hồ sơ.
                                </Typography>
                            </Box>
                            <IconButton aria-label="Đóng form đặt lịch" disabled={saving} onClick={onClose}>
                                <CloseOutlined />
                            </IconButton>
                        </Stack>
                        <Divider />
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" },
                                gap: 1,
                                px: { xs: 2, sm: 2.5 },
                                py: 1.25,
                                bgcolor: "#EEF5FB",
                            }}
                        >
                            {directSteps.map((step, index) => {
                                const isDone = step.complete;
                                const isActive = index === activeDirectStep;
                                return (
                                    <Stack
                                        key={step.label}
                                        direction="row"
                                        spacing={0.75}
                                        sx={{
                                            alignItems: "center",
                                            minWidth: 0,
                                            bgcolor: isDone ? "#ECFDF5" : isActive ? "#FFFFFF" : "transparent",
                                            border: isDone
                                                ? "1px solid #6EE7B7"
                                                : isActive
                                                ? "1.5px solid #0B4F8A"
                                                : "1px solid transparent",
                                            borderRadius: "999px",
                                            px: 1,
                                            py: 0.5,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 21,
                                                height: 21,
                                                borderRadius: "50%",
                                                bgcolor: isDone ? "#059669" : isActive ? "#0B4F8A" : "#CBD5E1",
                                                color: "#FFFFFF",
                                                display: "grid",
                                                placeItems: "center",
                                                fontSize: 11.5,
                                                fontWeight: 800,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {isDone ? "✓" : index + 1}
                                        </Box>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 750,
                                                color: isDone ? "#065F46" : isActive ? "#0B4F8A" : "#64748B",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {step.label}
                                        </Typography>
                                    </Stack>
                                );
                            })}
                        </Box>
                    </DialogTitle>

                    <DialogContent sx={{ bgcolor: "#FFFFFF", p: { xs: 2, sm: 2.5 } }}>
                        <Stack spacing={2}>
                            {dialogError && <Alert severity="error">{dialogError}</Alert>}

                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                                {/* Steps 1 & 2 */}
                                <Box sx={{ ...DIRECT_FORM_CARD_SX, borderTop: "3px solid #0B4F8A" }}>
                                    <Typography
                                        sx={{
                                            fontSize: 12.5,
                                            fontWeight: 800,
                                            color: "#0B4F8A",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.03em",
                                            mb: 1.5,
                                        }}
                                    >
                                        Bước 1 & 2 · Chuyên khoa & Bác sĩ (Ca đã duyệt)
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        <TextField
                                            select
                                            size="small"
                                            fullWidth
                                            label="1. Chọn Chuyên khoa khám"
                                            value={dialogForm.departmentId}
                                            disabled={saving}
                                            required
                                            sx={clinicFieldSx}
                                            onChange={event => {
                                                setDoctors([]);
                                                setSlots([]);
                                                setDialogForm(current => ({
                                                    ...current,
                                                    departmentId: event.target.value,
                                                    doctorId: "",
                                                    startTime: "",
                                                }));
                                            }}
                                        >
                                            <MenuItem value="">Chọn chuyên khoa</MenuItem>
                                            {departments.map(department => (
                                                <MenuItem key={department.departmentId} value={department.departmentId}>
                                                    {department.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <TextField
                                            select
                                            size="small"
                                            fullWidth
                                            label="2. Chọn Bác sĩ phụ trách"
                                            value={dialogForm.doctorId}
                                            disabled={saving || !dialogForm.departmentId}
                                            required
                                            sx={clinicFieldSx}
                                            onChange={event => {
                                                setSlots([]);
                                                setDialogForm(current => ({
                                                    ...current,
                                                    doctorId: event.target.value,
                                                    startTime: "",
                                                }));
                                            }}
                                        >
                                            <MenuItem value="">Chọn bác sĩ</MenuItem>
                                            {doctors.map(doctor => (
                                                <MenuItem key={doctor.doctorId} value={doctor.doctorId}>
                                                    {doctor.title} {doctor.fullName}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                gap: 1,
                                                flexWrap: "wrap",
                                                p: 1.25,
                                                bgcolor: "#FFFFFF",
                                                borderRadius: "9px",
                                                border: "1px solid #DCE7F2",
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#0A2540" }}>
                                                {selectedDoctor
                                                    ? `${selectedDoctor.title} ${selectedDoctor.fullName}`
                                                    : "Vui lòng chọn chuyên khoa & bác sĩ"}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                color={selectedDoctor ? "success" : "default"}
                                                label={selectedDoctor ? "Đã chọn" : "Đang chờ"}
                                            />
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* Steps 3 & 4 */}
                                <Box sx={{ ...DIRECT_FORM_CARD_SX, borderTop: "3px solid #059669" }}>
                                    <Stack
                                        direction="row"
                                        sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 0.5 }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: 12.5,
                                                fontWeight: 800,
                                                color: "#065F46",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.03em",
                                            }}
                                        >
                                            Bước 3 & 4 · Ngày & Khung giờ trống
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={slotsLoading ? "Đang tải..." : `${slots.length} giờ trống`}
                                            sx={{ bgcolor: "#ECFDF5", color: "#065F46", fontWeight: 750, height: 22 }}
                                        />
                                    </Stack>

                                    <Stack spacing={1.5}>
                                        <Box>
                                            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", mb: 1 }}>
                                                {directDateOptions.map(option => (
                                                    <Button
                                                        key={option.value}
                                                        size="small"
                                                        variant={
                                                            dialogForm.appointmentDate === option.value
                                                                ? "contained"
                                                                : "outlined"
                                                        }
                                                        sx={{
                                                            borderRadius: "8px",
                                                            textTransform: "none",
                                                            fontWeight: 700,
                                                            fontSize: 12.5,
                                                        }}
                                                        onClick={() => {
                                                            setSlots([]);
                                                            setDialogForm(current => ({
                                                                ...current,
                                                                appointmentDate: option.value,
                                                                startTime: "",
                                                            }));
                                                        }}
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </Stack>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                type="date"
                                                label="3. Ngày khám (hoặc chọn ngày khác)"
                                                value={dialogForm.appointmentDate}
                                                disabled={saving}
                                                sx={clinicFieldSx}
                                                slotProps={{
                                                    inputLabel: { shrink: true },
                                                    htmlInput: { min: today },
                                                }}
                                                onChange={event => {
                                                    setSlots([]);
                                                    setDialogForm(current => ({
                                                        ...current,
                                                        appointmentDate: event.target.value,
                                                        startTime: "",
                                                    }));
                                                }}
                                            />
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 750, color: "#0A2540" }}>
                                                4. Bấm chọn khung giờ trống (30 phút/lượt) *
                                            </Typography>
                                            <Box
                                                sx={{
                                                    mt: 0.75,
                                                    maxHeight: 150,
                                                    overflowY: "auto",
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 0.75,
                                                }}
                                            >
                                                {slots.map(slot => {
                                                    const active = dialogForm.startTime === slot.startTime;
                                                    return (
                                                        <Button
                                                            key={slot.startTime}
                                                            size="small"
                                                            variant={active ? "contained" : "outlined"}
                                                            sx={{
                                                                borderRadius: "8px",
                                                                fontWeight: 800,
                                                                fontVariantNumeric: "tabular-nums",
                                                                bgcolor: active ? "#0B4F8A" : "#ECFDF5",
                                                                color: active ? "#FFFFFF" : "#065F46",
                                                                borderColor: active ? "#0B4F8A" : "#059669",
                                                                "&:hover": {
                                                                    bgcolor: active ? "#083A66" : "#D1FAE5",
                                                                },
                                                            }}
                                                            onClick={() =>
                                                                setDialogForm(current => ({
                                                                    ...current,
                                                                    startTime: slot.startTime,
                                                                }))
                                                            }
                                                        >
                                                            {formatTime(slot.startTime)}
                                                        </Button>
                                                    );
                                                })}
                                                {!slotsLoading && !slots.length && (
                                                    <Chip
                                                        size="small"
                                                        color="warning"
                                                        variant="outlined"
                                                        label={
                                                            dialogForm.doctorId
                                                                ? "Không có khung giờ trống trong ngày này"
                                                                : "Chọn bác sĩ ở Bước 2 để xem giờ trống"
                                                        }
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Box>

                            {/* Step 5: Patient Matching & Info */}
                            <Box sx={{ ...DIRECT_FORM_CARD_SX, borderTop: "3px solid #7C3AED" }}>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1}
                                    sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 1.5 }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 12.5,
                                            fontWeight: 800,
                                            color: "#5B21B6",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.03em",
                                        }}
                                    >
                                        Bước 5 · Đối chiếu hồ sơ bệnh nhân & Lý do khám
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600 }}>
                                        Mẹo: Nhập SĐT rồi bấm “Đối chiếu Patient cũ” để tự điền hồ sơ có sẵn
                                    </Typography>
                                </Stack>

                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" }, gap: 1.5 }}>
                                    <TextField
                                        size="small"
                                        label="Họ và tên bệnh nhân"
                                        value={dialogForm.patientName}
                                        disabled={saving || Boolean(dialogForm.patientProfileId)}
                                        required
                                        sx={clinicFieldSx}
                                        slotProps={{ htmlInput: { maxLength: 100 } }}
                                        onChange={event =>
                                            setDialogForm(current => ({ ...current, patientName: event.target.value }))
                                        }
                                    />
                                    <TextField
                                        size="small"
                                        label="Số điện thoại liên hệ"
                                        value={dialogForm.patientPhone}
                                        disabled={saving || Boolean(dialogForm.patientProfileId)}
                                        required
                                        sx={clinicFieldSx}
                                        slotProps={{ htmlInput: { maxLength: 15 } }}
                                        onChange={event =>
                                            setDialogForm(current => ({ ...current, patientPhone: event.target.value }))
                                        }
                                    />

                                    <Box sx={{ gridColumn: { md: "1 / -1" } }}>
                                        <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 1, flexWrap: "wrap", alignItems: "center" }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<PersonSearchOutlined fontSize="small" />}
                                                sx={clinicSecondaryButtonSx}
                                                disabled={
                                                    saving || matchingPatients || dialogForm.patientPhone.trim().length < 2
                                                }
                                                onClick={onMatchPatients}
                                            >
                                                {matchingPatients ? "Đang tìm..." : "Đối chiếu Patient cũ"}
                                            </Button>
                                            {dialogForm.patientProfileId && (
                                                <Button
                                                    size="small"
                                                    color="warning"
                                                    onClick={() => {
                                                        setDialogForm(current => ({
                                                            ...current,
                                                            patientProfileId: "",
                                                            patientName: "",
                                                            patientPhone: "",
                                                            birthDate: "",
                                                            identityNumber: "",
                                                            insuranceCode: "",
                                                        }));
                                                        setPatientMatches([]);
                                                    }}
                                                >
                                                    Bỏ chọn hồ sơ (#{dialogForm.patientProfileId})
                                                </Button>
                                            )}
                                        </Stack>

                                        {patientMatches.length > 0 && (
                                            <TextField
                                                select
                                                size="small"
                                                fullWidth
                                                label="Chọn hồ sơ đã đối chiếu"
                                                value={dialogForm.patientProfileId}
                                                sx={clinicFieldSx}
                                                onChange={event => {
                                                    const patient = patientMatches.find(
                                                        item => item.patientId === Number(event.target.value)
                                                    );
                                                    setDialogForm(current => ({
                                                        ...current,
                                                        patientProfileId: patient?.patientId || "",
                                                        patientName: patient?.fullName || current.patientName,
                                                        patientPhone: patient?.phone || current.patientPhone,
                                                        birthDate: patient?.birthDate?.slice(0, 10) || "",
                                                        identityNumber: patient?.identityNumber || "",
                                                        insuranceCode: patient?.insuranceCode || "",
                                                    }));
                                                }}
                                            >
                                                <MenuItem value="">Tạo Patient mới</MenuItem>
                                                {patientMatches.map(patient => (
                                                    <MenuItem key={patient.patientId} value={patient.patientId}>
                                                        #{patient.patientId} · {patient.fullName} · {patient.phone}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    </Box>

                                    <TextField
                                        size="small"
                                        label="Ngày sinh"
                                        type="date"
                                        value={dialogForm.birthDate}
                                        disabled={saving || Boolean(dialogForm.patientProfileId)}
                                        sx={clinicFieldSx}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        onChange={event =>
                                            setDialogForm(current => ({ ...current, birthDate: event.target.value }))
                                        }
                                    />
                                    <TextField
                                        size="small"
                                        label="Số CCCD / Định danh (VNeID)"
                                        value={dialogForm.identityNumber}
                                        disabled={saving || Boolean(dialogForm.patientProfileId)}
                                        sx={clinicFieldSx}
                                        slotProps={{ htmlInput: { maxLength: 20 } }}
                                        onChange={event =>
                                            setDialogForm(current => ({
                                                ...current,
                                                identityNumber: event.target.value,
                                            }))
                                        }
                                    />
                                    <TextField
                                        size="small"
                                        label="Mã thẻ BHYT"
                                        value={dialogForm.insuranceCode}
                                        disabled={saving || Boolean(dialogForm.patientProfileId)}
                                        sx={{ ...clinicFieldSx, gridColumn: { md: "1 / -1" } }}
                                        slotProps={{ htmlInput: { maxLength: 30 } }}
                                        onChange={event =>
                                            setDialogForm(current => ({
                                                ...current,
                                                insuranceCode: event.target.value,
                                            }))
                                        }
                                    />
                                    <TextField
                                        sx={{ ...clinicFieldSx, gridColumn: { md: "1 / -1" } }}
                                        size="small"
                                        label="Lý do khám / Triệu chứng ban đầu"
                                        value={dialogForm.reason}
                                        disabled={saving}
                                        required
                                        multiline
                                        minRows={2}
                                        slotProps={{ htmlInput: { maxLength: 500 } }}
                                        onChange={event =>
                                            setDialogForm(current => ({ ...current, reason: event.target.value }))
                                        }
                                    />
                                </Box>
                            </Box>

                            {/* Step 6: Summary */}
                            <Box
                                sx={{
                                    ...DIRECT_FORM_CARD_SX,
                                    bgcolor: "#EEF7FF",
                                    borderColor: "#90BCE6",
                                    borderTop: "3px solid #0B4F8A",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 12.5,
                                        fontWeight: 800,
                                        color: "#0B4F8A",
                                        textTransform: "uppercase",
                                        mb: 1.25,
                                    }}
                                >
                                    Bước 6 · Kiểm tra tóm tắt trước khi lưu
                                </Typography>
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
                                        gap: 1.5,
                                    }}
                                >
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Chuyên khoa
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 750 }}>
                                            {selectedDepartment?.name || "Chưa chọn"}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Bác sĩ
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 750 }}>
                                            {selectedDoctor
                                                ? `${selectedDoctor.title} ${selectedDoctor.fullName}`
                                                : "Chưa chọn"}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Thời gian hẹn
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: "#0B4F8A" }}>
                                            {selectedSlot
                                                ? `${formatTime(selectedSlot.startTime)} · ${formatDate(dialogForm.appointmentDate)}`
                                                : "Chưa chọn"}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Hồ sơ Patient
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 750 }}>
                                            {dialogForm.patientProfileId
                                                ? `#${dialogForm.patientProfileId} · Hồ sơ cũ`
                                                : "Tạo hồ sơ mới"}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Stack>
                    </DialogContent>

                    <DialogActions sx={{ ...clinicDialogActionsSx, justifyContent: "space-between", bgcolor: "#F8FBFF" }}>
                        <Typography variant="caption" sx={{ color: clinicColors.muted, fontWeight: 600 }}>
                            Sau khi tạo lịch (Đã xác nhận), bấm <strong>Check-in</strong> trên dòng lịch để kiểm tra sổ khám giấy.
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button disabled={saving} onClick={onClose} variant="outlined" sx={clinicSecondaryButtonSx}>
                                Hủy
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<CheckCircleOutlineOutlined />}
                                disabled={saving || createDisabled}
                                sx={clinicPrimaryButtonSx}
                                onClick={onSubmit}
                            >
                                {saving ? "Đang xác nhận..." : "Xác nhận"}
                            </Button>
                        </Stack>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogTitle
                        sx={{
                            p: 2.5,
                            pb: 1.75,
                            borderBottom: `1px solid ${clinicColors.border}`,
                            bgcolor: "#F8FBFF",
                            fontWeight: 800,
                            fontSize: 18.5,
                            color: clinicColors.heading,
                        }}
                    >
                        {actionTitle}
                    </DialogTitle>

                    <DialogContent sx={{ p: 2.5 }}>
                        <Stack spacing={2}>
                            {dialogError && <Alert severity="error">{dialogError}</Alert>}

                            {action.appointment && (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 1.75,
                                        borderRadius: "12px",
                                        bgcolor: "#F4F7FA",
                                        borderColor: "#DCE7F2",
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: "#0A2540" }}>
                                        {action.appointment.patientName} · {action.appointment.patientPhone}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#0B4F8A", fontWeight: 700, mt: 0.35 }}>
                                        {formatDate(action.appointment.appointmentDate)} · {formatTime(action.appointment.startTime)} –{" "}
                                        {formatTime(action.appointment.endTime)} · {action.appointment.doctorName}
                                    </Typography>
                                </Paper>
                            )}

                            {action.type === "confirm" && (
                                <Alert severity="info" sx={{ borderRadius: "10px", bgcolor: "#EAF2FA", color: "#0A2540" }}>
                                    Lịch hẹn sẽ chuyển sang trạng thái <strong>Đã xác nhận</strong> và gửi thông báo thời gian thực cho bệnh nhân để chuẩn bị sổ khám đến quầy đúng giờ.
                                </Alert>
                            )}

                            {action.type === "cancel" && (
                                <Alert severity="warning" sx={{ borderRadius: "10px" }}>
                                    {action.appointment?.status === "Pending"
                                        ? "Từ chối / hủy lịch chờ duyệt sẽ chuyển lịch sang Đã hủy, giải phóng khung giờ khám và gửi thông báo tới bệnh nhân."
                                        : "Lịch hẹn bị hủy sẽ nhả khung giờ 30 phút để bệnh nhân khác có thể đặt lại và gửi thông báo thay đổi."}
                                </Alert>
                            )}

                            {action.type === "reschedule" && (
                                <Stack spacing={1.75}>
                                    <Alert severity="info" sx={{ borderRadius: "10px", bgcolor: "#EAF2FA", color: "#0A2540" }}>
                                        Chọn bác sĩ (ca đã duyệt), ngày và <strong>khung giờ còn trống</strong> mới. Sau khi lưu, lịch được chuyển sang <strong>Đã xác nhận</strong> và thông báo cho bệnh nhân.
                                    </Alert>

                                    <TextField
                                        select
                                        size="small"
                                        label="Khoa"
                                        value={dialogForm.departmentId}
                                        disabled={saving}
                                        sx={clinicFieldSx}
                                        onChange={event => {
                                            setDoctors([]);
                                            setSlots([]);
                                            setDialogForm(current => ({
                                                ...current,
                                                departmentId: event.target.value,
                                                doctorId: "",
                                                startTime: "",
                                            }));
                                        }}
                                    >
                                        <MenuItem value="">Chọn khoa</MenuItem>
                                        {departments.map(department => (
                                            <MenuItem key={department.departmentId} value={department.departmentId}>
                                                {department.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    <TextField
                                        select
                                        size="small"
                                        label="Bác sĩ"
                                        value={dialogForm.doctorId}
                                        disabled={saving || !dialogForm.departmentId}
                                        sx={clinicFieldSx}
                                        onChange={event => {
                                            setSlots([]);
                                            setDialogForm(current => ({
                                                ...current,
                                                doctorId: event.target.value,
                                                startTime: "",
                                            }));
                                        }}
                                    >
                                        <MenuItem value="">Chọn bác sĩ</MenuItem>
                                        {doctors.map(doctor => (
                                            <MenuItem key={doctor.doctorId} value={doctor.doctorId}>
                                                {doctor.title} {doctor.fullName}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    <TextField
                                        size="small"
                                        label="Ngày khám"
                                        type="date"
                                        value={dialogForm.appointmentDate}
                                        disabled={saving}
                                        sx={clinicFieldSx}
                                        onChange={event => {
                                            setSlots([]);
                                            setDialogForm(current => ({
                                                ...current,
                                                appointmentDate: event.target.value,
                                                startTime: "",
                                            }));
                                        }}
                                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }}
                                    />

                                    <TextField
                                        select
                                        size="small"
                                        label="Khung giờ còn trống"
                                        value={dialogForm.startTime}
                                        disabled={saving || !slots.length}
                                        sx={clinicFieldSx}
                                        onChange={event =>
                                            setDialogForm(current => ({
                                                ...current,
                                                startTime: event.target.value,
                                            }))
                                        }
                                    >
                                        <MenuItem value="">Chọn giờ khám</MenuItem>
                                        {slots.map(slot => (
                                            <MenuItem key={slot.startTime} value={slot.startTime}>
                                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    {dialogForm.doctorId && dialogForm.appointmentDate && !slotsLoading && !slots.length && (
                                        <Chip
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                            label="Không có khung giờ trống cho ngày đã chọn"
                                        />
                                    )}
                                </Stack>
                            )}
                        </Stack>
                    </DialogContent>

                    <DialogActions sx={clinicDialogActionsSx}>
                        <Button disabled={saving} onClick={onClose} variant="outlined" sx={clinicSecondaryButtonSx}>
                            Đóng
                        </Button>
                        <Button
                            variant="contained"
                            color={action.type === "cancel" ? "error" : "primary"}
                            startIcon={
                                action.type === "cancel" ? (
                                    <CancelOutlined />
                                ) : action.type === "reschedule" ? (
                                    <EditCalendarOutlined />
                                ) : (
                                    <CheckCircleOutlineOutlined />
                                )
                            }
                            sx={action.type === "cancel" ? clinicButtonSx : clinicPrimaryButtonSx}
                            disabled={saving || (action.type === "reschedule" && scheduleDisabled)}
                            onClick={onSubmit}
                        >
                            {saving ? "Đang lưu..." : "Xác nhận"}
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}
