import { Box, Button, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import {
    AdminFilterIcon,
    AdminRefreshIcon,
    AdminResetIcon,
    AdminSearchIcon,
    adminFilterCardSx,
    clinicColors,
    clinicFieldSx,
    clinicResetButtonSx,
    clinicSecondaryButtonSx,
} from "../../common/clinicUi";

const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "active", label: "Đang áp dụng" },
    { value: "inactive", label: "Tạm ngưng" },
];
const sortOptions = [
    { value: "name", label: "Theo tên bệnh" },
    { value: "code", label: "Theo mã bệnh" },
];
const sortOrderOptions = [
    { value: "asc", label: "Tăng dần" },
    { value: "desc", label: "Giảm dần" },
];

export default function DiseaseFilters({ filters, onChange, onReset, onRefresh, loading }) {
    const handleChange = (field) => (event) =>
        onChange({ [field]: event.target.value, pageNumber: 1 });

    return (
        <Paper variant="outlined" sx={adminFilterCardSx}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.75 }}>
                <AdminFilterIcon sx={{ fontSize: 19, color: clinicColors.primary }} />
                <Typography sx={{ fontSize: 14.5, fontWeight: 750, color: clinicColors.heading }}>
                    Bộ lọc danh mục bệnh
                </Typography>
            </Stack>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1.8fr 1fr 1fr 1fr" },
                    gap: 1.5,
                }}
            >
                <TextField
                    fullWidth
                    size="small"
                    label="Tìm bệnh"
                    placeholder="Mã bệnh, tên bệnh hoặc mô tả"
                    value={filters.search}
                    onChange={handleChange("search")}
                    sx={clinicFieldSx}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AdminSearchIcon sx={{ fontSize: 20, color: "#64748B" }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <TextField
                    fullWidth
                    select
                    size="small"
                    label="Trạng thái"
                    value={filters.status}
                    onChange={handleChange("status")}
                    sx={clinicFieldSx}
                >
                    {statusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    fullWidth
                    select
                    size="small"
                    label="Sắp xếp"
                    value={filters.sortBy}
                    onChange={handleChange("sortBy")}
                    sx={clinicFieldSx}
                >
                    {sortOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    fullWidth
                    select
                    size="small"
                    label="Thứ tự"
                    value={filters.sortOrder}
                    onChange={handleChange("sortOrder")}
                    sx={clinicFieldSx}
                >
                    {sortOrderOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                sx={{ justifyContent: "flex-end", mt: 2 }}
            >
                <Button
                    variant="outlined"
                    startIcon={<AdminResetIcon />}
                    onClick={onReset}
                    sx={clinicResetButtonSx}
                >
                    Đặt lại bộ lọc
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<AdminRefreshIcon />}
                    onClick={onRefresh}
                    disabled={loading}
                    sx={clinicSecondaryButtonSx}
                >
                    Làm mới dữ liệu
                </Button>
            </Stack>
        </Paper>
    );
}
