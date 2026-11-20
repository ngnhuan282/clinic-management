import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { getLinkableStaffUsers, linkStaffAccount } from "../../../api/staffApi";
import { clinicToast } from "../../common/clinicUi";
import { ROLE_LABELS } from "../../../routes/roleAccess";
import { getApiErrorMessage } from "../../../utils/errorHandler";

function LinkForm({ staff, onClose, onLinked }) {
    const [users, setUsers] = useState(null);
    const [userId, setUserId] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getLinkableStaffUsers()
            .then(result => { if (active) setUsers(result); })
            .catch(requestError => { if (active) { setUsers([]); setError(getApiErrorMessage(requestError)); } });
        return () => { active = false; };
    }, []);

    const submit = async event => {
        event.preventDefault();
        if (busy || !userId) return;
        setBusy(true);
        setError("");
        try {
            await linkStaffAccount(staff.staffId, Number(userId));
            clinicToast.success("Đã liên kết tài khoản cho nhân viên.");
            onLinked();
            onClose();
        } catch (requestError) {
            setError(getApiErrorMessage(requestError));
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <DialogTitle id="staff-link-title">Liên kết tài khoản</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <Typography>
                        {staff.fullName} · {staff.jobPositionName}
                    </Typography>
                    {users && users.length === 0 && !error && (
                        <Alert severity="info">Không còn tài khoản nhân viên nào chưa được liên kết.</Alert>
                    )}
                    <TextField
                        select
                        label="Tài khoản"
                        value={userId}
                        disabled={busy || !users?.length}
                        onChange={event => setUserId(event.target.value)}
                        fullWidth
                    >
                        {(users || []).map(user => (
                            <MenuItem key={user.userId} value={String(user.userId)}>
                                {user.fullName} (@{user.username}) · {ROLE_LABELS[user.role] || user.role}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Alert severity="info">Việc liên kết sẽ kết thúc phiên đăng nhập hiện tại của tài khoản được chọn.</Alert>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} disabled={busy}>
                    Hủy
                </Button>
                <Button type="submit" variant="contained" disabled={busy || !userId}>
                    {busy ? "Đang lưu…" : "Xác nhận"}
                </Button>
            </DialogActions>
        </form>
    );
}

export default function StaffAccountLinkDialog({ manager, onLinked }) {
    const { action, close } = manager;
    const open = action?.type === "link";
    return (
        <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby="staff-link-title">
            {open && <LinkForm key={action.staff.staffId} staff={action.staff} onClose={close} onLinked={onLinked} />}
        </Dialog>
    );
}
