import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert, Avatar, Box, Button, Checkbox, Chip, CircularProgress,
    Dialog, DialogActions, DialogContent, DialogTitle, Divider,
    IconButton, MenuItem, Paper, Stack, Tab, Tabs, Table, TableBody,
    TableCell, TableHead, TablePagination, TableRow, TextField,
    Tooltip, Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { rbacApi } from "../../../api/rbacApi";
import { getApiErrorMessage } from "../../../utils/errorHandler";

// ── helpers ───────────────────────────────────────────────────────────────────
const emptyDraft = { name: "", description: "", copyFromRoleId: "", permissionCodes: [] };
const diff = (before = [], after = []) => ({
    added: after.filter(code => !before.includes(code)),
    removed: before.filter(code => !after.includes(code)),
});
const matches = (value, query) =>
    value.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"));

// Role card colors cycle
const ROLE_COLORS = ["#005DAC","#0284C7","#0D9488","#7C3AED","#B45309","#DC2626","#059669"];
const roleColor = (id) => ROLE_COLORS[(id || 0) % ROLE_COLORS.length];
const roleInitial = (name) =>
    (name || "?").trim().toUpperCase().slice(0, 2);

// ── PermissionChanges ─────────────────────────────────────────────────────────
function PermissionChanges({ before, after, permissions }) {
    const changes = diff(before, after);
    const label = code => permissions.find(p => p.code === code)?.name || code;
    return (
        <Stack spacing={1}>
            <Typography variant="body2" color="success.main">
                Thêm: {changes.added.length ? changes.added.map(label).join(", ") : "Không có"}
            </Typography>
            <Typography variant="body2" color="error.main">
                Bỏ: {changes.removed.length ? changes.removed.map(label).join(", ") : "Không có"}
            </Typography>
        </Stack>
    );
}

// ── RoleCard ──────────────────────────────────────────────────────────────────
function RoleCard({ role, selected, onSelect, onEdit, onDelete, dirty }) {
    const color = roleColor(role.roleId);
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 0, overflow: "hidden", cursor: "pointer",
                borderColor: selected ? color : "divider",
                borderWidth: selected ? 2 : 1,
                transition: "border-color .15s, box-shadow .15s",
                "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,.10)" },
            }}
            onClick={() => !dirty ? onSelect(role.roleId) : onSelect(role.roleId)}
        >
            {/* Color bar */}
            <Box sx={{ height: 4, backgroundColor: color }} />
            <Stack spacing={1.5} sx={{ p: 2 }}>
                {/* Header row */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, bgcolor: color, fontSize: 13, fontWeight: 800 }}>
                            {roleInitial(role.roleName)}
                        </Avatar>
                        <Box>
                            <Typography fontWeight={800} sx={{ lineHeight: 1.25, color: "#111827" }}>
                                {role.roleName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#6B7280", fontFamily: "monospace", fontSize: 11 }}>
                                ROLE_{role.roleName.toUpperCase().replace(/\s+/g, "_")}
                            </Typography>
                        </Box>
                    </Stack>
                    <Chip
                        size="small"
                        label={role.isSystem ? "Hệ thống" : "Tùy chỉnh"}
                        sx={{
                            height: 20, fontSize: 11, fontWeight: 700,
                            bgcolor: role.isSystem ? "#F3F4F6" : "#DBEAFE",
                            color: role.isSystem ? "#374151" : "#1D4ED8",
                        }}
                    />
                </Stack>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{
                    minHeight: 36, display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5,
                }}>
                    {role.description || "Chưa có mô tả"}
                </Typography>

                {/* Stats */}
                <Stack direction="row" spacing={1.5}>
                    <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600 }}>
                        {role.userCount} tài khoản
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6B7280" }}>·</Typography>
                    <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600 }}>
                        {role.permissionCodes.length} quyền
                    </Typography>
                </Stack>

                <Divider />

                {/* Actions */}
                <Stack direction="row" spacing={1}>
                    <Button size="small" variant={selected ? "contained" : "outlined"}
                        startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 15 }} />}
                        onClick={(e) => { e.stopPropagation(); onSelect(role.roleId); }}
                        sx={{ flex: 1, fontWeight: 700, fontSize: 12 }}>
                        {selected ? "Đang xem" : "Chi tiết"}
                    </Button>
                    {!role.isSystem && (
                        <>
                            <Tooltip title="Sửa thông tin">
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(role); }}
                                    sx={{ border: "1px solid #E5E9F0" }}>
                                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa vai trò">
                                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(role); }}
                                    sx={{ border: "1px solid #FECACA" }}>
                                    <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Stack>
            </Stack>
        </Paper>
    );
}

