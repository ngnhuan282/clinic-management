import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    InputAdornment,
    MenuItem,
    Paper,
    Radio,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonIcon from "@mui/icons-material/Person";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import useBooking from "../../hooks/useBooking";

const COLORS = {
    canvas: "#f5f9fd",
    card: "#ffffff",
    primary: "#1976d2",
    primaryDark: "#1565c0",
    heading: "#1f2937",
    body: "#374151",
    muted: "#6b7280",
    border: "#e5e9f0",
    borderStrong: "#d8e1ee",
    blueSoft: "#eff6ff",
    green: "#10b981",
    greenSoft: "#ecfdf5",
    greenBorder: "#bbf7d0",
    greenText: "#166534",
    warningSoft: "#fffbeb",
    warning: "#f59e0b",
    occupied: "#f3f4f6",
};

const STEPS = [
    "Chọn Chuyên khoa",
    "Chọn Bác sĩ",
    "Chọn Ngày khám",
    "Chọn Khung giờ",
    "Lý Do Khám",
    "Xác Nhận",
];

function formatTime(value) {
    return String(value || "").slice(0, 5);
}

function toDateInput(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDateCards(selectedDate, slots) {
    const today = new Date();
    const selectedAvailableCount = slots.filter(
        (slot) => slot.isAvailable
    ).length;

    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);

        const value = toDateInput(date);

        return {
            value,
            dayName:
                date.getDay() === 0
                    ? "CN"
                    : `Thứ ${date.getDay() + 1}`,
            day: String(date.getDate()).padStart(2, "0"),
            month: String(date.getMonth() + 1).padStart(2, "0"),
            label: index === 0 ? "Hôm nay" : "",
            availableCount:
                value === selectedDate
                    ? selectedAvailableCount
                    : null,
        };
    });
}

