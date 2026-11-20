import {
    AddRounded,
    CancelOutlined,
    CheckCircleOutlineRounded,
    DeleteOutlineRounded,
    DownloadRounded,
    EditRounded,
    LockOpenRounded,
    LockOutlined,
    RefreshRounded,
    RestartAltRounded,
    SearchRounded,
    TuneRounded,
    UploadFileRounded,
    VisibilityOffRounded,
    VisibilityRounded,
} from "@mui/icons-material";

// Unified single icon set across all internal admin & staff modules:
// - CRUD: Xem / Thêm / Sửa / Xóa
// - Filter & Transfer: Tìm kiếm / Làm mới / Đặt lại / Xuất / Nhập
// - State: Xác nhận / Hủy / Khóa / Mở khóa
export {
    VisibilityRounded as AdminViewIcon,
    VisibilityOffRounded as AdminHideIcon,
    AddRounded as AdminAddIcon,
    EditRounded as AdminEditIcon,
    DeleteOutlineRounded as AdminDeleteIcon,
    SearchRounded as AdminSearchIcon,
    RefreshRounded as AdminRefreshIcon,
    RestartAltRounded as AdminResetIcon,
    TuneRounded as AdminFilterIcon,
    DownloadRounded as AdminExportIcon,
    UploadFileRounded as AdminImportIcon,
    LockOutlined as AdminLockIcon,
    LockOpenRounded as AdminUnlockIcon,
    CancelOutlined as AdminCancelIcon,
    CheckCircleOutlineRounded as AdminConfirmIcon,
};

export const ADMIN_PAGE_SIZE_OPTIONS = [5, 10, 20];

export const clinicColors = {
    heading: "#0A2540",
    body: "#1E293B",
    muted: "#475569",
    primary: "#0B4F8A",
    primaryDark: "#083A66",
    primarySoft: "#E8F2FC",
    border: "#D4E1EE",
    subtle: "#F3F7FB",
    canvas: "#F3F7FB",
};

// Multi-color semantic accents for admin stat cards, badges & indicators
// while keeping Deep Blue (#0B4F8A) as the primary brand color.
export const adminAccents = {
    blue: {
        main: "#0B4F8A",
        soft: "#E8F2FC",
        border: "#BFDBFE",
        text: "#083A66",
    },
    sky: {
        main: "#0284C7",
        soft: "#E0F2FE",
        border: "#BAE6FD",
        text: "#075985",
    },
    emerald: {
        main: "#059669",
        soft: "#ECFDF5",
        border: "#A7F3D0",
        text: "#065F46",
    },
    amber: {
        main: "#D97706",
        soft: "#FFFBEB",
        border: "#FDE68A",
        text: "#92400E",
    },
    purple: {
        main: "#7C3AED",
        soft: "#F5F3FF",
        border: "#DDD6FE",
        text: "#5B21B6",
    },
    teal: {
        main: "#0D9488",
        soft: "#F0FDFA",
        border: "#99F6E4",
        text: "#115E59",
    },
    rose: {
        main: "#E11D48",
        soft: "#FFF1F2",
        border: "#FECDD3",
        text: "#9F1239",
    },
};

export const clinicPageCanvasSx = {
    bgcolor: clinicColors.canvas,
    minHeight: "85vh",
    py: { xs: 3, md: 5 },
};

export const clinicSurfaceSx = {
    borderRadius: "16px",
    borderColor: clinicColors.border,
    backgroundColor: "#FFFFFF",
    boxShadow: "0 2px 12px rgba(10, 37, 64, 0.04)",
};

export const adminFilterCardSx = {
    ...clinicSurfaceSx,
    p: { xs: 2.25, md: 2.75 },
};

export const clinicFieldSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        backgroundColor: "#FFFFFF",
    },
    "& .MuiInputLabel-root": { fontSize: 14 },
    "& .MuiInputBase-input": { fontSize: 14.5 },
};

export const clinicButtonSx = {
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 650,
    boxShadow: "none",
    minHeight: 40,
};

export const clinicPrimaryButtonSx = {
    ...clinicButtonSx,
    bgcolor: clinicColors.primary,
    color: "#FFFFFF",
    px: 2.25,
    "&:hover": {
        bgcolor: clinicColors.primaryDark,
        boxShadow: "none",
    },
};

export const clinicSecondaryButtonSx = {
    ...clinicButtonSx,
    color: "#0A2540",
    borderColor: "#C4D6E8",
    bgcolor: "#FFFFFF",
    px: 2,
    "&:hover": {
        borderColor: clinicColors.primary,
        bgcolor: clinicColors.primarySoft,
    },
};

export const clinicResetButtonSx = {
    ...clinicButtonSx,
    color: "#334155",
    borderColor: "#CBD5E1",
    bgcolor: "#F8FAFC",
    px: 1.75,
    "&:hover": {
        borderColor: "#94A3B8",
        bgcolor: "#F1F5F9",
    },
};