// ── Matrix (fine-grained permission matrix) ───────────────────────────────────
// Column widths shared across all module tables (must sum to 100%)
const COL_WIDTHS = { action: "52%", check: "12%", code: "36%" };
const COL_WIDTHS_COMPARE = { action: "44%", check: "10%", check2: "10%", code: "36%" };

function Matrix({ permissions, selected, onChange, compare, roleName, system = false }) {
    const groups = useMemo(() =>
        permissions.reduce((result, perm) => {
            (result[perm.module] ||= []).push(perm);
            return result;
        }, {}), [permissions]);

    const toggle = code =>
        onChange(selected.includes(code)
            ? selected.filter(c => c !== code)
            : [...selected, code]);

    const w = compare ? COL_WIDTHS_COMPARE : COL_WIDTHS;

    return (
        <Stack spacing={0}>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
                Quyền xem hồ sơ chỉ áp dụng trong phạm vi bệnh nhân hoặc bác sĩ được giao.
                API vẫn kiểm tra quyền và phạm vi dữ liệu ở backend.
            </Alert>
            {Object.entries(groups).map(([module, items]) => (
                <Box key={module} sx={{ mb: 2 }}>
                    {/* Module header */}
                    <Box sx={{
                        px: 2, py: 1, backgroundColor: "#F1F5F9",
                        borderRadius: "8px 8px 0 0", border: "1px solid #E2E8F0",
                        borderBottom: "none",
                    }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 13, color: "#374151", textTransform: "uppercase", letterSpacing: ".5px" }}>
                            {module}
                        </Typography>
                    </Box>
                    <Paper variant="outlined" sx={{ borderRadius: "0 0 8px 8px", overflow: "hidden", borderColor: "#E2E8F0" }}>
                        <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                            {/* colgroup pins every column to the same % width in every module table */}
                            <colgroup>
                                <col style={{ width: w.action }} />
                                <col style={{ width: w.check }} />
                                {compare && <col style={{ width: w.check2 }} />}
                                <col style={{ width: w.code }} />
                            </colgroup>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#374151" }}>
                                        Hành động / Phạm vi
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: "#005DAC" }}>
                                        {roleName}
                                    </TableCell>
                                    {compare && (
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: "#6B7280" }}>
                                            {compare.roleName}
                                        </TableCell>
                                    )}
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#374151" }}>
                                        Mã / Ghi chú
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map(perm => {
                                    const adminOnly = !system && perm.code.startsWith("accounts.");
                                    const invalidForSystem = system && !perm.allowedSystemRoles?.includes(roleName);
                                    const pending = !perm.isImplemented;
                                    const canSelect = !adminOnly && !invalidForSystem &&
                                        (!pending || perm.code.startsWith("billing.") || selected.includes(perm.code));
                                    const isChecked = selected.includes(perm.code);
                                    const compareChecked = compare?.permissionCodes.includes(perm.code);
                                    return (
                                        <TableRow key={perm.code} hover
                                            sx={{
                                                backgroundColor: isChecked ? "rgba(0,93,172,.04)" : "transparent",
                                                "&:hover": { backgroundColor: isChecked ? "rgba(0,93,172,.07)" : "#F8FAFC" },
                                            }}>
                                            <TableCell sx={{ verticalAlign: "top", py: 1 }}>
                                                <Typography variant="body2" fontWeight={600} sx={{ color: "#111827" }}>
                                                    {perm.name}
                                                </Typography>
                                                {perm.scope && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                                        {perm.scope}
                                                    </Typography>
                                                )}
                                                {!perm.isImplemented && (
                                                    <Chip label="Chưa có API" size="small"
                                                        sx={{ mt: 0.25, height: 16, fontSize: 10, bgcolor: "#FEF3C7", color: "#92400E" }} />
                                                )}
                                            </TableCell>
                                            <TableCell align="center" sx={{ verticalAlign: "middle" }}>
                                                <Tooltip title={
                                                    adminOnly ? "Chỉ vai trò Admin được quản lý tài khoản và RBAC." :
                                                    invalidForSystem ? "Thao tác này không thuộc phạm vi nghiệp vụ của vai trò hệ thống." :
                                                    pending ? "Chưa có API; quyền này chưa mở truy cập chức năng." : ""
                                                }>
                                                    <span>
                                                        <Checkbox
                                                            size="small"
                                                            checked={isChecked}
                                                            disabled={!canSelect || !onChange}
                                                            onChange={() => toggle(perm.code)}
                                                            inputProps={{ "aria-label": `${roleName}: ${perm.name}` }}
                                                            sx={{
                                                                color: isChecked ? "#005DAC" : "#D1D5DB",
                                                                "&.Mui-checked": { color: "#005DAC" },
                                                                p: 0.5,
                                                            }}
                                                        />
                                                    </span>
                                                </Tooltip>
                                            </TableCell>
                                            {compare && (
                                                <TableCell align="center" sx={{ verticalAlign: "middle" }}>
                                                    <Checkbox size="small" checked={compareChecked} disabled
                                                        sx={{ p: 0.5, color: "#D1D5DB", "&.Mui-checked": { color: "#6B7280" } }} />
                                                </TableCell>
                                            )}
                                            <TableCell sx={{ verticalAlign: "top", py: 1 }}>
                                                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#6B7280", fontSize: 11, wordBreak: "break-all" }}>
                                                    {perm.code}
                                                </Typography>
                                                {adminOnly && (
                                                    <Typography variant="caption" sx={{ display: "block", color: "#DC2626", fontSize: 10 }}>
                                                        Admin only
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Paper>
                </Box>
            ))}
        </Stack>
    );
}

