import {
    Box,
    Chip,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import InventoryFilters from "../../../components/internal/medicines/InventoryFilters";
import InventoryStatCards from "../../../components/internal/medicines/InventoryStatCards";
import InventoryTable from "../../../components/internal/medicines/InventoryTable";
import PharmacyModuleTabs from "../../../components/internal/medicines/PharmacyModuleTabs";
import useInventory from "../../../hooks/useInventory";

function InventoryPage() {
    const {
        filters,
        inventoryItems,
        pagination,
        summary,
        categories,
        suppliers,
        loading,
        error,
        updateFilters,
        resetFilters,
        loadInventory,
    } = useInventory();

    return (
        <>
            <Stack spacing={3}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 3.5 },
                        borderRadius: 2,
                        border: "1px solid #E5E9F0",
                        backgroundColor: "#FFFFFF",
                    }}
                >
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        alignItems={{
                            xs: "flex-start",
                            md: "center",
                        }}
                        justifyContent="space-between"
                        gap={2}
                        sx={{ width: "100%" }}
                    >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                flexWrap="wrap"
                                useFlexGap
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "#6B7280",
                                        fontWeight: 700,
                                    }}
                                >
                                    Quản trị / Kho dược & Vật tư
                                </Typography>

                                <Chip
                                    icon={
                                        <VerifiedOutlinedIcon fontSize="small" />
                                    }
                                    label="Chuẩn GSP - FEFO"
                                    size="small"
                                    sx={{
                                        height: 24,
                                        color: "#047857",
                                        backgroundColor: "#ECFDF5",
                                        border:
                                            "1px solid #A7F3D0",
                                        fontWeight: 700,
                                    }}
                                />
                            </Stack>

                            <Typography
                                variant="h4"
                                sx={{
                                    mt: 1.5,
                                    color: "#111827",
                                    fontWeight: 800,
                                    lineHeight: 1.25,
                                }}
                            >
                                Quản lý tồn kho theo lô thuốc
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 1,
                                    maxWidth: 820,
                                    color: "#6B7280",
                                    lineHeight: 1.7,
                                }}
                            >
                                Theo dõi số lô, số lượng tồn và hạn dùng
                                để cảnh báo tồn thấp, hết hạn và chuẩn bị
                                kiểm tra tồn khi bác sĩ kê đơn.
                            </Typography>
                        </Box>

                    </Stack>
                </Paper>

                <PharmacyModuleTabs active="inventory" />

                <InventoryStatCards summary={summary} />

                <InventoryFilters
                    filters={filters}
                    categories={categories}
                    suppliers={suppliers}
                    onChange={updateFilters}
                    onReset={resetFilters}
                />

                {error && (
                    <ErrorState
                        message={error}
                        onRetry={loadInventory}
                    />
                )}

                {loading ? (
                    <Loading />
                ) : (
                    <InventoryTable
                        inventoryItems={inventoryItems}
                        pagination={pagination}
                        filters={filters}
                        onPageChange={(pageNumber) =>
                            updateFilters({ pageNumber })
                        }
                        onPageSizeChange={(pageSize) =>
                            updateFilters({
                                pageSize,
                                pageNumber: 1,
                            })
                        }
                    />
                )}
            </Stack>
        </>
    );
}

export default InventoryPage;
