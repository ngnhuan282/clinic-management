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
    { value: "InUse", label: "Đang áp dụng" },
    { value: "Empty", label: "Chưa có thuốc" },
];

function MedicineCategoryFilters({
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
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", md: "center" }}
            >
                <TextField
                    value={filters.search}
                    onChange={handleChange("search")}
                    placeholder="Tìm theo tên danh mục hoặc mã danh mục..."
                    size="small"
                    fullWidth
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
                    value={filters.usageStatus}
                    onChange={handleChange("usageStatus")}
                    size="small"
                    sx={{ minWidth: { xs: "100%", md: 220 } }}
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

                <Button
                    variant="outlined"
                    startIcon={<RestartAltOutlinedIcon />}
                    onClick={onReset}
                    sx={{
                        minWidth: { xs: "100%", md: 112 },
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

export default MedicineCategoryFilters;