// ── CreateWizard stepper visual ───────────────────────────────────────────────
function StepIndicator({ step, total = 4 }) {
    const labels = ["Thông tin vai trò", "Nguyên phân quyền", "Tóm tắt & xác nhận", "Xác nhận & Đăng ký"];
    return (
        <Stack direction="row" spacing={0} sx={{ mb: 2 }}>
            {labels.slice(0, total).map((label, idx) => {
                const done = idx < step;
                const active = idx === step;
                return (
                    <Box key={idx} sx={{ flex: 1, position: "relative" }}>
                        <Stack alignItems="center" spacing={0.5}>
                            <Box sx={{
                                width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center",
                                bgcolor: done ? "#10B981" : active ? "#005DAC" : "#E5E9F0",
                                color: (done || active) ? "#FFF" : "#9CA3AF",
                                fontWeight: 800, fontSize: 13,
                                zIndex: 1,
                            }}>
                                {done ? <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16 }} /> : idx + 1}
                            </Box>
                            <Typography variant="caption" sx={{
                                fontSize: 10, fontWeight: active ? 700 : 400,
                                color: active ? "#005DAC" : done ? "#10B981" : "#9CA3AF",
                                textAlign: "center", lineHeight: 1.2,
                            }}>
                                {label}
                            </Typography>
                        </Stack>
                        {idx < total - 1 && (
                            <Box sx={{
                                position: "absolute", top: 14, left: "50%", width: "100%",
                                height: 2, bgcolor: done ? "#10B981" : "#E5E9F0",
                                zIndex: 0,
                            }} />
                        )}
                    </Box>
                );
            })}
        </Stack>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
    const [audit, setAudit] = useState({ items: [], totalItems: 0 });
    const [auditPage, setAuditPage] = useState(0);
    const [auditLoading, setAuditLoading] = useState(false);

    const selectedRole = roles.find(r => r.roleId === selectedId);
    const comparedRole = roles.find(r => r.roleId === compareId);
    const dirty = Boolean(selectedRole && (
        diff(selectedRole.permissionCodes, draftCodes).added.length ||
        diff(selectedRole.permissionCodes, draftCodes).removed.length
    ));
    const createDirty = Boolean(create.name || create.description || create.permissionCodes.length);

    // Warn before unload
    useEffect(() => {
        const warn = e => {
            if (dirty || (dialog === "create" && createDirty)) {
                e.preventDefault(); e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty, dialog, createDirty]);

    // Warn on nav away
    useEffect(() => {
        if (!dirty) return;
        const warnNav = e => {
            const link = e.target.closest?.("a[href]");
            if (!link) return;
            const dest = new URL(link.href, window.location.href);
            if (dest.origin === window.location.origin && dest.pathname !== window.location.pathname
                && !window.confirm("Bạn có thay đổi quyền chưa lưu. Rời trang và bỏ thay đổi?")) {
                e.preventDefault(); e.stopImmediatePropagation();
            }
        };
        document.addEventListener("click", warnNav, true);
        return () => document.removeEventListener("click", warnNav, true);
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
        setSelectedId(cur => all.some(r => r.roleId === cur) ? cur : all[0]?.roleId ?? null);
        setDraftCodes(all[0]?.permissionCodes || []);
        return all;
    }, []);

    useEffect(() => {
        let active = true;
        Promise.all([loadRoles(), rbacApi.permissions()])
            .then(([, rights]) => { if (active) setPermissions(rights); })
            .catch(err => { if (active) setError(getApiErrorMessage(err)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [loadRoles]);

    const loadAudit = useCallback(async () => {
        setAuditLoading(true);
        try { setAudit(await rbacApi.audit({ pageNumber: auditPage + 1, pageSize: 10 })); }
        catch (err) { setError(getApiErrorMessage(err)); }
        finally { setAuditLoading(false); }
    }, [auditPage]);
    useEffect(() => { if (tab === 1) void loadAudit(); }, [tab, loadAudit]);

    const clearFeedback = () => { setError(""); setNotice(""); };
    const fail = err => {
        setError(err.response?.status === 409
            ? "Dữ liệu đã thay đổi ở phiên khác. Hãy tải lại rồi thử lại."
            : getApiErrorMessage(err));
    };
    const chooseRole = id => {
        if (dirty && !window.confirm("Bỏ thay đổi quyền chưa lưu để chuyển vai trò?")) return;
        setDraftCodes(roles.find(r => r.roleId === id)?.permissionCodes || []);
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
        try {
            const all = await loadRoles();
            setDraftCodes(all.find(r => r.roleId === selectedId)?.permissionCodes || all[0]?.permissionCodes || []);
            if (tab === 1) await loadAudit();
        } catch (err) { fail(err); }
        finally { setLoading(false); }
    };
    const applyRole = role => {
        setRoles(cur => cur.map(r => r.roleId === role.roleId ? role : r));
        setDraftCodes(role.permissionCodes); setSelectedId(role.roleId);
        setDialog(""); setNotice("Đã lưu thay đổi thành công."); setError("");
    };
    const saveMatrix = async () => {
        setSaving(true); setError("");
        try {
            applyRole(await rbacApi.updatePermissions(selectedId, {
                version: selectedRole.version, permissionCodes: draftCodes,
            }));
        } catch (err) { fail(err); }
        finally { setSaving(false); }
    };
    const validName = (name, excludingId = null) =>
        name.trim().length >= 2 && name.trim().length <= 50
        && name.trim().toLowerCase() !== "guest"
        && !roles.some(r => r.roleId !== excludingId && r.roleName.toLowerCase() === name.trim().toLowerCase());
    const saveCreate = async () => {
        if (!validName(create.name) || create.description.trim().length < 2) return;
        setSaving(true); setError("");
        try {
            const role = await rbacApi.create({
                name: create.name.trim(), description: create.description.trim(),
                copyFromRoleId: create.copyFromRoleId || null, permissionCodes: create.permissionCodes,
            });
            setRoles(cur => [...cur, role]); setSelectedId(role.roleId); setDraftCodes(role.permissionCodes);
            setCreate(emptyDraft); setDialog(""); setNotice(`Đã tạo vai trò ${role.roleName}.`);
        } catch (err) { fail(err); } finally { setSaving(false); }
    };
    const saveEdit = async () => {
        if (!validName(edit.name, selectedId) || edit.description.trim().length < 2) return;
        setSaving(true); setError("");
        try {
            applyRole(await rbacApi.update(selectedId, {
                name: edit.name.trim(), description: edit.description.trim(), version: selectedRole.version,
            }));
        } catch (err) { fail(err); } finally { setSaving(false); }
    };
    const removeRole = async () => {
        setSaving(true); setError("");
        try {
            await rbacApi.remove(selectedId, selectedRole.version);
            const remaining = roles.filter(r => r.roleId !== selectedId);
            setRoles(remaining); setSelectedId(remaining[0]?.roleId ?? null);
            setDraftCodes(remaining[0]?.permissionCodes || []);
            setDialog(""); setNotice("Đã xóa vai trò.");
        } catch (err) { fail(err); } finally { setSaving(false); }
    };


    const displayedRoles = roles.filter(r =>
        (filter === "all" || r.isSystem === (filter === "system"))
        && matches(`${r.roleName} ${r.description || ""}`, search)
    );
    const matrixChanges = diff(selectedRole?.permissionCodes, draftCodes);
    const createChanges = diff([], create.permissionCodes);

    return (
        <Stack spacing={0}>
            {/* ── Page header ─────────────────────────────────── */}
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between"
                alignItems={{ sm: "center" }} spacing={1.5} sx={{ mb: 1.5 }}>
                <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <SecurityOutlinedIcon sx={{ color: "#005DAC", fontSize: 20 }} />
                        <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1.3 }}>
                            Quản lý Vai trò &amp; Phân quyền Hệ thống
                        </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 3.75, display: "block" }}>
                        Toàn quyền quản lý, lập biên phân quyền, xác định vai trò và chức năng phụ trợ trong hệ thống.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={0.75} flexShrink={0} alignItems="center">
                    <Button variant="outlined" startIcon={<HistoryOutlinedIcon sx={{ fontSize: 15 }} />}
                        size="small"
                        onClick={() => changeTab(1)}
                        sx={{ whiteSpace: "nowrap", fontWeight: 600, fontSize: 12, py: 0.5, px: 1.5 }}>
                        Lịch sử
                    </Button>
                    <Button variant="outlined" startIcon={<RefreshOutlinedIcon sx={{ fontSize: 15 }} />}
                        size="small" onClick={refresh}
                        sx={{ whiteSpace: "nowrap", fontWeight: 600, fontSize: 12, py: 0.5, px: 1.5 }}>
                        Tải lại
                    </Button>
                    <Button variant="contained" startIcon={<AddOutlinedIcon sx={{ fontSize: 15 }} />}
                        size="small" disabled={dirty}
                        onClick={() => { clearFeedback(); setCreate(emptyDraft); setCreateStep(0); setDialog("create"); }}
                        sx={{ whiteSpace: "nowrap", fontWeight: 700, fontSize: 12, py: 0.5, px: 1.75 }}>
                        Tạo vai trò
                    </Button>
                </Stack>
            </Stack>

            {/* ── Info banner ─────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderLeft: "3px solid #005DAC", borderRadius: 1.5, backgroundColor: "#F8FAFF" }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                    <SecurityOutlinedIcon sx={{ color: "#005DAC", flexShrink: 0, fontSize: 18 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", lineHeight: 1.4 }}>
                            Phân quyền theo vai trò và quyền nghiệp vụ
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                            Mỗi tài khoản có một RoleId. Backend kiểm tra quyền ở từng API và thu hồi phiên cũ khi quyền thay đổi.
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* ── Alerts ───────────────────────────────────────── */}
            {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 1.5 }}>{error}</Alert>}
            {notice && !dirty && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 1.5 }}>{notice}</Alert>}

            {/* ── Tabs ─────────────────────────────────────────── */}
            <Box sx={{ borderBottom: "1px solid #E5E9F0", mb: 2.5 }}>
                <Tabs value={tab} onChange={(_, v) => changeTab(v)} variant="scrollable" scrollButtons="auto"
                    sx={{
                        "& .MuiTab-root": { fontWeight: 600, textTransform: "none", fontSize: 13, minHeight: 44, py: 1 },
                        "& .Mui-selected": { color: "#005DAC", fontWeight: 700 },
                        "& .MuiTabs-indicator": { backgroundColor: "#005DAC", height: 2.5 },
                    }}>
                    <Tab label={`Ma trận phân quyền & Vai trò (${roles.length})`} />
                    <Tab icon={<HistoryOutlinedIcon sx={{ fontSize: 15 }} />} iconPosition="start"
                        label="Nhật ký kiểm toán" />
                </Tabs>
            </Box>

            {/* ── Tab 0: Matrix & Roles ─────────────────────────────── */}
            {tab === 0 && !loading && (
                <Stack spacing={3}>
                    {/* Role directory header */}
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
                        <Box>
                            <Typography fontWeight={800} sx={{ fontSize: 16, color: "#111827" }}>
                                Danh mục Vai trò (Roles Directory)
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tổng cộng {roles.length} vai trò đang được khởi tạo.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <TextField size="small" placeholder="Tìm vai trò..." value={search}
                                onChange={e => setSearch(e.target.value)} sx={{ minWidth: 180 }} />
                            <TextField select size="small" value={filter}
                                onChange={e => setFilter(e.target.value)} sx={{ minWidth: 130 }}>
                                <MenuItem value="all">Tất cả</MenuItem>
                                <MenuItem value="system">Hệ thống</MenuItem>
                                <MenuItem value="custom">Tùy chỉnh</MenuItem>
                            </TextField>
                        </Stack>
                    </Stack>

                    {/* Role cards */}
                    {!roles.length ? (
                        <Alert severity="info">Chưa có vai trò nào.</Alert>
                    ) : !displayedRoles.length ? (
                        <Alert severity="info">Không có kết quả tìm kiếm phù hợp.</Alert>
                    ) : (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
                            {displayedRoles.map(role => (
                                <RoleCard
                                    key={role.roleId}
                                    role={role}
                                    selected={selectedId === role.roleId}
                                    dirty={dirty}
                                    onSelect={chooseRole}
                                    onEdit={r => { setEdit({ name: r.roleName, description: r.description || "" }); clearFeedback(); setDialog("edit"); setSelectedId(r.roleId); }}
                                    onDelete={r => { chooseRole(r.roleId); clearFeedback(); setDialog("delete"); }}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Permission matrix section */}
                    {selectedRole && (
                        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
                            {/* Matrix header */}
                            <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, borderBottom: "1px solid #E5E9F0", backgroundColor: "#FAFAFA" }}>
                                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "flex-start" }} spacing={2}>
                                    <Box>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography fontWeight={900} sx={{ fontSize: 16, color: "#111827" }}>
                                                Ma trận Đặc quyền Nghiệp vụ Chi tiết
                                            </Typography>
                                            <Chip label="Fine-Grained Matrix" size="small"
                                                sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: "#DBEAFE", color: "#1D4ED8" }} />
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                            Click vào checkbox để thay đổi quyền. Ô ★ yêu cầu xác nhận 2 bước trước khi lưu.
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>Đang chọn:</Typography>
                                        <TextField select size="small" value={selectedId || ""}
                                            onChange={e => chooseRole(Number(e.target.value))} sx={{ minWidth: 200 }}>
                                            {roles.map(r => <MenuItem key={r.roleId} value={r.roleId}>{r.roleName}</MenuItem>)}
                                        </TextField>
                                    </Stack>
                                </Stack>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mt: 1.5 }}>
                                    {!selectedRole.isSystem && (
                                        <>
                                            <Button size="small" variant="outlined"
                                                startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
                                                disabled={dirty}
                                                onClick={() => { setEdit({ name: selectedRole.roleName, description: selectedRole.description || "" }); clearFeedback(); setDialog("edit"); }}>
                                                Sửa thông tin
                                            </Button>
                                            <Button size="small" variant="outlined" color="error"
                                                startIcon={<DeleteOutlineOutlinedIcon sx={{ fontSize: 15 }} />}
                                                disabled={dirty}
                                                onClick={() => { clearFeedback(); setDialog("delete"); }}>
                                                Xóa vai trò
                                            </Button>
                                        </>
                                    )}
                                    <Box sx={{ flex: 1 }} />
                                    <TextField select size="small" label="So sánh với" value={compareId}
                                        onChange={e => setCompareId(e.target.value)} sx={{ minWidth: 200 }}>
                                        <MenuItem value="">Không so sánh</MenuItem>
                                        {roles.filter(r => r.roleId !== selectedId).map(r => (
                                            <MenuItem key={r.roleId} value={r.roleId}>{r.roleName}</MenuItem>
                                        ))}
                                    </TextField>
                                    {!dirty && (
                                        <Button size="small" variant="outlined" startIcon={<SaveOutlinedIcon sx={{ fontSize: 15 }} />} disabled>
                                            Lưu ma trận
                                        </Button>
                                    )}
                                </Stack>
                            </Box>

                            {/* Matrix body */}
                            <Box sx={{ p: 2.5 }}>
                                <Matrix
                                    permissions={permissions}
                                    selected={draftCodes}
                                    onChange={codes => { setDraftCodes(codes); setNotice(""); }}
                                    compare={comparedRole?.roleId === selectedId ? null : comparedRole}
                                    roleName={selectedRole.roleName}
                                    system={selectedRole.isSystem}
                                />
                            </Box>
                        </Paper>
                    )}
                </Stack>
            )}


            {/* ── Tab 2: Audit log ──────────────────────────────────── */}
            {tab === 1 && (
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Stack spacing={2}>
                        {auditLoading && <CircularProgress size={24} />}
                        {!auditLoading && !audit.items.length && (
                            <Alert severity="info">Chưa có thay đổi phân quyền nào.</Alert>
                        )}
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Thời điểm</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Người thực hiện</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Đối tượng</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Trước / Sau</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {audit.items.map(entry => (
                                    <TableRow key={entry.rbacAuditId} hover>
                                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                                            {new Date(entry.createdAt).toLocaleString("vi-VN")}
                                        </TableCell>
                                        <TableCell>{entry.actorUsername}</TableCell>
                                        <TableCell>
                                            <Chip size="small" label={entry.action} sx={{ fontWeight: 700 }} />
                                        </TableCell>
                                        <TableCell>{entry.entityType} #{entry.entityId}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ wordBreak: "break-word" }}>
                                                {entry.beforeJson || "—"}<br />→ {entry.afterJson || "—"}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination component="div" count={audit.totalItems} page={auditPage}
                            rowsPerPage={10} rowsPerPageOptions={[10]}
                            onPageChange={(_, p) => setAuditPage(p)} />
                    </Stack>
                </Paper>
            )}

            {/* Loading overlay */}
            {loading && (
                <Box textAlign="center" py={6}>
                    <CircularProgress aria-label="Đang tải phân quyền" />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Đang tải vai trò và quyền...</Typography>
                </Box>
            )}

            {/* ── Sticky dirty bar ──────────────────────────────────── */}
            {dirty && (
                <Paper elevation={8} sx={{
                    p: "10px 20px", bgcolor: "#111827", color: "#FFF",
                    position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
                    zIndex: 1300, borderRadius: 2.5, minWidth: 320, maxWidth: 700, width: "calc(100% - 64px)",
                }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography fontWeight={800} sx={{ fontSize: 14 }}>
                                Bạn đang có {matrixChanges.added.length + matrixChanges.removed.length} điều chỉnh
                                {" "}chưa lưu cho vai trò [{selectedRole?.roleName}]
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                Hủy thay đổi để bỏ qua · Xem trước & Lưu quyền để áp dụng
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <Button sx={{ color: "#D1D5DB", borderColor: "#4B5563" }} variant="outlined"
                                size="small" onClick={() => setDraftCodes(selectedRole.permissionCodes)}>
                                Hủy thay đổi
                            </Button>
                            <Button variant="contained" size="small" color="primary"
                                startIcon={<SaveOutlinedIcon sx={{ fontSize: 15 }} />}
                                onClick={() => { clearFeedback(); setDialog("matrix"); }}>
                                Xem trước & Lưu quyền
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            )}

            {/* ── Dialogs ───────────────────────────────────────────── */}

            {/* Matrix preview & save */}
            <Dialog open={dialog === "matrix"} onClose={saving ? undefined : () => setDialog("")}
                fullWidth maxWidth="sm">
                <DialogTitle fontWeight={800}>Xem trước thay đổi quyền</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <Typography>Vai trò: <strong>{selectedRole?.roleName}</strong></Typography>
                        <PermissionChanges before={selectedRole?.permissionCodes} after={draftCodes} permissions={permissions} />
                        {error && <Alert severity="error">{error}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} onClick={() => setDialog("")}>Quay lại</Button>
                    <Button variant="contained" disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
                        onClick={saveMatrix}>
                        Xác nhận lưu
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create role wizard */}
            <Dialog open={dialog === "create"}
                onClose={() => { if (!createDirty || window.confirm("Bỏ vai trò chưa lưu?")) setDialog(""); }}
                fullWidth maxWidth="md">
                <DialogTitle fontWeight={800}>
                    Quy trình tạo Vai trò Mới (Role Builder)
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.25 }}>
                        Mỗi cấp sẽ xác định một phân vùng ban hành cho vai trò tạo lên không cắt vào logic CSD...
                    </Typography>
                </DialogTitle>
                <Divider />
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <StepIndicator step={createStep} total={3} />
                        {error && <Alert severity="error">{error}</Alert>}

                        {createStep === 0 && (
                            <>
                                <TextField label="Tên vai trò" required value={create.name}
                                    onChange={e => setCreate(v => ({ ...v, name: e.target.value }))}
                                    error={Boolean(create.name && !validName(create.name))}
                                    helperText={create.name && !validName(create.name)
                                        ? "Tên phải duy nhất, dài 2–50 ký tự và không được là Guest."
                                        : "Ví dụ: Cashier"} />
                                <TextField label="Mô tả" required multiline minRows={2}
                                    value={create.description}
                                    onChange={e => setCreate(v => ({ ...v, description: e.target.value }))} />
                                <TextField select label="Bắt đầu từ (Baseline Permissions)"
                                    value={create.copyFromRoleId}
                                    onChange={e => {
                                        const id = Number(e.target.value);
                                        setCreate(v => ({
                                            ...v, copyFromRoleId: id || "",
                                            permissionCodes: (roles.find(r => r.roleId === id)?.permissionCodes || [])
                                                .filter(code => !code.startsWith("accounts.")),
                                        }));
                                    }}>
                                    <MenuItem value="">Bộ quyền trống (Blank Slate)</MenuItem>
                                    {roles.map(r => <MenuItem key={r.roleId} value={r.roleId}>Sao chép {r.roleName}</MenuItem>)}
                                </TextField>
                                {/* Baseline options summary */}
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <Paper variant="outlined" sx={{ p: 1.5, flex: 1, borderRadius: 1.5 }}>
                                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                                            Sao chép từ vai trò có sẵn (Kế thừa)
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Kế thừa 15 quyền từ Receptionist (bỏ qua các quyền kế thừa tự nhiên theo định nghĩa ngang).
                                        </Typography>
                                    </Paper>
                                    <Paper variant="outlined" sx={{ p: 1.5, flex: 1, borderRadius: 1.5 }}>
                                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                                            Tạo từ bộ quyền hoàn toàn trống (Blank Slate)
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Bắt đầu không có quyền nào. Phù hợp khi bạn cần thiết kế phân quyền từ đầu theo yêu cầu nghiệp vụ đặc thù.
                                        </Typography>
                                    </Paper>
                                </Stack>
                            </>
                        )}

                        {createStep === 1 && (
                            <Matrix
                                permissions={permissions}
                                selected={create.permissionCodes}
                                onChange={codes => setCreate(v => ({ ...v, permissionCodes: codes }))}
                                roleName={create.name || "Vai trò mới"}
                            />
                        )}

                        {createStep === 2 && (
                            <>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }}>
                                    <Typography variant="body2" fontWeight={700} color="#15803D" sx={{ mb: 1 }}>
                                        Lưu thành công!
                                    </Typography>
                                    <Typography variant="body2"><strong>Tên:</strong> {create.name.trim()}</Typography>
                                    <Typography variant="body2"><strong>Mô tả:</strong> {create.description.trim()}</Typography>
                                    <Typography variant="body2"><strong>Quyền được chọn:</strong> {create.permissionCodes.length}</Typography>
                                </Paper>
                                <PermissionChanges before={[]} after={create.permissionCodes} permissions={permissions} />
                                {createChanges.added.some(code => !permissions.find(p => p.code === code)?.isImplemented) && (
                                    <Alert severity="warning">
                                        Bản sao có quyền cho chức năng chưa có API; quyền đó chưa tạo quyền truy cập thực tế.
                                    </Alert>
                                )}
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving}
                        onClick={() => { if (!createDirty || window.confirm("Bỏ vai trò chưa lưu?")) setDialog(""); }}>
                        Hủy
                    </Button>
                    {createStep > 0 && (
                        <Button onClick={() => setCreateStep(v => v - 1)}>Quay lại</Button>
                    )}
                    {createStep < 2 ? (
                        <Button variant="contained"
                            disabled={createStep === 0 && (!validName(create.name) || create.description.trim().length < 2)}
                            onClick={() => setCreateStep(v => v + 1)}>
                            Tiếp tục
                        </Button>
                    ) : (
                        <Button variant="contained" disabled={saving}
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
                            onClick={saveCreate}>
                            Lưu vai trò
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Edit role */}
            <Dialog open={dialog === "edit"} onClose={saving ? undefined : () => setDialog("")}
                fullWidth maxWidth="sm">
                <DialogTitle fontWeight={800}>Sửa vai trò tùy chỉnh</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField label="Tên vai trò" value={edit.name}
                            onChange={e => setEdit(v => ({ ...v, name: e.target.value }))}
                            error={Boolean(edit.name && !validName(edit.name, selectedId))} />
                        <TextField label="Mô tả" multiline minRows={2} value={edit.description}
                            onChange={e => setEdit(v => ({ ...v, description: e.target.value }))} />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialog("")}>Hủy</Button>
                    <Button variant="contained" disabled={saving || !validName(edit.name, selectedId) || edit.description.trim().length < 2}
                        onClick={saveEdit}>
                        {saving ? <CircularProgress size={18} color="inherit" /> : "Lưu"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete role */}
            <Dialog open={dialog === "delete"} onClose={saving ? undefined : () => setDialog("")}
                fullWidth maxWidth="sm">
                <DialogTitle fontWeight={800} sx={{ color: "#DC2626" }}>
                    Xóa vai trò {selectedRole?.roleName}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        {error && <Alert severity="error">{error}</Alert>}
                        {selectedRole?.userCount ? (
                            <Alert severity="warning">
                                Vai trò đang được gán cho {selectedRole.userCount} tài khoản.
                                Hãy chuyển tài khoản sang vai trò khác trước khi xóa.
                            </Alert>
                        ) : (
                            <Typography>Thao tác này sẽ xóa vai trò tùy chỉnh và các quyền đã gán.</Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialog("")}>Hủy</Button>
                    <Button color="error" variant="contained"
                        disabled={saving || (selectedRole?.userCount > 0)}
                        onClick={removeRole}>
                        Xác nhận xóa
                    </Button>
                </DialogActions>
            </Dialog>

        </Stack>
    );
}
