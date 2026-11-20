import {
    Chip,
    Stack,
} from "@mui/material";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import ClinicPageHeader from "../../../components/common/ClinicPageHeader";
import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import InventoryFilters from "../../../components/internal/medicines/InventoryFilters";
import InventoryStatCards from "../../../components/internal/medicines/InventoryStatCards";
import InventoryTable from "../../../components/internal/medicines/InventoryTable";
import PharmacyModuleTabs from "../../../components/internal/medicines/PharmacyModuleTabs";
import useInventory from "../../../hooks/useInventory";
import useAuth from "../../../hooks/useAuth";

function InventoryPage() {
    const { role } = useAuth();
    const {
        filters,
        inventoryItems,
        pagination,
        summary,
        categories,
        suppliers,
        canFilterCatalog,
        loading,
        error,
        updateFilters,
        resetFilters,
        loadInventory,
    } = useInventory();

    return (
        <>
            <Stack spacing={3}>
                <ClinicPageHeader
                    icon={Inventory2RoundedIcon}
                    eyebrow={role === "Pharmacist" ? "Dược sĩ / Kho thuốc" : "Quản trị / Kho dược & Vật tư"}
                    title="Quản lý tồn kho theo lô thuốc"
                    description="Theo dõi số lô, số lượng tồn và hạn dùng để cảnh báo tồn thấp, hết hạn và chuẩn bị kiểm tra tồn khi bác sĩ kê đơn."
                    badge={
                        <Chip
                            icon={<VerifiedOutlinedIcon fontSize="small" />}
                            label="Chuẩn GSP - FEFO"
                            size="small"
                            sx={{
                                height: 24,
                                color: "#047857",
                                backgroundColor: "#ECFDF5",
                                border: "1px solid #A7F3D0",
                                fontWeight: 700,
                            }}
                        />
                    }
                />

                <PharmacyModuleTabs active="inventory" />

                <InventoryStatCards summary={summary} />

                <InventoryFilters
                    filters={filters}
                    categories={categories}
                    suppliers={suppliers}
                    canFilterCatalog={canFilterCatalog}
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
                ) : !error && (
                    <InventoryTable
                        inventoryItems={inventoryItems}
                        pagination={pagination}
                        filters={filters}
                        onSortChange={updateFilters}
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
