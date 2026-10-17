import { Box, Button, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { FilterListOutlined, RefreshOutlined, RestartAltOutlined, SearchOutlined } from "@mui/icons-material";
import { clinicButtonSx, clinicColors, clinicFieldSx, clinicSecondaryButtonSx, clinicSurfaceSx } from "../../common/clinicUi";

const statusOptions = [{ value: "", label: "Tất cả trạng thái" }, { value: "active", label: "Đang áp dụng" }, { value: "inactive", label: "Tạm ngưng" }];
const sortOptions = [{ value: "name", label: "Theo tên bệnh" }, { value: "code", label: "Theo mã bệnh" }];
const sortOrderOptions = [{ value: "asc", label: "Tăng dần" }, { value: "desc", label: "Giảm dần" }];

export default function DiseaseFilters({ filters, onChange, onReset, onRefresh, loading }) {
    const handleChange = field => event => onChange({ [field]: event.target.value, pageNumber: 1 });
    return <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}><FilterListOutlined sx={{ fontSize: 18, color: clinicColors.muted }} /><Typography sx={{ fontSize: 14, fontWeight: 600 }}>Bộ lọc danh mục bệnh</Typography></Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1.7fr 1fr 1fr 1fr" }, gap: 1.5 }}>
            <TextField fullWidth size="small" label="Tìm bệnh" placeholder="Mã bệnh, tên bệnh hoặc mô tả" value={filters.search} onChange={handleChange("search")} sx={clinicFieldSx} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 20, color: "#94A3B8" }} /></InputAdornment> } }} />
            <TextField fullWidth select size="small" label="Trạng thái" value={filters.status} onChange={handleChange("status")} sx={clinicFieldSx}>{statusOptions.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>
            <TextField fullWidth select size="small" label="Sắp xếp" value={filters.sortBy} onChange={handleChange("sortBy")} sx={clinicFieldSx}>{sortOptions.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>
            <TextField fullWidth select size="small" label="Thứ tự" value={filters.sortOrder} onChange={handleChange("sortOrder")} sx={clinicFieldSx}>{sortOrderOptions.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "flex-end", mt: 2 }}>
            <Button startIcon={<RestartAltOutlined />} onClick={onReset} sx={clinicButtonSx}>Đặt lại bộ lọc</Button>
            <Button variant="outlined" startIcon={<RefreshOutlined />} onClick={onRefresh} disabled={loading} sx={clinicSecondaryButtonSx}>Làm mới dữ liệu</Button>
        </Stack>
    </Paper>;
}
