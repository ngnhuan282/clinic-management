import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, MenuItem, Paper, Stack, Tab, Tabs, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { Add, History, Refresh, Security } from "@mui/icons-material";
import { rbacApi } from "../../../api/rbacApi";
import { getUsers, updateUserRole } from "../../../api/userApi";
import { getApiErrorMessage } from "../../../utils/errorHandler";

const emptyDraft = { name: "", description: "", copyFromRoleId: "", permissionCodes: [] };
const diff = (before = [], after = []) => ({
    added: after.filter(code => !before.includes(code)),
    removed: before.filter(code => !after.includes(code)),
});
const matches = (value, query) => value.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"));

function PermissionChanges({ before, after, permissions }) {
    const changes = diff(before, after);
    const label = code => permissions.find(item => item.code === code)?.name || code;
    return <Stack spacing={1}>
        <Typography variant="body2" color="success.main">Thêm: {changes.added.length ? changes.added.map(label).join(", ") : "Không có"}</Typography>
        <Typography variant="body2" color="error.main">Bỏ: {changes.removed.length ? changes.removed.map(label).join(", ") : "Không có"}</Typography>
    </Stack>;
}

function Matrix({ permissions, selected, onChange, compare, roleName, system = false }) {
    const groups = useMemo(() => permissions.reduce((result, permission) => {
        (result[permission.module] ||= []).push(permission);
        return result;
    }, {}), [permissions]);
    const toggle = code => onChange(selected.includes(code) ? selected.filter(item => item !== code) : [...selected, code]);
    return <Stack spacing={2}>
        <Alert severity="info">Quyền xem hồ sơ chỉ áp dụng trong phạm vi bệnh nhân hoặc bác sĩ được giao. API vẫn kiểm tra quyền và phạm vi dữ liệu ở backend.</Alert>
        {Object.entries(groups).map(([module, items]) => <Paper key={module} variant="outlined" sx={{ overflow: "hidden" }}>
            <Typography sx={{ px: 2, py: 1.5, fontWeight: 700, bgcolor: "action.hover" }}>{module}</Typography>
            <Table size="small"><TableHead><TableRow><TableCell>Hành động</TableCell><TableCell>Loại</TableCell><TableCell align="center">{roleName}</TableCell>{compare && <TableCell align="center">{compare.roleName}</TableCell>}</TableRow></TableHead>
                <TableBody>{items.map(permission => {
                    const adminOnly = !system && permission.code.startsWith("accounts.");
                    const invalidForSystem = system && !permission.allowedSystemRoles.includes(roleName);
                    const pending = !permission.isImplemented;
                    const canSelect = !adminOnly && !invalidForSystem && (!pending || permission.code.startsWith("billing.") || selected.includes(permission.code));
                    return <TableRow key={permission.code}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{permission.name}</Typography><Typography variant="caption" color="text.secondary">{permission.scope || permission.code}</Typography>{!permission.isImplemented && <Chip label="Chưa có API" size="small" sx={{ ml: 1 }} />}</TableCell>
                    <TableCell>{permission.kind}</TableCell>
                    <TableCell align="center"><Tooltip title={adminOnly ? "Chỉ vai trò Admin được quản lý tài khoản và RBAC." : invalidForSystem ? "Thao tác này không thuộc phạm vi nghiệp vụ của vai trò hệ thống." : pending ? "Chưa có API; quyền này chưa mở truy cập chức năng." : ""}><span><Checkbox size="small" checked={selected.includes(permission.code)} disabled={!canSelect || !onChange} onChange={() => toggle(permission.code)} inputProps={{ "aria-label": `${roleName}: ${permission.name}` }} /></span></Tooltip></TableCell>
                    {compare && <TableCell align="center"><Checkbox size="small" checked={compare.permissionCodes.includes(permission.code)} disabled /></TableCell>}
                </TableRow>; })}</TableBody></Table>
        </Paper>)}
    </Stack>;
}