export const adminViewIconButtonSx = {
    width: 34,
    height: 34,
    borderRadius: "9px",
    color: "#0284C7",
    bgcolor: "#F0F9FF",
    border: "1px solid #BAE6FD",
    "&:hover": {
        bgcolor: "#E0F2FE",
        borderColor: "#0284C7",
    },
};

export const adminEditIconButtonSx = {
    width: 34,
    height: 34,
    borderRadius: "9px",
    color: "#0B4F8A",
    bgcolor: "#E8F2FC",
    border: "1px solid #BFDBFE",
    "&:hover": {
        bgcolor: "#DBEAFE",
        borderColor: "#0B4F8A",
    },
};

export const adminDeleteIconButtonSx = {
    width: 34,
    height: 34,
    borderRadius: "9px",
    color: "#DC2626",
    bgcolor: "#FEF2F2",
    border: "1px solid #FECACA",
    "&:hover": {
        bgcolor: "#FEE2E2",
        borderColor: "#DC2626",
    },
    "&.Mui-disabled": {
        color: "#CBD5E1",
        bgcolor: "#F8FAFC",
        borderColor: "#E2E8F0",
    },
};

export const adminLockIconButtonSx = {
    width: 34,
    height: 34,
    borderRadius: "9px",
    color: "#B45309",
    bgcolor: "#FFFBEB",
    border: "1px solid #FDE68A",
    "&:hover": {
        bgcolor: "#FEF3C7",
        borderColor: "#D97706",
    },
    "&.Mui-disabled": {
        color: "#CBD5E1",
        bgcolor: "#F8FAFC",
        borderColor: "#E2E8F0",
    },
};

export const adminSuccessIconButtonSx = {
    width: 34,
    height: 34,
    borderRadius: "9px",
    color: "#059669",
    bgcolor: "#ECFDF5",
    border: "1px solid #A7F3D0",
    "&:hover": {
        bgcolor: "#D1FAE5",
        borderColor: "#059669",
    },
    "&.Mui-disabled": {
        color: "#CBD5E1",
        bgcolor: "#F8FAFC",
        borderColor: "#E2E8F0",
    },
};

export const clinicNumericCellSx = {
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
};

export const clinicTableSx = {
    "& th": {
        bgcolor: "#F1F6FB",
        color: "#1E3A5F",
        fontSize: 12.5,
        fontWeight: 750,
        letterSpacing: "0.02em",
        py: 1.85,
        px: 2,
        whiteSpace: "nowrap",
        borderBottom: "1px solid #D4E1EE",
    },
    "& td": {
        py: 1.85,
        px: 2,
        fontSize: 14,
        color: "#1E293B",
        borderColor: "#E8EFF6",
    },
    "& tbody tr:hover": {
        bgcolor: "#F6FAFE",
    },
};

export const clinicDialogPaperSx = {
    borderRadius: "16px",
    border: `1px solid ${clinicColors.border}`,
    boxShadow: "0 20px 48px rgba(10, 37, 64, 0.14)",
};

export const clinicDialogTitleSx = {
    p: 3,
    pb: 2,
    fontSize: 20,
    fontWeight: 750,
    color: clinicColors.heading,
};

export const clinicDialogActionsSx = {
    px: 3,
    py: 2,
    borderTop: `1px solid ${clinicColors.border}`,
    gap: 1,
    flexWrap: "wrap",
};

export function buildPaginationItems(currentPage, totalPages) {
    const total = Math.max(1, Number(totalPages) || 1);
    const current = Math.min(Math.max(1, Number(currentPage) || 1), total);

    if (total <= 7) {
        return Array.from({ length: total }, (_, index) => index + 1);
    }

    if (current <= 4) {
        return [1, 2, 3, 4, 5, "ellipsis-end", total];
    }

    if (current >= total - 3) {
        return [1, "ellipsis-start", total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, "ellipsis-start", current - 1, current, current + 1, "ellipsis-end", total];
}

// Shared imperative toast bus so hooks, API handlers, and components
// all dispatch into the single unified 4-second progress-bar toast system.
const toastListeners = new Set();

export const clinicToast = {
    emit(message, severity = "success", duration = 4000) {
        if (!message) return;
        toastListeners.forEach((listener) => {
            try {
                listener({ message: String(message), severity, duration });
            } catch {
                // Ignore listener failures.
            }
        });
    },
    success(message, duration = 4000) {
        clinicToast.emit(message, "success", duration);
    },
    error(message, duration = 4000) {
        clinicToast.emit(message, "error", duration);
    },
    subscribe(listener) {
        toastListeners.add(listener);
        return () => {
            toastListeners.delete(listener);
        };
    },
};
