import { useState } from "react";
import { Alert, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from "@mui/material";
import { LockOpenOutlined, LockOutlined, ManageAccountsOutlined, RefreshOutlined, SearchOutlined } from "@mui/icons-material";
import useUsers from "../../../hooks/useUsers";
import useAuth from "../../../hooks/useAuth";
import { updateUserRole, updateUserStatus } from "../../../api/userApi";
import { ROLE_LABELS } from "../../../routes/roleAccess";
import { getApiErrorMessage } from "../../../utils/errorHandler";

export default function UsersPage() {
    const { userId } = useAuth();
    const [query, setQuery] = useState({ pageNumber: 1, pageSize: 10, search: "", roleId: "", status: "" });
    const [search, setSearch] = useState("");
    const { items, totalItems, roles, loading, error, reload } = useUsers(query);
    const [action, setAction] = useState(null);
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState("");
    const [success, setSuccess] = useState("");
    const changeFilter = (key, value) => setQuery(current => ({ ...current, [key]: value, pageNumber: 1 }));
    function openAction(user, type) { setAction({ user, type, roleId: user.roleId }); setActionError(""); setSuccess(""); }
    async function submit() {
        if (saving) return;
        setSaving(true); setActionError("");
        try {
            if (action.type === "role") await updateUserRole(action.user.userId, Number(action.roleId));
            else await updateUserStatus(action.user.userId, !action.user.status);
            setSuccess("Đã cập nhật tài khoản thành công."); setAction(null); reload();
        } catch (err) { setActionError(getApiErrorMessage(err)); }
        finally { setSaving(false); }
    }
    return <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Box><Typography variant="overline" color="primary">Quản trị hệ thống</Typography><Typography variant="h4" component="h1">Tài khoản & Vai trò</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Quản lý quyền truy cập của nhân viên và bệnh nhân.</Typography></Box>
            <Button aria-label="Tải lại danh sách" startIcon={<RefreshOutlined />} onClick={reload} disabled={loading} sx={{ flexShrink: 0, whiteSpace: "nowrap" }}><Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Tải lại</Box></Button>
        </Stack>
        {success && <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>}
        {error && <Alert severity="error" action={<Button onClick={reload}>Thử lại</Button>}>{error}</Alert>}
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            <Stack component="form" onSubmit={event => { event.preventDefault(); changeFilter("search", search.trim()); }} direction={{ xs: "column", md: "row" }} spacing={2} sx={{ p: 3 }}>
                <TextField label="Tìm tài khoản" placeholder="Tên, họ tên hoặc email" value={search} onChange={event => setSearch(event.target.value)} size="small" sx={{ flex: 1 }} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <Button type="submit" variant="outlined" startIcon={<SearchOutlined />}>Tìm kiếm</Button>
                <TextField select label="Vai trò" value={query.roleId} onChange={event => changeFilter("roleId", event.target.value)} size="small" sx={{ minWidth: 170 }}>
                    <MenuItem value="">Tất cả vai trò</MenuItem>{roles.map(role => <MenuItem key={role.roleId} value={role.roleId}>{ROLE_LABELS[role.roleName] || role.roleName}</MenuItem>)}
                </TextField>
                <TextField select label="Trạng thái" value={query.status} onChange={event => changeFilter("status", event.target.value)} size="small" sx={{ minWidth: 165 }}><MenuItem value="">Tất cả trạng thái</MenuItem><MenuItem value="true">Đang hoạt động</MenuItem><MenuItem value="false">Đã khóa</MenuItem></TextField>
            </Stack>
            {loading && <LinearProgress aria-label="Đang tải tài khoản" />}
            <TableContainer><Table aria-label="Danh sách tài khoản" sx={{ minWidth: 800 }}>
                <TableHead><TableRow sx={{ bgcolor: "#f0f4f8" }}>{["Người dùng", "Liên hệ", "Vai trò", "Trạng thái", "Thao tác"].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
                <TableBody>{items.map(user => <TableRow key={user.userId} hover>
                    <TableCell><Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}><Avatar sx={{ bgcolor: "#e8f2fd", color: "primary.main" }}>{user.fullName.slice(0, 1)}</Avatar><Box><Typography sx={{ fontWeight: 600 }}>{user.fullName} {user.userId === userId && <Chip size="small" label="Bạn" />}</Typography><Typography variant="body2" color="text.secondary">{user.username}</Typography></Box></Stack></TableCell>
                    <TableCell><Typography variant="body2">{user.email || "—"}</Typography><Typography variant="body2" color="text.secondary">{user.phone || "—"}</Typography></TableCell>
                    <TableCell><Chip variant="outlined" size="small" label={ROLE_LABELS[user.role] || user.role} /></TableCell>
                    <TableCell><Chip size="small" color={user.status ? "success" : "default"} label={user.status ? "Đang hoạt động" : "Đã khóa"} /></TableCell>
                    <TableCell><Stack direction="row" spacing={1}><Button size="small" startIcon={<ManageAccountsOutlined />} disabled={user.userId === userId || loading} onClick={() => openAction(user, "role")}>Đổi vai trò</Button><Button size="small" color={user.status ? "error" : "success"} startIcon={user.status ? <LockOutlined /> : <LockOpenOutlined />} disabled={user.userId === userId || loading} onClick={() => openAction(user, "status")}>{user.status ? "Khóa" : "Mở khóa"}</Button></Stack></TableCell>
                </TableRow>)}{!loading && !items.length && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>Không tìm thấy tài khoản phù hợp.</TableCell></TableRow>}</TableBody>
            </Table></TableContainer>
            <TablePagination component="div" count={totalItems} page={query.pageNumber - 1} rowsPerPage={query.pageSize} rowsPerPageOptions={[10, 20, 50]} labelRowsPerPage="Số dòng" labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`} onPageChange={(_, page) => setQuery(current => ({ ...current, pageNumber: page + 1 }))} onRowsPerPageChange={event => setQuery(current => ({ ...current, pageNumber: 1, pageSize: Number(event.target.value) }))} />
        </Paper>
        <Typography variant="body2" color="text.secondary">Bạn không thể tự khóa hoặc đổi vai trò của mình. Thay đổi quyền sẽ yêu cầu người dùng đăng nhập lại.</Typography>
        <Dialog open={Boolean(action)} onClose={saving ? undefined : () => setAction(null)} fullWidth maxWidth="xs">
            <DialogTitle>{action?.type === "role" ? "Thay đổi vai trò" : action?.user.status ? "Khóa tài khoản" : "Mở khóa tài khoản"}</DialogTitle>
            <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
                {actionError && <Alert severity="error">{actionError}</Alert>}
                <Typography>{action?.user.fullName} ({action?.user.username})</Typography>
                {action?.type === "role" && <TextField select label="Vai trò mới" value={action.roleId} disabled={saving} onChange={event => setAction(current => ({ ...current, roleId: event.target.value }))}>{roles.map(role => <MenuItem key={role.roleId} value={role.roleId}>{ROLE_LABELS[role.roleName] || role.roleName}</MenuItem>)}</TextField>}
                <Typography variant="body2" color="text.secondary">Các phiên hiện tại sẽ hết hiệu lực. Người dùng cần đăng nhập lại sau khi được cấp quyền truy cập.</Typography>
            </Stack></DialogContent>
            <DialogActions><Button disabled={saving} onClick={() => setAction(null)}>Hủy</Button><Button variant="contained" disabled={saving || (action?.type === "role" && action.roleId === action.user.roleId)} onClick={submit}>{saving ? "Đang lưu…" : "Xác nhận"}</Button></DialogActions>
        </Dialog>
    </Stack>;
}
