import {
    Box,
    Button,
    MenuItem,
    Paper,
    Stack,
    TextField,
} from "@mui/material";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const FILTER_OPTIONS = [
    {
        value: "all",
        label: "Tất cả trạng thái",
    },
    {
        value: "waiting",
        label: "Đang chờ khám",
    },
    {
        value: "inProgress",
        label: "Đang khám",
    },
    {
        value: "completed",
        label: "Đã hoàn tất",
    },
    {
        value: "absent",
        label: "Vắng mặt",
    },
];

const SHIFT_OPTIONS = [
    {
        value: "all",
        label: "Tất cả giờ",
    },
    {
        value: "morning",
        label: "Sáng",
    },
    {
        value: "afternoon",
        label: "Chiều",
    },
];

function addDays(value, days) {
    const date = new Date(value);
    date.setDate(date.getDate() + days);

    return date;
}

function formatDateInput(value) {
    const date = value instanceof Date
        ? value
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split("-").map(Number);

    if (!year || !month || !day) {
        return null;
    }

    return new Date(year, month - 1, day);
}

function isSameDate(left, right) {
    return left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate();
}

function DoctorQueueFilters({
    filters,
    onChange,
    onReset,
}) {
    const dateLabel = isSameDate(filters.date, new Date())
        ? "Hôm nay"
        : "Ngày khám";

    const dateInputValue = formatDateInput(filters.date);

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                border: "1px solid #E5E9F0",
                borderRadius: 2,
                backgroundColor: "#FFFFFF",
            }}
        >
            <Stack spacing={2}>
                <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", lg: "center" }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        sx={{
                            minHeight: 44,
                            px: 0.75,
                            borderRadius: 1.5,
                            bgcolor: "#F8FAFC",
                            border: "1px solid #E5E9F0",
                        }}
                    >
                        <Button
                            aria-label="Ngày trước"
                            size="small"
                            onClick={() =>
                                onChange({
                                    date: addDays(filters.date, -1),
                                })
                            }
                            sx={{ minWidth: 34, px: 0 }}
                        >
                            <ChevronLeftOutlinedIcon fontSize="small" />
                        </Button>

                        <Box
                            sx={{
                                width: 160,
                                minHeight: 40,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                            }}
                        >
                            <Box
                                sx={{
                                    mb: 0.25,
                                    color: "#6B7280",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    lineHeight: 1,
                                    textAlign: "center",
                                }}
                            >
                                {dateLabel}
                            </Box>

                            <Box
                                component="input"
                                type="date"
                                value={dateInputValue}
                                onChange={(event) => {
                                    const selectedDate =
                                        parseDateInput(event.target.value);

                                    if (selectedDate) {
                                        onChange({ date: selectedDate });
                                    }
                                }}
                                aria-label="Chon ngay kham"
                                sx={{
                                    width: "100%",
                                    p: 0,
                                    border: 0,
                                    outline: 0,
                                    color: "#111827",
                                    bgcolor: "transparent",
                                    textAlign: "center",
                                    fontFamily: "inherit",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    fontVariantNumeric: "tabular-nums",
                                    "&:focus": {
                                        outline: "none",
                                    },
                                    "&::-webkit-calendar-picker-indicator": {
                                        cursor: "pointer",
                                        opacity: 0.75,
                                    },
                                }}
                            />
                        </Box>

                        <Button
                            aria-label="Ngày sau"
                            size="small"
                            onClick={() =>
                                onChange({
                                    date: addDays(filters.date, 1),
                                })
                            }
                            sx={{ minWidth: 34, px: 0 }}
                        >
                            <ChevronRightOutlinedIcon fontSize="small" />
                        </Button>
                    </Stack>

                    <TextField
                        value={filters.search}
                        onChange={(event) =>
                            onChange({
                                search: event.target.value,
                            })
                        }
                        placeholder="Tìm theo tên bệnh nhân, SĐT, mã BN hoặc STT"
                        size="small"
                        sx={{ flex: 1 }}
                        InputProps={{
                            startAdornment: (
                                <SearchOutlinedIcon
                                    fontSize="small"
                                    sx={{
                                        mr: 1,
                                        color: "#6B7280",
                                    }}
                                />
                            ),
                        }}
                    />

                    <TextField
                        select
                        value={filters.shift}
                        onChange={(event) =>
                            onChange({ shift: event.target.value })
                        }
                        size="small"
                        sx={{ minWidth: 140 }}
                    >
                        {SHIFT_OPTIONS.map((option) => (
                            <MenuItem
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        value={filters.status || "all"}
                        onChange={(event) =>
                            onChange({
                                status: event.target.value === "all"
                                    ? ""
                                    : event.target.value,
                            })
                        }
                        size="small"
                        sx={{ minWidth: 220 }}
                    >
                        {FILTER_OPTIONS.map((option) => (
                            <MenuItem
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button
                        variant="outlined"
                        startIcon={<RefreshOutlinedIcon />}
                        onClick={onReset}
                        sx={{
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                        }}
                    >
                        Đặt lại
                    </Button>
                </Stack>

            </Stack>
        </Paper>
    );
}

export default DoctorQueueFilters;
