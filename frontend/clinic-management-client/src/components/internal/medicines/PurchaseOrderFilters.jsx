import {
    Button,
    MenuItem,
    Paper,
    Stack,
    TextField,
} from "@mui/material";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

import { PURCHASE_ORDER_STATUS_OPTIONS } from "./purchaseOrderStatus";

function PurchaseOrderFilters({
    filters,
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
                direction={{ xs: "column", lg: "row" }}
                spacing={1.5}
                sx={{
                    alignItems: { xs: "stretch", lg: "center" },
                }}
            >
                <TextField
                    value={filters.search}
                    onChange={handleChange("search")}
                    placeholder="Tìm theo mã phiếu hoặc nhà cung cấp..."
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
                    select
                    label="Nhà cung cấp"
                    value={filters.supplierId}
                    onChange={handleChange("supplierId")}
                    size="small"
                    sx={{ minWidth: { xs: "100%", lg: 210 } }}
                >
                    <MenuItem value="">Tất cả nhà cung cấp</MenuItem>
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
                    value={filters.status}
                    onChange={handleChange("status")}
                    size="small"
                    sx={{ minWidth: { xs: "100%", lg: 170 } }}
                >
                    {PURCHASE_ORDER_STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>

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

export default PurchaseOrderFilters;
