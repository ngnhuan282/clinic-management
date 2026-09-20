import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import ConfirmDialog from "../../../components/common/ConfirmDialog";
import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import MedicineCategoriesTable from "../../../components/internal/medicines/MedicineCategoriesTable";
import MedicineCategoryFilters from "../../../components/internal/medicines/MedicineCategoryFilters";
import MedicineCategoryFormDialog from "../../../components/internal/medicines/MedicineCategoryFormDialog";
import MedicineCategoryStatCards from "../../../components/internal/medicines/MedicineCategoryStatCards";
import PharmacyModuleTabs from "../../../components/internal/medicines/PharmacyModuleTabs";
import useMedicineCategories from "../../../hooks/useMedicineCategories";

function MedicineCategoriesPage() {
    const {
        filters,
        categories,
        pagination,
        summary,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadCategories,
        saveCategory,
        removeCategory,
    } = useMedicineCategories();

    const [formOpen, setFormOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] =
        useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleCreate = () => {
        setActionError("");
        setSuccessMessage("");
        setSelectedCategory(null);
        setFormOpen(true);
    };

    const handleEdit = (category) => {
        setActionError("");
        setSuccessMessage("");
        setSelectedCategory(category);
        setFormOpen(true);
    };

    const handleSaveCategory = async (
        payload,
        categoryId = null
    ) => {
        await saveCategory(payload, categoryId);
        setSuccessMessage(
            categoryId
                ? "Đã cập nhật danh mục thuốc thành công."
                : "Đã thêm danh mục thuốc thành công."
        );
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        setActionError("");
        setSuccessMessage("");

        try {
            await removeCategory(deleteTarget.categoryId);
            setDeleteTarget(null);
            setSuccessMessage(
                "Đã xóa danh mục thuốc thành công."
            );
        } catch (err) {
            setActionError(err.message);
        }
    };

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
                                    label="Chuẩn GPP"
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
                                Danh mục phân loại thuốc
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
                                Quản lý nhóm thuốc dùng trong danh
                                mục thuốc, lọc dữ liệu kê đơn và
                                thống kê tồn kho.
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={
                                <AddCircleOutlineOutlinedIcon />
                            }
                            onClick={handleCreate}
                            sx={{
                                minWidth: "auto",
                                height: 42,
                                px: 2.25,
                                flexShrink: 0,
                                alignSelf: {
                                    xs: "flex-start",
                                    md: "center",
                                },
                                ml: { md: "auto" },
                                whiteSpace: "nowrap",
                                fontWeight: 800,
                                boxShadow:
                                    "0 8px 18px rgba(25, 118, 210, 0.18)",
                            }}
                        >
                            Thêm danh mục mới
                        </Button>
                    </Stack>
                </Paper>

                <PharmacyModuleTabs active="categories" />

                <MedicineCategoryStatCards summary={summary} />

                <MedicineCategoryFilters
                    filters={filters}
                    onChange={updateFilters}
                    onReset={resetFilters}
                />

                {actionError && (
                    <Alert
                        severity="error"
                        onClose={() => setActionError("")}
                    >
                        {actionError}
                    </Alert>
                )}

                {error && (
                    <ErrorState
                        message={error}
                        onRetry={loadCategories}
                    />
                )}

                {loading ? (
                    <Loading />
                ) : (
                    <MedicineCategoriesTable
                        categories={categories}
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
                        onEdit={handleEdit}
                        onDelete={setDeleteTarget}
                    />
                )}

                <MedicineCategoryFormDialog
                    key={`${formOpen}-${selectedCategory ? JSON.stringify(selectedCategory) : "new"}`}
                    open={formOpen}
                    category={selectedCategory}
                    saving={saving}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleSaveCategory}
                />

                <ConfirmDialog
                    open={Boolean(deleteTarget)}
                    title="Xóa danh mục thuốc"
                    message={
                        deleteTarget
                            ? `Bạn có chắc muốn xóa danh mục "${deleteTarget.categoryName}"? Chỉ xóa được danh mục chưa có thuốc.`
                            : ""
                    }
                    confirmText="Xóa danh mục"
                    cancelText="Hủy"
                    loading={saving}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />

                <Snackbar
                    open={Boolean(successMessage)}
                    autoHideDuration={3000}
                    onClose={() => setSuccessMessage("")}
                    anchorOrigin={{
                        vertical: "top",
                        horizontal: "right",
                    }}
                >
                    <Alert
                        severity="success"
                        variant="filled"
                        onClose={() => setSuccessMessage("")}
                        sx={{ width: "100%" }}
                    >
                        {successMessage}
                    </Alert>
                </Snackbar>
            </Stack>
        </>
    );
}

export default MedicineCategoriesPage;
