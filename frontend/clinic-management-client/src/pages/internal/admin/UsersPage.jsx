import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Grid,
    InputAdornment,
    MenuItem,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    CheckCircleRounded,
    DownloadRounded,
    LockOutlined,
    ManageAccountsRounded,
} from "@mui/icons-material";
import ClinicPageHeader, {
    AdminStatCard,
    ClinicPagination,
} from "../../../components/common/ClinicPageHeader";
import {
    AdminAddIcon,
    AdminFilterIcon,
    AdminRefreshIcon,
    AdminResetIcon,
    AdminSearchIcon,
    adminFilterCardSx,
    clinicColors,
    clinicFieldSx,
    clinicPrimaryButtonSx,
    clinicResetButtonSx,
    clinicSecondaryButtonSx,
    clinicSurfaceSx,
    clinicToast,
} from "../../../components/common/clinicUi";
import UserAccessDialog from "../../../components/internal/users/UserAccessDialog";
import UserAccountDialog from "../../../components/internal/users/UserAccountDialog";
import UsersTable from "../../../components/internal/users/UsersTable";
import useAuth from "../../../hooks/useAuth";
import useUserActions from "../../../hooks/useUserActions";
import useUsers from "../../../hooks/useUsers";
import { ROLE_LABELS } from "../../../routes/roleAccess";
import { usersToCsv } from "../../../utils/userManagement";

const initialQuery = { pageNumber: 1, pageSize: 10, search: "", roleId: "", status: "" };

