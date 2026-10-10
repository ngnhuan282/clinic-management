import {
    Button,
    Paper,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

import { DISPENSING_STATUS_OPTIONS } from "./dispensingStatus";

function DispensingFilters({ filters, onChange, onReset }) {
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
                    value={filters.workflowStatus}
                    onChange={(_, value) => {
                        if (value !== null) {
                            onChange({ workflowStatus: value, pageNumber: 1 });
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
                        onChange={handleChange("search")}
                        placeholder="Tìm mã đơn, tên bệnh nhân hoặc số điện thoại..."
                        size="small"
                        fullWidth
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <SearchOutlinedIcon
                                        fontSize="small"
                                        sx={{ mr: 1, color: "#9CA3AF" }}
                                    />
                                ),
                            },
                        }}
                    />

                    <TextField
                        label="Từ ngày"
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
                        sx={{
                            minWidth: { xs: "100%", lg: 112 },
                            minHeight: 40,
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

export default DispensingFilters;