function BookingPage() {
    const booking = useBooking();
    const [birthDate, setBirthDate] = useState("");
    const [gender, setGender] = useState("Nam");
    const [insuranceNumber, setInsuranceNumber] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploadError, setUploadError] = useState("");
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);

    const dateCards = useMemo(
        () => getDateCards(booking.selectedDate, booking.slots),
        [booking.selectedDate, booking.slots]
    );

    const morningSlots = booking.slots.filter(
        (slot) => formatTime(slot.startTime) < "12:00"
    );
    const afternoonSlots = booking.slots.filter(
        (slot) => formatTime(slot.startTime) >= "12:00"
    );

    const hasPatientInfo =
        Boolean(booking.patientName.trim())
        && Boolean(booking.patientPhone.trim())
        && Boolean(booking.reason.trim());

    const currentStep = getCurrentStep({
        hasDepartment: Boolean(booking.selectedDepartmentId),
        hasDoctor: Boolean(booking.selectedDoctorId),
        hasDate: Boolean(booking.selectedDate),
        hasSlot: Boolean(booking.selectedSlot),
        hasPatientInfo,
    });

    const completedSteps = getCompletedSteps({
        hasDepartment: Boolean(booking.selectedDepartmentId),
        hasDoctor: Boolean(booking.selectedDoctorId),
        hasDate: Boolean(booking.selectedDate),
        hasSlot: Boolean(booking.selectedSlot),
        hasPatientInfo,
    });

    const handleFilesSelected = (files) => {
        const acceptedTypes = [
            "image/jpeg",
            "image/png",
            "application/pdf",
        ];
        const maxSize = 15 * 1024 * 1024;
        const selectedFiles = Array.from(files);
        const invalidFile = selectedFiles.find(
            (file) =>
                !acceptedTypes.includes(file.type) || file.size > maxSize
        );

        if (invalidFile) {
            setUploadError(
                "Chỉ hỗ trợ JPG, PNG, PDF và dung lượng mỗi file tối đa 15MB."
            );
            return;
        }

        setUploadError("");
        setUploadedFiles((currentFiles) => [
            ...currentFiles,
            ...selectedFiles,
        ]);
    };

    const handleRemoveFile = (fileIndex) => {
        setUploadedFiles((currentFiles) =>
            currentFiles.filter((_, index) => index !== fileIndex)
        );
    };

    useEffect(() => {
        if (booking.successAppointment) {
            // Reset the supplementary fields after the asynchronous booking completes.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setBirthDate("");
            setGender("Nam");
            setInsuranceNumber("");
            setUploadedFiles([]);
            setUploadError("");
            setSuccessDialogOpen(true);
        }
    }, [booking.successAppointment]);

    return (
        <Box sx={{ backgroundColor: COLORS.canvas, minHeight: "100vh" }}>
            <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
                <Stack spacing={3}>
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        spacing={2}
                    >
                        <BreadcrumbText booking={booking} />
                        <Chip
                            size="small"
                            label="Hệ thống phân luồng thời gian thực khả dụng"
                            sx={{
                                alignSelf: { xs: "flex-start", md: "center" },
                                backgroundColor: COLORS.greenSoft,
                                border: `1px solid ${COLORS.greenBorder}`,
                                color: COLORS.green,
                                fontWeight: 700,
                            }}
                        />
                    </Stack>

                    <StepperCard
                        currentStep={currentStep}
                        completedSteps={completedSteps}
                    />

                    {booking.error ? (
                        <Alert severity="error">{booking.error}</Alert>
                    ) : null}

                    {booking.successAppointment ? (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                            Đã ghi nhận lịch khám lúc{" "}
                            {formatTime(booking.successAppointment.startTime)}{" "}
                            ngày{" "}
                            {booking.successAppointment.appointmentDate?.slice(
                                0,
                                10
                            )}
                            .
                        </Alert>
                    ) : null}

                    <Grid container spacing={3} alignItems="flex-start">
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <Stack spacing={3}>
                                <PaperCard>
                                    <Stack spacing={2.5}>
                                        <SectionTitle
                                            icon={<LocalHospitalIcon />}
                                            title="1. Chọn Chuyên Khoa"
                                            meta="Dữ liệu chuyên khoa lấy từ hệ thống"
                                        />
                                        <TextField
                                            select
                                            fullWidth
                                            label="Chuyên khoa"
                                            value={
                                                booking.selectedDepartmentId
                                            }
                                            onChange={(event) =>
                                                booking.setSelectedDepartmentId(
                                                    event.target.value
                                                )
                                            }
                                            disabled={
                                                booking.loading.departments
                                            }
                                        >
                                            {booking.departments.map(
                                                (department) => (
                                                    <MenuItem
                                                        key={
                                                            department.departmentId
                                                        }
                                                        value={
                                                            department.departmentId
                                                        }
                                                    >
                                                        {
                                                            department.name
                                                        }
                                                    </MenuItem>
                                                )
                                            )}
                                        </TextField>

                                        <SectionTitle
                                            icon={<BadgeIcon />}
                                            title="2. Chọn Bác Sĩ"
                                            meta="Bác sĩ được lọc theo chuyên khoa"
                                        />
                                        {booking.loading.doctors ? (
                                            <InlineLoading />
                                        ) : (
                                            <Grid container spacing={1.5}>
                                                {booking.doctors.map(
                                                    (doctor) => (
                                                        <Grid size={{ xs: 12, sm: 6 }}
                                                            key={
                                                                doctor.doctorId
                                                            }
                                                        >
                                                            <DoctorCard
                                                                doctor={doctor}
                                                                selected={
                                                                    booking.selectedDoctorId ===
                                                                    String(
                                                                        doctor.doctorId
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    booking.setSelectedDoctorId(
                                                                        String(
                                                                            doctor.doctorId
                                                                        )
                                                                    )
                                                                }
                                                            />
                                                        </Grid>
                                                    )
                                                )}
                                            </Grid>
                                        )}
                                    </Stack>
                                </PaperCard>

                                <PaperCard>
                                    <Stack spacing={2.5}>
                                        <SectionTitle
                                            icon={<CalendarMonthIcon />}
                                            title="3. Chọn Ngày Khám Bệnh"
                                            meta="Chọn ngày để xem giờ khám còn trống"
                                        />
                                        <Grid container spacing={1.5}>
                                            {dateCards.map((card) => (
                                                <Grid size={{ xs: 6, sm: 4, md: 2 }}
                                                    key={card.value}
                                                >
                                                    <DateCard
                                                        card={card}
                                                        selected={
                                                            booking.selectedDate ===
                                                            card.value
                                                        }
                                                        onClick={() =>
                                                            booking.setSelectedDate(
                                                                card.value
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Stack>
                                </PaperCard>

                                <PaperCard>
                                    <Stack spacing={2.5}>
                                        <Stack
                                            direction={{
                                                xs: "column",
                                                md: "row",
                                            }}
                                            justifyContent="space-between"
                                            spacing={2}
                                        >
                                            <SectionTitle
                                                icon={<AccessTimeIcon />}
                                                title="4. Chọn Giờ Khám"
                                                meta="Thời gian khám dự kiến: 20 - 30 phút/bệnh nhân"
                                            />
                                            <Legend />
                                        </Stack>

                                        {booking.loading.slots ? (
                                            <InlineLoading />
                                        ) : (
                                            <Stack spacing={2.5}>
                                                <SlotSection
                                                    title="Buổi Sáng"
                                                    slots={morningSlots}
                                                    booking={booking}
                                                />
                                                <SlotSection
                                                    title="Buổi Chiều"
                                                    slots={afternoonSlots}
                                                    booking={booking}
                                                />
                                            </Stack>
                                        )}
                                    </Stack>
                                </PaperCard>

                                <PaperCard>
                                    <Stack spacing={2.5}>
                                        <SectionTitle
                                            icon={<PersonIcon />}
                                            title="5. Thông Tin Bệnh Nhân & Triệu Chứng Ban Đầu"
                                            meta="Nhập thông tin liên hệ và lý do khám"
                                        />
                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: {
                                                    xs: "1fr",
                                                    md: "repeat(2, minmax(0, 1fr))",
                                                },
                                                gap: 2,
                                                "& .MuiInputBase-root": {
                                                    minHeight: 56,
                                                    alignItems: "center",
                                                },
                                                "& .MuiInputLabel-root": {
                                                    maxWidth: "calc(100% - 28px)",
                                                },
                                            }}
                                        >
                                            <Box>
                                                <TextField
                                                    label="Họ và tên bệnh nhân"
                                                    value={booking.patientName}
                                                    onChange={(event) =>
                                                        booking.setPatientName(
                                                            event.target.value
                                                        )
                                                    }
                                                    required
                                                    fullWidth
                                                />
                                            </Box>
                                            <Box>
                                                <TextField
                                                    label="Số điện thoại liên hệ"
                                                    value={booking.patientPhone}
                                                    onChange={(event) =>
                                                        booking.setPatientPhone(
                                                            event.target.value
                                                        )
                                                    }
                                                    required
                                                    fullWidth
                                                />
                                            </Box>
                                            <Box>
                                                <Typography
                                                    component="label"
                                                    htmlFor="patient-birth-date"
                                                    sx={{
                                                        display: "block",
                                                        mb: 0.75,
                                                        color: COLORS.heading,
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    Ngày tháng năm sinh
                                                </Typography>
                                                <TextField
                                                    id="patient-birth-date"
                                                    type="date"
                                                    value={birthDate}
                                                    onChange={(event) =>
                                                        setBirthDate(
                                                            event.target.value
                                                        )
                                                    }
                                                    fullWidth
                                                    inputProps={{
                                                        "aria-label":
                                                            "Ngày tháng năm sinh",
                                                    }}
                                                />
                                            </Box>
                                            <Stack
                                                direction={{
                                                    xs: "column",
                                                    sm: "row",
                                                }}
                                                spacing={1.5}
                                                sx={{
                                                    minWidth: 0,
                                                    "& .MuiButton-root": {
                                                        minHeight: 56,
                                                        minWidth: 0,
                                                    },
                                                }}
                                            >
                                                {["Nam", "Nữ", "Khác"].map(
                                                    (item) => (
                                                        <Button
                                                            key={item}
                                                            fullWidth
                                                            onClick={() =>
                                                                setGender(
                                                                    item
                                                                )
                                                            }
                                                            startIcon={
                                                                <Radio
                                                                    checked={
                                                                        gender ===
                                                                        item
                                                                    }
                                                                    size="small"
                                                                    sx={{
                                                                        p: 0,
                                                                    }}
                                                                />
                                                            }
                                                            sx={{
                                                                justifyContent:
                                                                    "center",
                                                                border: `1px solid ${
                                                                    gender ===
                                                                    item
                                                                        ? COLORS.primary
                                                                        : COLORS.borderStrong
                                                                }`,
                                                                color:
                                                                    gender ===
                                                                    item
                                                                        ? COLORS.primaryDark
                                                                        : COLORS.body,
                                                                backgroundColor:
                                                                    "#fff",
                                                                borderRadius:
                                                                    "8px",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {item}
                                                        </Button>
                                                    )
                                                )}
                                            </Stack>
                                            <Box>
                                                <TextField
                                                    label="Mã số thẻ Bảo Hiểm Y Tế"
                                                    value={insuranceNumber}
                                                    onChange={(event) =>
                                                        setInsuranceNumber(
                                                            event.target.value
                                                        )
                                                    }
                                                    fullWidth
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <CreditCardIcon fontSize="small" />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{ gridRow: { md: "span 2" } }}>
                                                <TextField
                                                    label="Mô tả lý do khám & triệu chứng bệnh lý"
                                                    value={booking.reason}
                                                    onChange={(event) =>
                                                        booking.setReason(
                                                            event.target.value
                                                        )
                                                    }
                                                    required
                                                    fullWidth
                                                    multiline
                                                    minRows={5}
                                                    sx={{
                                                        "& .MuiInputBase-root": {
                                                            alignItems:
                                                                "flex-start",
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        <UploadBox
                                            files={uploadedFiles}
                                            error={uploadError}
                                            onFilesSelected={
                                                handleFilesSelected
                                            }
                                            onRemoveFile={handleRemoveFile}
                                        />
                                        <EmergencyNote />
                                    </Stack>
                                </PaperCard>
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, lg: 4 }}>
                            <Stack
                                spacing={2.5}
                                sx={{ position: "sticky", top: 94 }}
                            >
                                <SummaryPanel
                                    booking={booking}
                                    currentStep={currentStep}
                                    onSubmit={booking.submitBooking}
                                />
                                <SupportCard />
                            </Stack>
                        </Grid>
                    </Grid>
                </Stack>
            </Container>

            <BookingSuccessDialog
                open={successDialogOpen}
                appointment={booking.successAppointment}
                onClose={() => setSuccessDialogOpen(false)}
            />
        </Box>
    );
}

function getCurrentStep({
    hasDepartment,
    hasDoctor,
    hasDate,
    hasSlot,
    hasPatientInfo,
}) {
    if (!hasDepartment) {
        return 1;
    }

    if (!hasDoctor) {
        return 2;
    }

    if (!hasDate) {
        return 3;
    }

    if (!hasSlot) {
        return 4;
    }

    if (!hasPatientInfo) {
        return 5;
    }

    return 6;
}

function getCompletedSteps({
    hasDepartment,
    hasDoctor,
    hasDate,
    hasSlot,
    hasPatientInfo,
}) {
    return new Set(
        [
            hasDepartment ? 1 : null,
            hasDoctor ? 2 : null,
            hasDate ? 3 : null,
            hasSlot ? 4 : null,
            hasPatientInfo ? 5 : null,
        ].filter(Boolean)
    );
}

function BreadcrumbText({ booking }) {
    return (
        <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ color: COLORS.muted, flexWrap: "wrap" }}
        >
            <ArrowBackIcon fontSize="small" />
            <Typography sx={{ fontSize: 14 }}>Trang chủ</Typography>
            <Typography sx={{ fontSize: 14 }}>/</Typography>
            <Typography sx={{ fontSize: 14 }}>Đặt lịch trực tuyến</Typography>
            <Typography sx={{ fontSize: 14 }}>/</Typography>
            <Typography
                sx={{
                    fontSize: 14,
                    color: COLORS.heading,
                    fontWeight: 800,
                }}
            >
                {booking.selectedDepartment?.name ||
                    "Chọn chuyên khoa"}
            </Typography>
        </Stack>
    );
}

function StepperCard({
    currentStep,
    completedSteps,
}) {
    return (
        <PaperCard>
            <Grid container spacing={1.5}>
                {STEPS.map((step, index) => {
                    const stepNumber = index + 1;
                    const done = completedSteps.has(stepNumber);
                    const active =
                        stepNumber === currentStep
                        && !done;

                    return (
                        <Grid size={{ xs: 6, sm: 4, md: 2 }} key={step}>
                            <Stack alignItems="center" spacing={0.75}>
                                <Avatar
                                    sx={{
                                        width: 38,
                                        height: 38,
                                        backgroundColor: done
                                            ? "#54bd95"
                                            : active
                                              ? COLORS.primary
                                              : "#edf2f7",
                                        color:
                                            done || active
                                                ? "#fff"
                                                : COLORS.muted,
                                        border: active
                                            ? "4px solid #d8eaff"
                                            : "none",
                                        fontWeight: 800,
                                    }}
                                >
                                    {done ? (
                                        <CheckCircleIcon fontSize="small" />
                                    ) : (
                                        stepNumber
                                    )}
                                </Avatar>
                                <Typography
                                    sx={{
                                        color: active
                                            ? COLORS.primaryDark
                                            : COLORS.muted,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Bước {stepNumber}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: active
                                            ? COLORS.primaryDark
                                            : COLORS.heading,
                                        fontSize: 12,
                                        fontWeight: 800,
                                        textAlign: "center",
                                        lineHeight: "16px",
                                    }}
                                >
                                    {step}
                                </Typography>
                            </Stack>
                        </Grid>
                    );
                })}
            </Grid>
        </PaperCard>
    );
}

function PaperCard({ children }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 3 },
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                backgroundColor: COLORS.card,
                boxShadow:
                    "0px 1px 3px rgba(15, 23, 42, 0.04), 0px 1px 2px rgba(15, 23, 42, 0.02)",
            }}
        >
            {children}
        </Paper>
    );
}

function SectionTitle({ icon, title, meta }) {
    return (
        <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar
                sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: COLORS.blueSoft,
                    color: COLORS.primary,
                }}
            >
                {icon}
            </Avatar>
            <Box>
                <Typography
                    sx={{
                        color: COLORS.heading,
                        fontSize: 18,
                        fontWeight: 800,
                        lineHeight: "26px",
                    }}
                >
                    {title}
                </Typography>
                {meta ? (
                    <Typography sx={{ color: COLORS.muted, fontSize: 13 }}>
                        {meta}
                    </Typography>
                ) : null}
            </Box>
        </Stack>
    );
}

