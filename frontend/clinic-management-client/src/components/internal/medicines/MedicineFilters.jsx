import {
    Button,
    MenuItem,
    Paper,
    Stack,
    TextField,
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";

import { STOCK_STATUS_OPTIONS } from "./medicineStatus";

function MedicineFilters({
    filters,
    categories,
    suppliers,
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
                    placeholder="Tìm theo tên thuốc, đơn vị, mô tả..."
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
                    label="Danh mục"
                    value={filters.categoryId}
                    onChange={handleChange("categoryId")}
                    size="small"
                    sx={{ minWidth: { xs: "100%", md: 210 } }}
                >
                    <MenuItem value="">Tất cả danh mục</MenuItem>
                    {categories.map((category) => (
                        <MenuItem
                            key={category.categoryId}
                            value={category.categoryId}
                        >
                            {category.categoryName}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Nhà cung cấp"
                    value={filters.supplierId}
                    onChange={handleChange("supplierId")}
                    size="small"
                    sx={{ minWidth: { xs: "100%", md: 210 } }}
                >
                    <MenuItem value="">Tất cả NCC</MenuItem>
                    {suppliers.map((supplier) => (
                        <MenuItem
                            key={supplier.supplierId}
                            value={supplier.supplierId}
                        >
                            {supplier.supplierName}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Trạng thái"
                    value={filters.stockStatus}
                    onChange={handleChange("stockStatus")}
                    size="small"
                    sx={{ minWidth: { xs: "100%", md: 190 } }}
                >
                    {STOCK_STATUS_OPTIONS.map((option) => (
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

export default MedicineFilters;
