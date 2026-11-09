import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { ROLE_LABELS } from "../../../routes/roleAccess";

export default function UserAccessDialog({ manager, roles }) {
    const { action, values, error, busy, change, submit, close } = manager;
    const role = action?.type === "role";
    const status = action?.type === "status";
    return <Dialog open={role || status} onClose={close} fullWidth maxWidth="sm" aria-labelledby="user-access-title">
        <form onSubmit={submit}>
            <DialogTitle id="user-access-title">{role ? "Đổi vai trò tài khoản" : action?.user?.status ? "Khóa tài khoản" : "Mở khóa tài khoản"}</DialogTitle>
            <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
                {error && <Alert severity="error">{error}</Alert>}
                <Typography>{action?.user?.fullName} · {action?.user?.username}</Typography>
                {role && <TextField label="Vai trò mới" select value={values.roleId} disabled={busy} onChange={event => change("roleId", event.target.value)} fullWidth>{roles.map(item => <MenuItem key={item.roleId} value={String(item.roleId)}>{ROLE_LABELS[item.roleName] || item.roleName}</MenuItem>)}</TextField>}
                <Alert severity="info">Thay đổi vai trò hoặc trạng thái sẽ kết thúc phiên đăng nhập hiện tại của tài khoản được cập nhật.</Alert>
            </Stack></DialogContent>
            <DialogActions sx={{ p: 3 }}><Button onClick={close} disabled={busy}>Hủy</Button><Button type="submit" variant="contained" disabled={busy || (role && Number(values.roleId) === action?.user?.roleId)}>{busy ? "Đang lưu…" : "Xác nhận"}</Button></DialogActions>
        </form>
    </Dialog>;
}