export default function RolesPermissionsPage() {
    const [tab, setTab] = useState(0);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [saving, setSaving] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [draftCodes, setDraftCodes] = useState([]);
    const [compareId, setCompareId] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [dialog, setDialog] = useState("");
    const [create, setCreate] = useState(emptyDraft);
    const [createStep, setCreateStep] = useState(0);
    const [edit, setEdit] = useState({ name: "", description: "" });
    const [users, setUsers] = useState({ items: [], totalItems: 0 });
    const [userPage, setUserPage] = useState(0);
    const [userSearch, setUserSearch] = useState("");
    const [userQuery, setUserQuery] = useState("");
    const [usersLoading, setUsersLoading] = useState(false);
    const [assignment, setAssignment] = useState(null);
    const [audit, setAudit] = useState({ items: [], totalItems: 0 });
    const [auditPage, setAuditPage] = useState(0);
    const [auditLoading, setAuditLoading] = useState(false);

    const selectedRole = roles.find(role => role.roleId === selectedId);
    const comparedRole = roles.find(role => role.roleId === compareId);
    const dirty = Boolean(selectedRole && (diff(selectedRole.permissionCodes, draftCodes).added.length || diff(selectedRole.permissionCodes, draftCodes).removed.length));
    const createDirty = Boolean(create.name || create.description || create.permissionCodes.length);

    useEffect(() => {
        const warn = event => { if (dirty || (dialog === "create" && createDirty)) { event.preventDefault(); event.returnValue = ""; } };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty, dialog, createDirty]);

    useEffect(() => {
        if (!dirty) return;
        const warnNavigation = event => {
            const link = event.target.closest?.("a[href]");
            if (!link) return;
            const destination = new URL(link.href, window.location.href);
            if (destination.origin === window.location.origin && destination.pathname !== window.location.pathname
                && !window.confirm("Bạn có thay đổi quyền chưa lưu. Rời trang và bỏ thay đổi?")) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };
        document.addEventListener("click", warnNavigation, true);
        return () => document.removeEventListener("click", warnNavigation, true);
    }, [dirty]);

    const loadRoles = useCallback(async () => {
        const all = [];
        let pageNumber = 1;
        while (true) {
            const page = await rbacApi.roles({ pageNumber, pageSize: 100 });
            all.push(...page.items);
            if (all.length >= page.totalItems) break;
            pageNumber += 1;
        }
        setRoles(all);
        setSelectedId(current => all.some(role => role.roleId === current) ? current : all[0]?.roleId ?? null);
        setDraftCodes(all[0]?.permissionCodes || []);
        return all;
    }, []);

    useEffect(() => { let active = true; Promise.resolve().then(() => Promise.all([loadRoles(), rbacApi.permissions()]))
        .then(([, rights]) => { if (active) setPermissions(rights); })
        .catch(err => { if (active) setError(getApiErrorMessage(err)); })
        .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [loadRoles]);


    const loadUsers = useCallback(async () => {
        setUsersLoading(true);
        try { setUsers(await getUsers({ pageNumber: userPage + 1, pageSize: 10, search: userQuery })); }
        catch (err) { setError(getApiErrorMessage(err)); }
        finally { setUsersLoading(false); }
    }, [userPage, userQuery]);
    useEffect(() => { if (tab === 1) void Promise.resolve().then(loadUsers); }, [tab, loadUsers]);

    const loadAudit = useCallback(async () => {
        setAuditLoading(true);
        try { setAudit(await rbacApi.audit({ pageNumber: auditPage + 1, pageSize: 10 })); }
        catch (err) { setError(getApiErrorMessage(err)); }
        finally { setAuditLoading(false); }
    }, [auditPage]);
    useEffect(() => { if (tab === 2) void Promise.resolve().then(loadAudit); }, [tab, loadAudit]);

    const clearFeedback = () => { setError(""); setNotice(""); };
    const fail = err => {
        setError(err.response?.status === 409 ? "Dữ liệu đã thay đổi ở phiên khác. Hãy tải lại rồi thử lại." : getApiErrorMessage(err));
    };
    const chooseRole = id => {
        if (dirty && !window.confirm("Bỏ thay đổi quyền chưa lưu để chuyển vai trò?")) return;
        setDraftCodes(roles.find(role => role.roleId === id)?.permissionCodes || []);
        setSelectedId(id); clearFeedback();
    };
    const changeTab = value => {
        if (dirty && !window.confirm("Bỏ thay đổi quyền chưa lưu để chuyển tab?")) return;
        if (dirty) setDraftCodes(selectedRole.permissionCodes);
        setTab(value); clearFeedback();
    };
    const refresh = async () => {
        if (dirty && !window.confirm("Tải lại sẽ bỏ thay đổi quyền chưa lưu. Tiếp tục?")) return;
        clearFeedback(); setLoading(true);
        try { const all = await loadRoles(); setDraftCodes(all.find(role => role.roleId === selectedId)?.permissionCodes || all[0]?.permissionCodes || []); if (tab === 1) await loadUsers(); if (tab === 2) await loadAudit(); }
        catch (err) { fail(err); }
        finally { setLoading(false); }
    };
    const applyRole = role => {
        setRoles(current => current.map(item => item.roleId === role.roleId ? role : item));
        setDraftCodes(role.permissionCodes); setSelectedId(role.roleId);
        setDialog(""); setNotice("Đã lưu thay đổi thành công."); setError("");
    };
    const saveMatrix = async () => {
        setSaving(true); setError("");
        try { applyRole(await rbacApi.updatePermissions(selectedId, { version: selectedRole.version, permissionCodes: draftCodes })); }
        catch (err) { fail(err); }
        finally { setSaving(false); }
    };
    const validName = (name, excludingId = null) => name.trim().length >= 2 && name.trim().length <= 50
        && name.trim().toLowerCase() !== "guest" && !roles.some(role => role.roleId !== excludingId && role.roleName.toLowerCase() === name.trim().toLowerCase());
    const saveCreate = async () => {
        if (!validName(create.name) || create.description.trim().length < 2) return;
        setSaving(true); setError("");
        try {
            const role = await rbacApi.create({ name: create.name.trim(), description: create.description.trim(),
                copyFromRoleId: create.copyFromRoleId || null, permissionCodes: create.permissionCodes });
            setRoles(current => [...current, role]); setSelectedId(role.roleId); setDraftCodes(role.permissionCodes);
            setCreate(emptyDraft); setDialog(""); setNotice(`Đã tạo vai trò ${role.roleName}.`);
        } catch (err) { fail(err); } finally { setSaving(false); }
    };
    const saveEdit = async () => {
        if (!validName(edit.name, selectedId) || edit.description.trim().length < 2) return;
        setSaving(true); setError("");
        try { applyRole(await rbacApi.update(selectedId, { name: edit.name.trim(), description: edit.description.trim(), version: selectedRole.version })); }
        catch (err) { fail(err); } finally { setSaving(false); }
    };
    const removeRole = async () => {
        setSaving(true); setError("");
        try { await rbacApi.remove(selectedId, selectedRole.version); const remaining = roles.filter(role => role.roleId !== selectedId);
            setRoles(remaining); setSelectedId(remaining[0]?.roleId ?? null); setDraftCodes(remaining[0]?.permissionCodes || []);
            setDialog(""); setNotice("Đã xóa vai trò."); }
        catch (err) { fail(err); } finally { setSaving(false); }
    };
    const saveAssignment = async () => {
        setSaving(true); setError("");
        try { await updateUserRole(assignment.user.userId, Number(assignment.roleId));
            setDialog(""); setAssignment(null); setNotice("Đã gán vai trò. Phiên đăng nhập cũ của tài khoản đã bị thu hồi.");
            await Promise.all([loadUsers(), loadRoles()]); }
        catch (err) { fail(err); } finally { setSaving(false); }
    };
    const displayedRoles = roles.filter(role => (filter === "all" || role.isSystem === (filter === "system"))
        && matches(`${role.roleName} ${role.description || ""}`, search));
    const createChanges = diff([], create.permissionCodes);
    const matrixChanges = diff(selectedRole?.permissionCodes, draftCodes);
    const assignmentOld = roles.find(role => role.roleId === assignment?.user.roleId);
    const assignmentNew = roles.find(role => role.roleId === assignment?.roleId);

    return <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 2.5, borderLeft: "4px solid", borderLeftColor: "primary.main" }}><Stack direction="row" spacing={2} alignItems="flex-start"><Security color="primary" /><Box>
            <Typography fontWeight={700}>Phân quyền theo vai trò và quyền nghiệp vụ</Typography>
            <Typography variant="body2" color="text.secondary">Mỗi tài khoản có một RoleId. Quyền trên trang lấy từ cơ sở dữ liệu; backend kiểm tra quyền ở từng API và thu hồi phiên cũ khi quyền thay đổi.</Typography>
            <Typography variant="caption" color="text.secondary">Hóa đơn và thanh toán đang thuộc phạm vi triển khai riêng: Receptionist phụ trách xuất hóa đơn; xét nghiệm thanh toán trước, thuốc thanh toán sau, từng khoản phát sinh được thanh toán riêng.</Typography>
        </Box></Stack></Paper>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}><Box><Typography variant="h4" component="h1">Quản lý vai trò & phân quyền</Typography><Typography color="text.secondary">Vai trò hệ thống, vai trò tùy chỉnh và quyền truy cập thực tế.</Typography></Box>
            <Stack direction="row" spacing={1}><Button startIcon={<Refresh />} onClick={refresh}>Tải lại</Button><Button variant="contained" startIcon={<Add />} disabled={dirty} onClick={() => { clearFeedback(); setCreate(emptyDraft); setCreateStep(0); setDialog("create"); }}>Tạo vai trò</Button></Stack></Stack>
        {loading && <Box textAlign="center" py={5}><CircularProgress aria-label="Đang tải phân quyền" /></Box>}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {notice && !dirty && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
        <Tabs value={tab} onChange={(_, value) => changeTab(value)} variant="scrollable" scrollButtons="auto"><Tab label={`Ma trận phân quyền & Vai trò (${roles.length})`} /><Tab label="Gán vai trò cho tài khoản" /><Tab label="Nhật ký kiểm toán" icon={<History fontSize="small" />} iconPosition="start" /></Tabs>

        {tab === 0 && !loading && <Stack spacing={3}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField size="small" label="Tìm vai trò" value={search} onChange={event => setSearch(event.target.value)} sx={{ minWidth: 240 }} /><TextField select size="small" label="Loại vai trò" value={filter} onChange={event => setFilter(event.target.value)} sx={{ minWidth: 180 }}><MenuItem value="all">Tất cả</MenuItem><MenuItem value="system">Hệ thống</MenuItem><MenuItem value="custom">Tùy chỉnh</MenuItem></TextField></Stack>
            {!roles.length ? <Alert severity="info">Chưa có vai trò nào.</Alert> : !displayedRoles.length ? <Alert severity="info">Không có kết quả tìm kiếm phù hợp.</Alert> : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
                {displayedRoles.map(role => <Paper key={role.roleId} variant="outlined" sx={{ p: 2, borderColor: selectedId === role.roleId ? "primary.main" : "divider" }}><Stack spacing={1.5}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={700}>{role.roleName}</Typography><Chip size="small" label={role.isSystem ? "Hệ thống" : "Tùy chỉnh"} color={role.isSystem ? "default" : "primary"} /></Stack><Typography variant="body2" color="text.secondary">{role.description || "Chưa có mô tả"}</Typography><Typography variant="body2">{role.userCount} tài khoản · {role.permissionCodes.length} quyền</Typography><Button size="small" onClick={() => chooseRole(role.roleId)}>Xem chi tiết quyền</Button></Stack></Paper>)}
            </Box>}
            {selectedRole && <Paper variant="outlined" sx={{ p: 2.5 }}><Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}><Box><Typography variant="h6">Ma trận: {selectedRole.roleName}</Typography><Typography variant="body2" color="text.secondary">{selectedRole.isSystem ? "Vai trò hệ thống" : "Vai trò tùy chỉnh"} · {selectedRole.userCount} tài khoản</Typography></Box><Stack direction="row" spacing={1}>{!selectedRole.isSystem && <><Button disabled={dirty} onClick={() => { setEdit({ name: selectedRole.roleName, description: selectedRole.description || "" }); clearFeedback(); setDialog("edit"); }}>Sửa thông tin</Button><Button disabled={dirty} color="error" onClick={() => { clearFeedback(); setDialog("delete"); }}>Xóa</Button></>}</Stack></Stack>
                <TextField select size="small" label="So sánh với" value={compareId} onChange={event => setCompareId(event.target.value)} sx={{ maxWidth: 280 }}><MenuItem value="">Không so sánh</MenuItem>{roles.filter(role => role.roleId !== selectedId).map(role => <MenuItem key={role.roleId} value={role.roleId}>{role.roleName}</MenuItem>)}</TextField>
                <Matrix permissions={permissions} selected={draftCodes} onChange={codes => { setDraftCodes(codes); setNotice(""); }} compare={comparedRole?.roleId === selectedId ? null : comparedRole} roleName={selectedRole.roleName} system={selectedRole.isSystem} />
                {dirty && <Paper sx={{ p: 2, bgcolor: "grey.900", color: "common.white", position: "sticky", bottom: 12 }}><Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems="center"><Box><Typography fontWeight={700}>Có {matrixChanges.added.length + matrixChanges.removed.length} thay đổi chưa lưu</Typography><Typography variant="caption">Xem lại trước khi áp dụng cho {selectedRole.roleName}.</Typography></Box><Stack direction="row" spacing={1}><Button sx={{ color: "common.white" }} onClick={() => setDraftCodes(selectedRole.permissionCodes)}>Hủy thay đổi</Button><Button variant="contained" onClick={() => { clearFeedback(); setDialog("matrix"); }}>Xem trước & lưu</Button></Stack></Stack></Paper>}
            </Stack></Paper>}
        </Stack>}

        {tab === 1 && <Paper variant="outlined" sx={{ p: 2.5 }}><Stack spacing={2}><Stack direction="row" spacing={1} component="form" onSubmit={event => { event.preventDefault(); setUserPage(0); setUserQuery(userSearch.trim()); }}><TextField size="small" label="Tìm tài khoản" value={userSearch} onChange={event => setUserSearch(event.target.value)} sx={{ flex: 1 }} /><Button type="submit" variant="outlined">Tìm kiếm</Button></Stack>{usersLoading && <CircularProgress size={24} />}
            {!usersLoading && !users.items.length && <Alert severity="info">{userQuery ? "Không có tài khoản phù hợp." : "Chưa có tài khoản."}</Alert>}
            <Table size="small"><TableHead><TableRow><TableCell>Tài khoản</TableCell><TableCell>Vai trò hiện tại</TableCell><TableCell>Thao tác</TableCell></TableRow></TableHead><TableBody>{users.items.map(user => <TableRow key={user.userId}><TableCell>{user.fullName}<Typography variant="caption" display="block">{user.username}</Typography></TableCell><TableCell>{user.role}</TableCell><TableCell><Button size="small" onClick={() => { clearFeedback(); setAssignment({ user, roleId: user.roleId }); setDialog("assign"); }}>Đổi vai trò</Button></TableCell></TableRow>)}</TableBody></Table>
            <TablePagination component="div" count={users.totalItems} page={userPage} rowsPerPage={10} rowsPerPageOptions={[10]} onPageChange={(_, page) => setUserPage(page)} />
        </Stack></Paper>}
        {tab === 2 && <Paper variant="outlined" sx={{ p: 2.5 }}><Stack spacing={2}>{auditLoading && <CircularProgress size={24} />}{!auditLoading && !audit.items.length && <Alert severity="info">Chưa có thay đổi phân quyền nào.</Alert>}
            <Table size="small"><TableHead><TableRow><TableCell>Thời điểm</TableCell><TableCell>Người thực hiện</TableCell><TableCell>Thao tác</TableCell><TableCell>Đối tượng</TableCell><TableCell>Trước / Sau</TableCell></TableRow></TableHead><TableBody>{audit.items.map(entry => <TableRow key={entry.rbacAuditId}><TableCell>{new Date(entry.createdAt).toLocaleString("vi-VN")}</TableCell><TableCell>{entry.actorUsername}</TableCell><TableCell>{entry.action}</TableCell><TableCell>{entry.entityType} #{entry.entityId}</TableCell><TableCell><Typography variant="caption" sx={{ wordBreak: "break-word" }}>{entry.beforeJson || "—"}<br />→ {entry.afterJson || "—"}</Typography></TableCell></TableRow>)}</TableBody></Table><TablePagination component="div" count={audit.totalItems} page={auditPage} rowsPerPage={10} rowsPerPageOptions={[10]} onPageChange={(_, page) => setAuditPage(page)} />
        </Stack></Paper>}

        <Dialog open={dialog === "matrix"} onClose={saving ? undefined : () => setDialog("")} fullWidth maxWidth="sm"><DialogTitle>Xem trước thay đổi quyền</DialogTitle><DialogContent dividers><Stack spacing={2}><Typography>Vai trò: <strong>{selectedRole?.roleName}</strong></Typography><PermissionChanges before={selectedRole?.permissionCodes} after={draftCodes} permissions={permissions} />{error && <Alert severity="error">{error}</Alert>}</Stack></DialogContent><DialogActions><Button disabled={saving} onClick={() => setDialog("")}>Quay lại</Button><Button variant="contained" disabled={saving} onClick={saveMatrix}>Xác nhận lưu</Button></DialogActions></Dialog>
        <Dialog open={dialog === "create"} onClose={() => { if (!createDirty || window.confirm("Bỏ vai trò chưa lưu?")) setDialog(""); }} fullWidth maxWidth="md"><DialogTitle>Tạo vai trò mới · Bước {createStep + 1}/3</DialogTitle><DialogContent dividers><Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {createStep === 0 && <><TextField label="Tên vai trò" required value={create.name} onChange={event => setCreate(value => ({ ...value, name: event.target.value }))} error={Boolean(create.name && !validName(create.name))} helperText={create.name && !validName(create.name) ? "Tên phải duy nhất, dài 2–50 ký tự và không được là Guest." : "Ví dụ: Cashier"} /><TextField label="Mô tả" required multiline minRows={2} value={create.description} onChange={event => setCreate(value => ({ ...value, description: event.target.value }))} /><TextField select label="Bắt đầu từ" value={create.copyFromRoleId} onChange={event => { const id = Number(event.target.value); setCreate(value => ({ ...value, copyFromRoleId: id || "", permissionCodes: (roles.find(role => role.roleId === id)?.permissionCodes || []).filter(code => !code.startsWith("accounts.")) })); }}><MenuItem value="">Bộ quyền trống</MenuItem>{roles.map(role => <MenuItem key={role.roleId} value={role.roleId}>Sao chép {role.roleName}</MenuItem>)}</TextField></>}
            {createStep === 1 && <Matrix permissions={permissions} selected={create.permissionCodes} onChange={codes => setCreate(value => ({ ...value, permissionCodes: codes }))} roleName={create.name || "Vai trò mới"} />}
            {createStep === 2 && <><Typography><strong>Tên:</strong> {create.name.trim()}</Typography><Typography><strong>Mô tả:</strong> {create.description.trim()}</Typography><Typography><strong>Quyền được chọn:</strong> {create.permissionCodes.length}</Typography><PermissionChanges before={[]} after={create.permissionCodes} permissions={permissions} />{createChanges.added.some(code => !permissions.find(item => item.code === code)?.isImplemented) && <Alert severity="warning">Bản sao có quyền cho chức năng chưa có API; quyền đó chưa tạo quyền truy cập thực tế.</Alert>}</>}
        </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={() => { if (!createDirty || window.confirm("Bỏ vai trò chưa lưu?")) setDialog(""); }}>Hủy</Button>{createStep > 0 && <Button onClick={() => setCreateStep(value => value - 1)}>Quay lại</Button>}{createStep < 2 ? <Button variant="contained" disabled={createStep === 0 && (!validName(create.name) || create.description.trim().length < 2)} onClick={() => setCreateStep(value => value + 1)}>Tiếp tục</Button> : <Button variant="contained" disabled={saving} onClick={saveCreate}>Lưu vai trò</Button>}</DialogActions></Dialog>
        <Dialog open={dialog === "edit"} onClose={saving ? undefined : () => setDialog("")} fullWidth maxWidth="sm"><DialogTitle>Sửa vai trò tùy chỉnh</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{error && <Alert severity="error">{error}</Alert>}<TextField label="Tên vai trò" value={edit.name} onChange={event => setEdit(value => ({ ...value, name: event.target.value }))} error={Boolean(edit.name && !validName(edit.name, selectedId))} /><TextField label="Mô tả" multiline minRows={2} value={edit.description} onChange={event => setEdit(value => ({ ...value, description: event.target.value }))} /></Stack></DialogContent><DialogActions><Button onClick={() => setDialog("")}>Hủy</Button><Button variant="contained" disabled={saving || !validName(edit.name, selectedId) || edit.description.trim().length < 2} onClick={saveEdit}>Lưu</Button></DialogActions></Dialog>
        <Dialog open={dialog === "delete"} onClose={saving ? undefined : () => setDialog("")} fullWidth maxWidth="sm"><DialogTitle>Xóa vai trò {selectedRole?.roleName}</DialogTitle><DialogContent><Stack spacing={2}>{error && <Alert severity="error">{error}</Alert>}{selectedRole?.userCount ? <Alert severity="warning">Vai trò đang được gán cho {selectedRole.userCount} tài khoản. Hãy chuyển tài khoản sang vai trò khác trước khi xóa.</Alert> : <Typography>Thao tác này sẽ xóa vai trò tùy chỉnh và các quyền đã gán.</Typography>}</Stack></DialogContent><DialogActions><Button onClick={() => setDialog("")}>Hủy</Button><Button color="error" variant="contained" disabled={saving || selectedRole?.userCount > 0} onClick={removeRole}>Xác nhận xóa</Button></DialogActions></Dialog>
        <Dialog open={dialog === "assign"} onClose={saving ? undefined : () => setDialog("")} fullWidth maxWidth="sm"><DialogTitle>Gán một vai trò cho tài khoản</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{error && <Alert severity="error">{error}</Alert>}<Typography>{assignment?.user.fullName} ({assignment?.user.username})</Typography><TextField select label="Vai trò mới" value={assignment?.roleId || ""} onChange={event => setAssignment(value => ({ ...value, roleId: Number(event.target.value) }))}>{roles.map(role => <MenuItem key={role.roleId} value={role.roleId}>{role.roleName} · {role.isSystem ? "Hệ thống" : "Tùy chỉnh"}</MenuItem>)}</TextField><Divider /><Typography variant="body2">{assignmentOld?.roleName} → {assignmentNew?.roleName}</Typography><PermissionChanges before={assignmentOld?.permissionCodes} after={assignmentNew?.permissionCodes} permissions={permissions} /><Alert severity="info">Tài khoản chỉ có một RoleId. Sau khi đổi, phiên đăng nhập cũ sẽ bị thu hồi ngay.</Alert></Stack></DialogContent><DialogActions><Button onClick={() => setDialog("")}>Hủy</Button><Button variant="contained" disabled={saving || !assignment || assignment.user.roleId === assignment.roleId} onClick={saveAssignment}>Xác nhận thay đổi</Button></DialogActions></Dialog>
    </Stack>;
}