export default function UsersPage() {
    const { userId, permissions } = useAuth();
    const [query, setQuery] = useState(initialQuery);
    const [search, setSearch] = useState("");
    const users = useUsers(query);
    const manager = useUserActions({
        roles: users.roles,
        reload: () => {
            setQuery((current) => ({ ...current, pageNumber: 1 }));
            users.reload();
        },
    });
    const canEdit = permissions.includes("accounts.update");
    const canAssignRole = permissions.includes("accounts.assignRole");
    const canCreate = permissions.includes("accounts.create") && canAssignRole;
    const changeFilter = (name, value) =>
        setQuery((current) => ({ ...current, [name]: value, pageNumber: 1 }));
    const reset = () => {
        setQuery(initialQuery);
        setSearch("");
    };
    const exportPage = () => {
        const url = URL.createObjectURL(
            new Blob([usersToCsv(users.items)], { type: "text/csv;charset=utf-8;" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "danh-sach-tai-khoan-trang-" + query.pageNumber + ".csv";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        clinicToast.success("Đã xuất danh sách tài khoản trang hiện tại ra CSV.");
    };

    const cards = [
        {
            title: "Tổng tài khoản theo bộ lọc",
            value: users.error ? "—" : users.summary?.total ?? 0,
            subtitle: "Tổng số tài khoản khớp điều kiện lọc",
            icon: ManageAccountsRounded,
            tone: "blue",
        },
        {
            title: "Đang hoạt động",
            value: users.error ? "—" : users.summary?.active ?? 0,
            subtitle: "Tài khoản được phép đăng nhập hệ thống",
            icon: CheckCircleRounded,
            tone: "emerald",
        },
        {
            title: "Đã khóa",
            value: users.error ? "—" : users.summary?.locked ?? 0,
            subtitle: "Tài khoản đang bị tạm khóa phiên truy cập",
            icon: LockOutlined,
            tone: "amber",
        },
    ];

    return (
        <Stack spacing={3} sx={{ pb: 4, minWidth: 0 }}>
            <ClinicPageHeader
                title="Quản lý tài khoản & người dùng"
                icon={ManageAccountsRounded}
                description="Tạo tài khoản nhân viên, liên kết hồ sơ bác sĩ, cập nhật thông tin và quản lý trạng thái truy cập."
                actions={
                    <>
                        <Button
                            variant="outlined"
                            onClick={users.reload}
                            disabled={users.loading}
                            startIcon={<AdminRefreshIcon />}
                            sx={clinicSecondaryButtonSx}
                        >
                            Làm mới
                        </Button>
                        <Button
                            variant="contained"
                            disabled={!canCreate || users.loading || Boolean(users.error)}
                            onClick={() => manager.open("create")}
                            startIcon={<AdminAddIcon />}
                            sx={clinicPrimaryButtonSx}
                        >
                            Thêm nhân viên
                        </Button>
                    </>
                }
            />

            <Grid container spacing={2.25}>
                {cards.map((card) => (
                    <Grid key={card.title} size={{ xs: 12, sm: 4 }}>
                        <AdminStatCard
                            title={card.title}
                            value={card.value}
                            subtitle={card.subtitle}
                            icon={card.icon}
                            tone={card.tone}
                            loading={users.loading}
                        />
                    </Grid>
                ))}
            </Grid>

            <Paper
                component="form"
                variant="outlined"
                onSubmit={(event) => {
                    event.preventDefault();
                    changeFilter("search", search);
                }}
                sx={adminFilterCardSx}
            >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.75 }}>
                    <AdminFilterIcon sx={{ fontSize: 19, color: clinicColors.primary }} />
                    <Typography sx={{ fontSize: 14.5, fontWeight: 750, color: clinicColors.heading }}>
                        Bộ lọc & tra cứu tài khoản
                    </Typography>
                </Stack>

                <Stack spacing={1.75}>
                    <TextField
                        size="small"
                        label="Tìm tài khoản theo tên, email hoặc số điện thoại"
                        fullWidth
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        sx={clinicFieldSx}
                        slotProps={{
                            htmlInput: { maxLength: 100 },
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AdminSearchIcon sx={{ color: "#64748B", fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                        <TextField
                            select
                            size="small"
                            label="Vai trò"
                            value={query.roleId}
                            onChange={(event) => changeFilter("roleId", event.target.value)}
                            sx={{ ...clinicFieldSx, minWidth: { md: 240 }, flex: 1 }}
                        >
                            <MenuItem value="">Tất cả vai trò</MenuItem>
                            {users.roles.map((role) => (
                                <MenuItem key={role.roleId} value={String(role.roleId)}>
                                    {ROLE_LABELS[role.roleName] || role.roleName}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            size="small"
                            label="Trạng thái"
                            value={query.status}
                            onChange={(event) => changeFilter("status", event.target.value)}
                            sx={{ ...clinicFieldSx, minWidth: { md: 200 }, flex: 1 }}
                        >
                            <MenuItem value="">Tất cả trạng thái</MenuItem>
                            <MenuItem value="true">Hoạt động</MenuItem>
                            <MenuItem value="false">Đã khóa</MenuItem>
                        </TextField>

                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<AdminSearchIcon />}
                            sx={{ ...clinicPrimaryButtonSx, whiteSpace: "nowrap" }}
                        >
                            Tìm kiếm
                        </Button>

                        <Button
                            onClick={reset}
                            variant="outlined"
                            startIcon={<AdminResetIcon />}
                            sx={{ ...clinicResetButtonSx, whiteSpace: "nowrap" }}
                        >
                            Đặt lại bộ lọc
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {users.loading ? (
                <Box role="status" aria-label="Đang tải tài khoản">
                    <Skeleton variant="rounded" height={320} sx={{ borderRadius: "16px" }} />
                </Box>
            ) : users.error ? (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" onClick={users.reload}>
                            Thử lại
                        </Button>
                    }
                    sx={{ borderRadius: "12px" }}
                >
                    {users.error}
                </Alert>
            ) : (
                <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        sx={{
                            px: 2.5,
                            py: 2,
                            justifyContent: "space-between",
                            alignItems: { sm: "center" },
                            borderBottom: "1px solid #E4ECF5",
                        }}
                    >
                        <Typography sx={{ fontSize: 15, fontWeight: 750, color: clinicColors.heading }}>
                            Danh sách tài khoản ({users.totalItems} tài khoản phù hợp)
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadRounded />}
                            onClick={exportPage}
                            disabled={!users.items.length}
                            sx={clinicSecondaryButtonSx}
                        >
                            Xuất trang CSV
                        </Button>
                    </Stack>

                    {!users.items.length ? (
                        <Box sx={{ p: 3 }}>
                            <Alert severity="info" sx={{ borderRadius: "10px" }}>
                                Không tìm thấy tài khoản phù hợp.
                            </Alert>
                        </Box>
                    ) : (
                        <UsersTable
                            items={users.items}
                            userId={userId}
                            canEdit={canEdit}
                            canAssignRole={canAssignRole}
                            onAction={manager.open}
                        />
                    )}

                    <ClinicPagination
                        page={query.pageNumber}
                        pageSize={query.pageSize}
                        totalItems={users.totalItems}
                        label="tài khoản"
                        onPageChange={(pageNumber) =>
                            setQuery((current) => ({ ...current, pageNumber }))
                        }
                        onPageSizeChange={(pageSize) =>
                            setQuery((current) => ({ ...current, pageNumber: 1, pageSize }))
                        }
                    />
                </Paper>
            )}

            <UserAccountDialog manager={manager} roles={users.roles} />
            <UserAccessDialog manager={manager} roles={users.roles} />
        </Stack>
    );
}
