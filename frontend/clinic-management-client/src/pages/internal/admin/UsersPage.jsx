import { useState } from "react";
import { Alert, Box, Button, Grid, MenuItem, Paper, Skeleton, Stack, TablePagination, TextField, Typography } from "@mui/material";
import { AddOutlined, DownloadOutlined, PeopleAltOutlined, RefreshOutlined } from "@mui/icons-material";
import ClinicPageHeader from "../../../components/common/ClinicPageHeader";
import UsersTable from "../../../components/internal/users/UsersTable";
import UserAccountDialog from "../../../components/internal/users/UserAccountDialog";
import UserAccessDialog from "../../../components/internal/users/UserAccessDialog";
import useUsers from "../../../hooks/useUsers";
import useUserActions from "../../../hooks/useUserActions";
import useAuth from "../../../hooks/useAuth";
import { ROLE_LABELS } from "../../../routes/roleAccess";
import { usersToCsv } from "../../../utils/userManagement";

const initialQuery = { pageNumber: 1, pageSize: 10, search: "", roleId: "", status: "" };

export default function UsersPage() {
    const { userId, permissions } = useAuth();
    const [query, setQuery] = useState(initialQuery);
    const [search, setSearch] = useState("");
    const users = useUsers(query);
    const manager = useUserActions({ roles: users.roles, reload: () => {
        setQuery(current => ({ ...current, pageNumber: 1 }));
        users.reload();
    } });
    const canEdit = permissions.includes("accounts.update");
    const canAssignRole = permissions.includes("accounts.assignRole");
    const canCreate = permissions.includes("accounts.create") && canAssignRole;
    const changeFilter = (name, value) => setQuery(current => ({ ...current, [name]: value, pageNumber: 1 }));
    const reset = () => { setQuery(initialQuery); setSearch(""); };
    const exportPage = () => {
        const url = URL.createObjectURL(new Blob([usersToCsv(users.items)], { type: "text/csv;charset=utf-8;" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "danh-sach-tai-khoan-trang-" + query.pageNumber + ".csv";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    const cards = [
        ["Tổng tài khoản theo bộ lọc", users.summary?.total, "#1976d2"],
        ["Đang hoạt động", users.summary?.active, "#059669"],
        ["Đã khóa", users.summary?.locked, "#d97706"],
    ];
    return <Stack spacing={3} sx={{ pb: 4, minWidth: 0 }}>
        <ClinicPageHeader title="Quản lý tài khoản & người dùng" icon={PeopleAltOutlined}
            description="Tạo tài khoản nhân viên, cập nhật thông tin và quản lý quyền truy cập."
            actions={<>
                <Button variant="outlined" onClick={users.reload} disabled={users.loading} startIcon={<RefreshOutlined />}>Làm mới</Button>
                <Button variant="contained" disabled={!canCreate || users.loading || Boolean(users.error)} onClick={() => manager.open("create")} startIcon={<AddOutlined />}>Thêm nhân viên</Button>
            </>} />
        {manager.success && <Alert severity="success" onClose={manager.clearSuccess}>{manager.success}</Alert>}
        <Grid container spacing={2}>{cards.map(([title, value, color]) => <Grid key={title} size={{ xs: 12, sm: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography color="text.secondary" variant="body2">{title}</Typography>
                {users.loading ? <Skeleton width={80} height={46} /> : <Typography sx={{ mt: 1, fontSize: 30, fontWeight: 750, color }}>{users.error ? "—" : value}</Typography>}
            </Paper>
        </Grid>)}</Grid>
        <Paper component="form" variant="outlined" onSubmit={event => { event.preventDefault(); changeFilter("search", search); }} sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack spacing={2}>
                <TextField label="Tìm tài khoản theo tên, email hoặc số điện thoại" fullWidth value={search} onChange={event => setSearch(event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField select label="Vai trò" value={query.roleId} onChange={event => changeFilter("roleId", event.target.value)} sx={{ minWidth: { md: 240 }, flex: 1 }}>
                        <MenuItem value="">Tất cả vai trò</MenuItem>{users.roles.map(role => <MenuItem key={role.roleId} value={String(role.roleId)}>{ROLE_LABELS[role.roleName] || role.roleName}</MenuItem>)}
                    </TextField>
                    <TextField select label="Trạng thái" value={query.status} onChange={event => changeFilter("status", event.target.value)} sx={{ minWidth: { md: 200 }, flex: 1 }}>
                        <MenuItem value="">Tất cả trạng thái</MenuItem><MenuItem value="true">Hoạt động</MenuItem><MenuItem value="false">Đã khóa</MenuItem>
                    </TextField>
                    <Button type="submit" variant="contained">Tìm kiếm</Button><Button onClick={reset} variant="outlined">Xóa lọc</Button>
                </Stack>
            </Stack>
        </Paper>
        {users.loading ? <Box role="status" aria-label="Đang tải tài khoản"><Skeleton variant="rounded" height={300} /></Box>
            : users.error ? <Alert severity="error" action={<Button color="inherit" onClick={users.reload}>Thử lại</Button>}>{users.error}</Alert>
            : <>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                    <Typography variant="body2" color="text.secondary">{users.totalItems} tài khoản phù hợp</Typography>
                    <Button startIcon={<DownloadOutlined />} onClick={exportPage} disabled={!users.items.length}>Xuất trang CSV</Button>
                </Stack>
                {!users.items.length ? <Alert severity="info">Không tìm thấy tài khoản phù hợp.</Alert> : <UsersTable items={users.items} userId={userId}
                    canEdit={canEdit} canAssignRole={canAssignRole} onAction={manager.open} />}
                <TablePagination component="div" count={users.totalItems} page={query.pageNumber - 1} rowsPerPage={query.pageSize} rowsPerPageOptions={[10, 20, 50]}
                    sx={{ "& .MuiTablePagination-toolbar": { flexWrap: "wrap", px: 0 }, "& .MuiTablePagination-spacer": { display: { xs: "none", sm: "block" } } }}
                    labelRowsPerPage="Số dòng:" labelDisplayedRows={({ from, to, count }) => from + "–" + to + " / " + count}
                    onPageChange={(_, page) => setQuery(current => ({ ...current, pageNumber: page + 1 }))}
                    onRowsPerPageChange={event => setQuery(current => ({ ...current, pageNumber: 1, pageSize: Number(event.target.value) }))} />
            </>}
        <UserAccountDialog manager={manager} roles={users.roles} />
        <UserAccessDialog manager={manager} roles={users.roles} />
    </Stack>;
}
