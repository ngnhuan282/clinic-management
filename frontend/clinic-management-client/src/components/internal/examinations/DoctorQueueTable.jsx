import {
    Avatar,
    Box,
    Button,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
    getExaminationStatus,
    normalizeExaminationStatus,
} from "./examinationStatus";

function getActionConfig(status) {
    const normalizedStatus = normalizeExaminationStatus(status);

    if (normalizedStatus === "inProgress") {
        return {
            label: "Tiếp tục khám",
            color: "primary",
            variant: "contained",
        };
    }

    if (normalizedStatus === "priority") {
        return {
            label: "Vào khám ngay",
            color: "error",
            variant: "contained",
        };
    }

    if (normalizedStatus === "completed") {
        return {
            label: "Hồ sơ",
            color: "primary",
            variant: "outlined",
            icon: <VisibilityOutlinedIcon />,
        };
    }

    return {
        label: "Bắt đầu khám",
        color: "success",
        variant: "contained",
    };
}

function DoctorQueueTable({
    appointments,
    pagination,
    onPageChange,
    onPageSizeChange,
    onClinicalAction,
    clinicalActionLoadingId = null,
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                overflow: "hidden",
                border: "1px solid #E5E9F0",
                borderRadius: 2,
                backgroundColor: "#FFFFFF",
            }}
        >
            <TableContainer>
                <Table
                    aria-label="Danh sách lịch khám bệnh"
                    sx={{
                        minWidth: 1040,
                        "& thead .MuiTableCell-root": {
                            fontWeight: 600,
                        },
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" sx={{ width: 110 }}>
                                STT - Giờ
                            </TableCell>
                            <TableCell align="center">
                                Bệnh nhân
                            </TableCell>
                            <TableCell align="center">
                                Liên hệ
                            </TableCell>
                            <TableCell align="center">
                                Lý do khám - Triệu chứng
                            </TableCell>
                            <TableCell align="center">
                                Trạng thái
                            </TableCell>
                            <TableCell
                                align="center"
                                sx={{ width: 180 }}
                            >
                                Thao tác
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {appointments.map((appointment) => {
                            const normalizedStatus =
                                normalizeExaminationStatus(
                                    appointment.status
                                );
                            const status =
                                getExaminationStatus(
                                    appointment.status
                                );
                            const action =
                                getActionConfig(appointment.status);
                            const isClinicalActionLoading =
                                clinicalActionLoadingId ===
                                appointment.appointmentId;
                            const isStartAction =
                                normalizedStatus === "waiting" ||
                                normalizedStatus === "priority";
                            const isStartBlocked =
                                isStartAction &&
                                appointment.canStartExamination === false;
                            const rowTint = normalizedStatus ===
                                "priority"
                                ? "#FFF7F7"
                                : normalizedStatus === "inProgress"
                                    ? "#F1F7FF"
                                    : "#FFFFFF";

                            return (
                                <TableRow
                                    key={appointment.appointmentId}
                                    hover
                                    sx={{
                                        height: 78,
                                        bgcolor: rowTint,
                                        "&:hover": {
                                            bgcolor:
                                                normalizedStatus ===
                                                "priority"
                                                    ? "#FEF2F2"
                                                    : "#F8FAFC",
                                        },
                                    }}
                                >
                                    <TableCell align="center">
                                        <Stack spacing={0.5} alignItems="center">
                                            <Typography
                                                sx={{
                                                    color:
                                                        normalizedStatus ===
                                                        "priority"
                                                            ? "#DC2626"
                                                            : "#005DAC",
                                                    fontWeight: 500,
                                                    fontVariantNumeric:
                                                        "tabular-nums",
                                                }}
                                            >
                                                {appointment.queueNumber}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 500,
                                                    fontVariantNumeric:
                                                        "tabular-nums",
                                                }}
                                            >
                                                {appointment.time}
                                            </Typography>
                                        </Stack>
                                    </TableCell>

                                    <TableCell>
                                        <Stack
                                            direction="row"
                                            spacing={1.5}
                                            alignItems="center"
                                        >
                                            <Avatar
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    bgcolor:
                                                        appointment.avatarColor,
                                                    color:
                                                        appointment.avatarTextColor ||
                                                        "#FFFFFF",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {appointment.initials}
                                            </Avatar>

                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: "#111827",
                                                    }}
                                                >
                                                    {
                                                        appointment.patientName
                                                    }
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Mã: {appointment.patientCode}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color:
                                                    normalizedStatus ===
                                                    "priority"
                                                        ? "#DC2626"
                                                        : "#2563EB",
                                                fontWeight: 500,
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                            }}
                                        >
                                            {appointment.phone}
                                        </Typography>
                                    </TableCell>

                                    <TableCell sx={{ maxWidth: 250 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color:
                                                    normalizedStatus ===
                                                    "priority"
                                                        ? "#DC2626"
                                                        : "#374151",
                                                fontWeight: 600,
                                                lineHeight: 1.45,
                                            }}
                                        >
                                            {appointment.reason}
                                        </Typography>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: status.color,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {status.label}
                                        </Typography>
                                    </TableCell>

                                    <TableCell
                                        align="center"
                                        sx={{ width: 180 }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            justifyContent="center"
                                            sx={{ width: "100%" }}
                                        >
                                            <Button
                                                variant={action.variant}
                                                color={action.color}
                                                size="small"
                                                startIcon={
                                                    action.icon || (
                                                        <PlayArrowRoundedIcon />
                                                    )
                                                }
                                                disabled={
                                                    isClinicalActionLoading ||
                                                    isStartBlocked
                                                }
                                                onClick={() =>
                                                    onClinicalAction(
                                                        appointment
                                                    )
                                                }
                                                sx={{
                                                    width: 148,
                                                    minHeight: 36,
                                                    px: 1,
                                                    whiteSpace: "nowrap",
                                                    fontWeight: 600,
                                                    "& .MuiButton-startIcon": {
                                                        mr: 0.75,
                                                    },
                                                }}
                                            >
                                                {isClinicalActionLoading
                                                    ? "Đang mở..."
                                                    : isStartBlocked
                                                        ? "Ngoài ngày khám"
                                                        : action.label}
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={pagination.totalItems}
                page={pagination.pageNumber - 1}
                rowsPerPage={pagination.pageSize}
                rowsPerPageOptions={[7, 10, 20]}
                labelRowsPerPage="Số ca/trang"
                labelDisplayedRows={({ from, to, count }) =>
                    `Hiển thị ${from}-${to} trong tổng số ${count} lượt khám`
                }
                onPageChange={(_, page) => onPageChange(page + 1)}
                onRowsPerPageChange={(event) =>
                    onPageSizeChange(Number(event.target.value))
                }
            />
        </Paper>
    );
}

export default DoctorQueueTable;