function DoctorCard({ doctor, selected, onClick }) {
    return (
        <Button
            fullWidth
            onClick={onClick}
            sx={{
                p: 1.5,
                justifyContent: "flex-start",
                textAlign: "left",
                borderRadius: "12px",
                border: `1px solid ${
                    selected ? COLORS.primary : COLORS.border
                }`,
                backgroundColor: selected ? COLORS.blueSoft : "#fff",
                color: COLORS.body,
                "&:hover": {
                    borderColor: COLORS.primary,
                    backgroundColor: COLORS.blueSoft,
                },
            }}
        >
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                    sx={{
                        width: 54,
                        height: 54,
                        backgroundColor: "#dbeafe",
                        color: COLORS.primaryDark,
                        fontWeight: 800,
                    }}
                >
                    {doctor.fullName?.slice(0, 1)}
                </Avatar>
                <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                            label={doctor.title}
                            size="small"
                            sx={{
                                backgroundColor: COLORS.primary,
                                color: "#fff",
                                fontWeight: 800,
                                height: 22,
                            }}
                        />
                        <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
                            {doctor.experienceYears} năm kinh nghiệm
                        </Typography>
                    </Stack>
                    <Typography
                        sx={{
                            color: COLORS.heading,
                            fontWeight: 800,
                            mt: 0.5,
                        }}
                    >
                        {doctor.fullName}
                    </Typography>
                    <Typography sx={{ color: COLORS.primary, fontSize: 13 }}>
                        {doctor.departmentName}
                    </Typography>
                </Box>
            </Stack>
        </Button>
    );
}

