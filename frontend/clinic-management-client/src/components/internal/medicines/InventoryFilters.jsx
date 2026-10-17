import { Box, Button, MenuItem, Paper, TextField } from "@mui/material";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

import { INVENTORY_EXPIRY_OPTIONS, INVENTORY_STOCK_LEVEL_OPTIONS } from "./inventoryStatus";

function InventoryFilters({ filters, categories, suppliers, canFilterCatalog, onChange, onReset }) {
    const handleChange = (field) => (event) => {
        onChange({ [field]: event.target.value, pageNumber: 1 });
    };

    return (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #E5E9F0" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(0, 1fr) minmax(260px, 1fr)" }, gap: 1.5 }}>
                <TextField
                    value={filters.search}
                    onChange={handleChange("search")}
                    placeholder="Tìm theo tên thuốc, đơn vị, mô tả..."
                    size="small"
                    fullWidth
                    slotProps={{
                        htmlInput: { "aria-label": "Tìm thuốc", maxLength: 200 },
                        input: { startAdornment: <SearchOutlinedIcon fontSize="small" sx={{ mr: 1, color: "#9CA3AF" }} /> },
                    }}
                />
                <TextField select label="Danh mục" value={filters.categoryId} onChange={handleChange("categoryId")} size="small" fullWidth disabled={!canFilterCatalog}>
                    <MenuItem value="">Tất cả danh mục</MenuItem>
                    {categories.map((category) => (
                        <MenuItem key={category.categoryId} value={category.categoryId}>{category.categoryName}</MenuItem>
                    ))}
                </TextField>
                <TextField select label="Nhà cung cấp" value={filters.supplierId} onChange={handleChange("supplierId")} size="small" fullWidth disabled={!canFilterCatalog}>
                    <MenuItem value="">Tất cả NCC</MenuItem>
                    {suppliers.map((supplier) => (
                        <MenuItem key={supplier.supplierId} value={supplier.supplierId}>{supplier.supplierName}</MenuItem>
                    ))}
                </TextField>
                <TextField label="Số lô" value={filters.batchNumber} onChange={handleChange("batchNumber")} size="small" fullWidth slotProps={{ htmlInput: { maxLength: 50 } }} />
                <TextField select label="Lượng tồn" value={filters.stockLevel} onChange={handleChange("stockLevel")} size="small" fullWidth>
                    {INVENTORY_STOCK_LEVEL_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </TextField>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(0, 1fr) auto" }, gap: 1.5, minWidth: 0 }}>
                    <TextField select label="Hạn dùng" value={filters.expiryStatus} onChange={handleChange("expiryStatus")} size="small" fullWidth>
                        {INVENTORY_EXPIRY_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                    </TextField>
                    <Button variant="outlined" startIcon={<RestartAltOutlinedIcon />} onClick={onReset} sx={{ minWidth: 112, minHeight: 40, whiteSpace: "nowrap" }}>
                        Đặt lại
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
}

export default InventoryFilters;
