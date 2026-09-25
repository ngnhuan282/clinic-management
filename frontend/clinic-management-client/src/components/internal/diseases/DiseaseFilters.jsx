import {
    Button,
    MenuItem,
    Paper,
    Stack,
    TextField,
} from "@mui/material";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const STATUS_OPTIONS = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "active", label: "Đang áp dụng" },
    { value: "inactive", label: "Tạm ngưng" },
];

const SORT_OPTIONS = [
    { value: "name", label: "Sắp xếp theo tên" },
    { value: "code", label: "Sắp xếp theo mã bệnh" },
];

const SORT_ORDER_OPTIONS = [
    { value: "asc", label: "Tăng dần" },
    { value: "desc", label: "Giảm dần" },
];

function DiseaseFilters({
    filters,
    onChange,
    onReset,
}) {
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
                backgroundColor: "#FFFFFF",
            }}
        >
            <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", lg: "center" }}
            >
                <TextField
                    value={filters.search}
                    onChange={handleChange("search")}
                    placeholder="Tìm theo mã bệnh, tên bệnh hoặc mô tả..."
                    size="small"
                    sx={{ flex: 1 }}
                    InputProps={{
                        startAdornment: (
                            <SearchOutlinedIcon
                                fontSize="small"
                                sx={{ mr: 1, color: "#9CA3AF" }}
                            />
                        ),
                    }}
                />

                <TextField
                    select
                    label="Trạng thái"
                    value={filters.status}
                    onChange={handleChange("status")}
                    size="small"
                    sx={{ minWidth: { xs: "100%", lg: 180 } }}
                >
                    {STATUS_OPTIONS.map((option) => (
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
                    label="Sắp xếp"
                    value={filters.sortBy}
                    onChange={handleChange("sortBy")}
                    size="small"
                    sx={{ minWidth: { xs: "100%", lg: 190 } }}
                >
                    {SORT_OPTIONS.map((option) => (
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
                    label="Thứ tự"
                    value={filters.sortOrder}
                    onChange={handleChange("sortOrder")}
                    size="small"
                    sx={{ minWidth: { xs: "100%", lg: 150 } }}
                >
                    {SORT_ORDER_OPTIONS.map((option) => (
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
                    startIcon={<RestartAltOutlinedIcon />}
                    onClick={onReset}
                    sx={{
                        minWidth: { xs: "100%", lg: 112 },
                        minHeight: 40,
                        px: 2,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                    }}
                >
                    Đặt lại
                </Button>
            </Stack>
        </Paper>
    );
}

export default DiseaseFilters;