function DateCard({ card, selected, onClick }) {
    return (
        <Button
            fullWidth
            onClick={onClick}
            sx={{
                height: 82,
                borderRadius: "8px",
                border: `1px solid ${
                    selected ? COLORS.primary : COLORS.borderStrong
                }`,
                backgroundColor: selected ? COLORS.blueSoft : "#fff",
                color: COLORS.heading,
                position: "relative",
                boxShadow: selected
                    ? "0 0 0 2px rgba(25, 118, 210, 0.18)"
                    : "none",
                "&:hover": {
                    borderColor: COLORS.primary,
                    backgroundColor: COLORS.blueSoft,
                },
            }}
        >
            {card.label ? (
                <Chip
                    label={card.label}
                    size="small"
                    sx={{
                        position: "absolute",
                        top: -12,
                        backgroundColor: COLORS.primary,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 800,
                    }}
                />
            ) : null}
            <Stack spacing={0.25} alignItems="center">
                <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
                    {card.dayName}
                </Typography>
                <Typography
                    sx={{
                        fontWeight: 900,
                        fontSize: 18,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {card.day}/{card.month}
                </Typography>
                <Typography
                    sx={{
                        color:
                            card.availableCount > 0
                                ? COLORS.green
                                : COLORS.warning,
                        fontSize: 12,
                        fontWeight: 700,
                    }}
                >
                    {card.availableCount === null ? "Chọn để xem" : `${card.availableCount} khung`}
                </Typography>
            </Stack>
        </Button>
    );
}

function Legend() {
    return (
        <Stack direction="row" spacing={1.5} alignItems="center">
            <LegendItem color={COLORS.primary} label="Đang chọn" />
            <LegendItem color={COLORS.green} label="Còn chỗ trống" />
            <LegendItem color="#cbd5e1" label="Đã kín lịch" />
        </Stack>
    );
}

function LegendItem({ color, label }) {
    return (
        <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
                sx={{
                    width: 11,
                    height: 11,
                    borderRadius: "3px",
                    backgroundColor: color,
                }}
            />
            <Typography sx={{ color: COLORS.body, fontSize: 12 }}>
                {label}
            </Typography>
        </Stack>
    );
}

function SlotSection({ title, slots, booking }) {
    return (
        <Stack spacing={1.5}>
            <Typography
                sx={{
                    color: COLORS.heading,
                    fontSize: 15,
                    fontWeight: 900,
                }}
            >
                {title}
            </Typography>
            <Grid container spacing={1.25}>
                {slots.map((slot) => {
                    const selected =
                        booking.selectedSlot?.startTime === slot.startTime;

                    return (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={slot.startTime}>
                            <Button
                                fullWidth
                                disabled={!slot.isAvailable}
                                onClick={() => booking.setSelectedSlot(slot)}
                                sx={{
                                    height: 62,
                                    borderRadius: "8px",
                                    fontVariantNumeric: "tabular-nums",
                                    fontWeight: 900,
                                    border: `1px solid ${
                                        selected
                                            ? COLORS.primary
                                            : slot.isAvailable
                                              ? COLORS.greenBorder
                                              : COLORS.border
                                    }`,
                                    color: selected
                                        ? "#fff"
                                        : slot.isAvailable
                                          ? COLORS.greenText
                                          : "#8b95a5",
                                    backgroundColor: selected
                                        ? COLORS.primary
                                        : slot.isAvailable
                                          ? COLORS.greenSoft
                                          : COLORS.occupied,
                                    "&:hover": {
                                        backgroundColor: selected
                                            ? COLORS.primaryDark
                                            : "#dcfce7",
                                    },
                                }}
                            >
                                <Stack alignItems="center" spacing={0.25}>
                                    <Typography sx={{ fontWeight: 900 }}>
                                        {formatTime(slot.startTime)}
                                    </Typography>
                                    <Typography sx={{ fontSize: 11 }}>
                                        {selected
                                            ? "Đang chọn"
                                            : slot.isAvailable
                                              ? "Còn chỗ"
                                              : "Đã kín chỗ"}
                                    </Typography>
                                </Stack>
                            </Button>
                        </Grid>
                    );
                })}
            </Grid>
        </Stack>
    );
}

function SummaryPanel({
    booking,
    currentStep,
    onSubmit,
}) {
    const doctor = booking.selectedDoctor;
    const canSubmit =
        booking.selectedSlot &&
        booking.patientName.trim() &&
        booking.patientPhone.trim() &&
        booking.reason.trim();

    return (
        <PaperCard>
            <Stack spacing={2.25}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Stack direction="row" spacing={1} alignItems="center">
                        <AssignmentTurnedInIcon sx={{ color: COLORS.primary }} />
                        <Typography
                            sx={{
                                color: COLORS.heading,
                                fontWeight: 900,
                                fontSize: 18,
                            }}
                        >
                            Phiếu Tóm Tắt Đặt Khám
                        </Typography>
                    </Stack>
                    <Chip
                        label={`Bước ${currentStep}/6`}
                        size="small"
                        sx={{
                            backgroundColor: COLORS.blueSoft,
                            color: COLORS.primaryDark,
                            fontWeight: 900,
                        }}
                    />
                </Stack>

                <Divider />

                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                        sx={{
                            width: 56,
                            height: 56,
                            backgroundColor: "#dbeafe",
                            color: COLORS.primaryDark,
                            fontWeight: 900,
                        }}
                    >
                        {doctor?.fullName?.slice(0, 1) || "BS"}
                    </Avatar>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                                label={doctor?.title || "BS"}
                                size="small"
                                sx={{
                                    height: 22,
                                    backgroundColor: COLORS.primary,
                                    color: "#fff",
                                    fontWeight: 900,
                                }}
                            />
                            <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
                                {doctor?.experienceYears || 0} năm kinh nghiệm
                            </Typography>
                        </Stack>
                        <Typography
                            sx={{
                                color: COLORS.heading,
                                fontWeight: 900,
                                mt: 0.5,
                            }}
                        >
                            {doctor?.fullName || "Chưa chọn bác sĩ"}
                        </Typography>
                        <Typography
                            sx={{
                                color: COLORS.primary,
                                fontSize: 13,
                                fontWeight: 700,
                            }}
                        >
                            {booking.selectedDepartment?.name ||
                                "Chưa chọn chuyên khoa"}
                        </Typography>
                    </Box>
                </Stack>

                <Box
                    sx={{
                        p: 2,
                        backgroundColor: "#f1f5f9",
                        borderRadius: "8px",
                        border: `1px solid ${COLORS.border}`,
                    }}
                >
                    <Stack spacing={1.25}>
                        <SummaryLine
                            icon={<EventAvailableIcon />}
                            label="Ngày khám:"
                            value={booking.selectedDate || "Chưa chọn"}
                        />
                        <SummaryLine
                            icon={<AccessTimeIcon />}
                            label="Khung giờ hẹn:"
                            value={
                                booking.selectedSlot
                                    ? formatTime(booking.selectedSlot.startTime)
                                    : "Chưa chọn"
                            }
                            chip
                        />
                        <SummaryLine
                            icon={<LocationOnOutlinedIcon />}
                            label="Cơ sở y tế:"
                            value="CS1: 124 Nguyễn Du, Q.1, TP.HCM"
                        />
                    </Stack>
                </Box>

                <Stack spacing={1}>
                    <PriceRow
                        label="Phí khám lâm sàng ban đầu:"
                        value="350.000 VNĐ"
                    />
                    <PriceRow
                        label="Phí đặt hẹn trực tuyến:"
                        value="MIỄN PHÍ"
                        success
                    />
                    <PriceRow
                        label="Hỗ trợ BHYT & Bảo hiểm tư:"
                        value="Có áp dụng"
                        chip
                    />
                </Stack>

                <Divider />

                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="baseline"
                >
                    <Typography
                        sx={{
                            color: COLORS.heading,
                            fontWeight: 900,
                            fontSize: 17,
                        }}
                    >
                        Tổng tiền tạm tính:
                    </Typography>
                    <Typography
                        sx={{
                            color: COLORS.primaryDark,
                            fontWeight: 900,
                            fontSize: 25,
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        350.000{" "}
                        <Box component="span" sx={{ fontSize: 13 }}>
                            VNĐ
                        </Box>
                    </Typography>
                </Stack>

                <Button
                    variant="contained"
                    size="large"
                    disabled={!canSubmit || booking.loading.submitting || booking.loading.slots || booking.loading.doctors}
                    onClick={onSubmit}
                    endIcon={
                        booking.loading.submitting ? (
                            <CircularProgress size={18} color="inherit" />
                        ) : (
                            <ArrowForwardIcon />
                        )
                    }
                    sx={{
                        py: 1.4,
                        backgroundColor: COLORS.primary,
                        fontWeight: 900,
                        boxShadow: "0px 8px 18px rgba(25, 118, 210, 0.22)",
                        "&:hover": {
                            backgroundColor: COLORS.primaryDark,
                        },
                    }}
                >
                    Xác Nhận Đặt Lịch Khám
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    sx={{ py: 1.2, fontWeight: 800 }}
                >
                    Quay lại bước trước
                </Button>
            </Stack>
        </PaperCard>
    );
}

function SummaryLine({ icon, label, value, chip }) {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ color: COLORS.primary, display: "flex" }}>{icon}</Box>
            <Typography sx={{ color: COLORS.muted, fontSize: 13, flex: 1 }}>
                {label}
            </Typography>
            {chip ? (
                <Chip
                    label={value}
                    size="small"
                    sx={{
                        backgroundColor: "#fff",
                        color: COLORS.primaryDark,
                        border: `1px solid ${COLORS.primary}`,
                        fontWeight: 900,
                    }}
                />
            ) : (
                <Typography
                    sx={{
                        color: COLORS.heading,
                        fontSize: 13,
                        fontWeight: 800,
                        textAlign: "right",
                    }}
                >
                    {value}
                </Typography>
            )}
        </Stack>
    );
}

function PriceRow({ label, value, success, chip }) {
    return (
        <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography sx={{ color: COLORS.muted, fontSize: 13 }}>
                {label}
            </Typography>
            {chip ? (
                <Chip
                    label={value}
                    size="small"
                    color="primary"
                    variant="outlined"
                />
            ) : (
                <Typography
                    sx={{
                        color: success ? COLORS.green : COLORS.heading,
                        fontSize: 13,
                        fontWeight: 900,
                    }}
                >
                    {value}
                </Typography>
            )}
        </Stack>
    );
}

function formatFileSize(size) {
    if (size >= 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function UploadBox({
    files,
    error,
    onFilesSelected,
    onRemoveFile,
}) {
    const handleDrop = (event) => {
        event.preventDefault();

        if (event.dataTransfer.files.length > 0) {
            onFilesSelected(event.dataTransfer.files);
        }
    };

    return (
        <Stack spacing={1}>
            <Typography sx={{ color: COLORS.heading, fontWeight: 800 }}>
                Đính kèm hồ sơ y tế cũ / Kết quả xét nghiệm / Đơn thuốc trước đây
            </Typography>
            <Box
                component="label"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                sx={{
                    p: 2,
                    border: "1px dashed #80bfff",
                    borderRadius: "10px",
                    backgroundColor: "#f8fbff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    cursor: "pointer",
                    transition: "border-color 0.2s, background-color 0.2s",
                    "&:hover": {
                        borderColor: COLORS.primary,
                        backgroundColor: COLORS.blueSoft,
                    },
                }}
            >
                <Box
                    component="input"
                    type="file"
                    hidden
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={(event) => {
                        onFilesSelected(event.target.files);
                        event.target.value = "";
                    }}
                />
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                        sx={{
                            backgroundColor: COLORS.blueSoft,
                            color: COLORS.primary,
                            borderRadius: "8px",
                        }}
                    >
                        <CloudUploadOutlinedIcon />
                    </Avatar>
                    <Box>
                        <Typography sx={{ color: COLORS.heading, fontWeight: 800 }}>
                            Nhấn để tải lên tập tin hình ảnh hoặc PDF
                        </Typography>
                        <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
                            Hỗ trợ JPG, PNG, PDF dung lượng tối đa 15MB
                        </Typography>
                    </Box>
                </Stack>
                <Button
                    component="span"
                    variant="outlined"
                    size="small"
                    sx={{ flexShrink: 0, fontWeight: 800 }}
                >
                    Chọn tệp tin
                </Button>
            </Box>

            {error ? (
                <Alert severity="error" sx={{ py: 0.5 }}>
                    {error}
                </Alert>
            ) : null}

            {files.length > 0 ? (
                <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ pt: 0.5 }}
                >
                    {files.map((file, index) => (
                        <Chip
                            key={`${file.name}-${file.lastModified}-${index}`}
                            label={`${file.name} (${formatFileSize(file.size)})`}
                            onDelete={() => onRemoveFile(index)}
                            variant="outlined"
                            sx={{
                                maxWidth: "100%",
                                justifyContent: "space-between",
                                "& .MuiChip-label": {
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                },
                            }}
                        />
                    ))}
                </Stack>
            ) : null}
        </Stack>
    );
}

function EmergencyNote() {
    return (
        <Box
            sx={{
                p: 2,
                border: "1px solid #fde68a",
                backgroundColor: COLORS.warningSoft,
                borderRadius: "8px",
            }}
        >
            <Stack direction="row" spacing={1.25}>
                <WarningAmberIcon sx={{ color: COLORS.warning }} />
                <Typography sx={{ color: COLORS.body, fontSize: 13 }}>
                    <Box component="span" sx={{ fontWeight: 900 }}>
                        Khuyến cáo cấp cứu:
                    </Box>{" "}
                    Nếu bạn có triệu chứng nguy kịch như đau thắt ngực dữ dội,
                    khó thở cấp tính, vui lòng liên hệ ngay{" "}
                    <Box component="span" sx={{ color: COLORS.primary, fontWeight: 900 }}>
                        1900 6868
                    </Box>{" "}
                    hoặc đến phòng cấp cứu gần nhất.
                </Typography>
            </Stack>
        </Box>
    );
}

function SupportCard() {
    return (
        <PaperCard>
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                    sx={{
                        backgroundColor: COLORS.blueSoft,
                        color: COLORS.primary,
                    }}
                >
                    <ShieldOutlinedIcon />
                </Avatar>
                <Box>
                    <Typography sx={{ color: COLORS.heading, fontWeight: 800 }}>
                        Cần hỗ trợ đặt hẹn khẩn cấp?
                    </Typography>
                    <Typography sx={{ color: COLORS.muted, fontSize: 13 }}>
                        Tổng đài viên tư vấn chuyên môn:{" "}
                        <Box component="span" sx={{ color: COLORS.primary, fontWeight: 800 }}>
                            1900 6868
                        </Box>{" "}
                        (24/7)
                    </Typography>
                </Box>
            </Stack>
        </PaperCard>
    );
}

function BookingSuccessDialog({
    open,
    appointment,
    onClose,
}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: "16px",
                },
            }}
        >
            <DialogTitle>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                        sx={{
                            backgroundColor: COLORS.greenSoft,
                            color: COLORS.green,
                        }}
                    >
                        <CheckCircleIcon />
                    </Avatar>
                    <Box>
                        <Typography
                            sx={{
                                color: COLORS.heading,
                                fontSize: 20,
                                fontWeight: 900,
                            }}
                        >
                            Đặt lịch khám thành công
                        </Typography>
                        <Typography sx={{ color: COLORS.muted, fontSize: 13 }}>
                            Lịch hẹn của bạn đã được ghi nhận trên hệ thống.
                        </Typography>
                    </Box>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        mt: 1,
                        p: 2,
                        borderRadius: "10px",
                        backgroundColor: "#f8fafc",
                        border: `1px solid ${COLORS.border}`,
                    }}
                >
                    <Stack spacing={1.25}>
                        <PopupRow
                            label="Mã lịch hẹn"
                            value={
                                appointment?.appointmentId
                                    ? `#${appointment.appointmentId}`
                                    : "Đang cập nhật"
                            }
                        />
                        <PopupRow
                            label="Bác sĩ"
                            value={appointment?.doctorName || "Đang cập nhật"}
                        />
                        <PopupRow
                            label="Chuyên khoa"
                            value={
                                appointment?.departmentName ||
                                "Đang cập nhật"
                            }
                        />
                        <PopupRow
                            label="Ngày khám"
                            value={
                                appointment?.appointmentDate?.slice(0, 10) ||
                                "Đang cập nhật"
                            }
                        />
                        <PopupRow
                            label="Giờ khám"
                            value={
                                appointment?.startTime
                                    ? formatTime(appointment.startTime)
                                    : "Đang cập nhật"
                            }
                        />
                        <PopupRow
                            label="Trạng thái"
                            value={appointment?.status || "Pending"}
                        />
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    variant="contained"
                    onClick={onClose}
                    sx={{
                        minWidth: 140,
                        fontWeight: 800,
                        backgroundColor: COLORS.primary,
                        "&:hover": {
                            backgroundColor: COLORS.primaryDark,
                        },
                    }}
                >
                    Đã hiểu
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function PopupRow({
    label,
    value,
}) {
    return (
        <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography sx={{ color: COLORS.muted, fontSize: 14 }}>
                {label}
            </Typography>
            <Typography
                sx={{
                    color: COLORS.heading,
                    fontSize: 14,
                    fontWeight: 800,
                    textAlign: "right",
                }}
            >
                {value}
            </Typography>
        </Stack>
    );
}

function InlineLoading() {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography sx={{ color: COLORS.muted, fontSize: 14 }}>
                Đang tải dữ liệu
            </Typography>
        </Stack>
    );
}

export default BookingPage;
