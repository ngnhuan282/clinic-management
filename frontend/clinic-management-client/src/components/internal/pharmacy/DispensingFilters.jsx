import {
    Button,
    MenuItem,
    IconButton,
    Tooltip,
    Paper,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

import { DISPENSING_STATUS_OPTIONS, REVIEW_STATUS_OPTIONS } from "./dispensingStatus";

function DispensingFilters({ filters, onChange, onReset, onRefresh, refreshing, disabled }) {
    const handleChange = (field) => (event) => {
        onChange({
            [field]: event.target.value,
            pageNumber: 1,
        });
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #E5E9F0",
            }}
        >
            <Stack spacing={1.5}>
                <ToggleButtonGroup
                    exclusive
                    disabled={disabled}
                    value={filters.workflowStatus}
                    onChange={(_, value) => {
                        if (value !== null) {
                            onChange({ workflowStatus: value, reviewStatus: "", paymentStatus: "", pageNumber: 1 });
                        }
                    }}
                    size="small"
                    aria-label="Lọc theo trạng thái cấp thuốc"
                    sx={{
                        alignSelf: "flex-start",
                        maxWidth: "100%",
                        overflowX: "auto",
                        "& .MuiToggleButton-root": {
                            px: 2,
                            minHeight: 38,
                            whiteSpace: "nowrap",
                            fontWeight: 800,
                        },
                    }}
                >
                    {DISPENSING_STATUS_OPTIONS.map((option) => (
                        <ToggleButton key={option.value || "all"} value={option.value}>
                            {option.label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>

                <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={1.5}
                    sx={{ alignItems: { xs: "stretch", lg: "center" } }}
                >
                    <TextField
                        value={filters.search}
                        disabled={disabled}
                        onChange={handleChange("search")}
                        placeholder="Tìm mã đơn, tên bệnh nhân hoặc số điện thoại..."
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { "aria-label": "Tìm đơn thuốc" }, input: {
                            startAdornment: <SearchOutlinedIcon fontSize="small" sx={{ mr: 1, color: "#9CA3AF" }} />,
                        } }}
                    />

                    <TextField
                        label="Từ ngày"
                        disabled={disabled}
                        type="date"
                        value={filters.fromDate}
                        onChange={handleChange("fromDate")}
                        size="small"
                        slotProps={{
                            inputLabel: { shrink: true },
                            htmlInput: { max: filters.toDate || undefined },
                        }}
                        sx={{ minWidth: { xs: "100%", lg: 158 } }}
                    />

                    <TextField
                        label="Đến ngày"
                        disabled={disabled}
                        type="date"
                        value={filters.toDate}
                        onChange={handleChange("toDate")}
                        size="small"
                        slotProps={{
                            inputLabel: { shrink: true },
                            htmlInput: { min: filters.fromDate || undefined },
                        }}
                        sx={{ minWidth: { xs: "100%", lg: 158 } }}
                    />

                    <Button
                        variant="outlined"
                        startIcon={<RestartAltOutlinedIcon />}
                        onClick={onReset}
                        disabled={disabled}
                        sx={{
                            minWidth: { xs: "100%", lg: 112 },
                            minHeight: 40,
                            whiteSpace: "nowrap",
                        }}
                    >
                        Đặt lại
                    </Button>
                    <Tooltip title="Tải lại dữ liệu">
                        <span><IconButton aria-label="Tải lại dữ liệu" onClick={onRefresh} disabled={disabled || refreshing}
                            sx={{ width: 42, height: 42, border: "1px solid #E5E9F0", borderRadius: 1, color: "primary.main" }}>
                            <RefreshOutlinedIcon />
                        </IconButton></span>
                    </Tooltip>
                </Stack>
                {filters.workflowStatus === "NeedsReview" && (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <TextField disabled={disabled} select size="small" label="Thanh toán" value={filters.paymentStatus}
                            onChange={handleChange("paymentStatus")} sx={{ flex: 1, minWidth: 0 }}>
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="Paid">Đã thanh toán</MenuItem>
                            <MenuItem value="Unpaid">Chưa thanh toán</MenuItem>
                        </TextField>
                        <TextField disabled={disabled} select size="small" label="Rà soát" value={filters.reviewStatus}
                            onChange={handleChange("reviewStatus")} sx={{ flex: 1, minWidth: 0 }}>
                            <MenuItem value="">Tất cả</MenuItem>
                            {REVIEW_STATUS_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                        </TextField>
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}

export default DispensingFilters;
