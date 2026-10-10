import { useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";

import { updatePatientBookStatus } from "../../../api/patientBookApi";
import getApiErrorMessage from "../../../utils/errorHandler";

const ACTIONS = {
    issue: { title: "Cấp sổ khám", status: "Issued", button: "Cấp sổ", hint: "Nhập số sổ thật đã in cho bệnh nhân." },
    lost: { title: "Báo mất và cấp lại sổ", status: "Lost", button: "Báo mất và cấp lại", hint: "Sổ cũ sẽ chuyển sang trạng thái Đã mất. Nhập số sổ mới để cấp lại." },
    replaced: { title: "Đổi sổ hư", status: "Replaced", button: "Đổi sổ", hint: "Sổ cũ sẽ chuyển sang trạng thái Đã cấp lại. Nhập số sổ mới." },
};

/**
 * @param {{ mode: "issue" | "lost" | "replaced", book: import("../../../api/patientBookApi").PatientBookListItem, onClose: () => void, onDone: () => void }} props
 */
export default function BookNumberDialog({ mode, book, onClose, onDone }) {
    const action = ACTIONS[mode];
    const [bookNumber, setBookNumber] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const submit = async event => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            await updatePatientBookStatus(book.patientBookId, { status: action.status, newBookNumber: bookNumber.trim() });
            onDone();
        } catch (submitError) {
            setError(getApiErrorMessage(submitError));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
            <DialogTitle>{action.title}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {book.patientName} · {book.patientPhone}
                    </Typography>
                    <Typography variant="body2">{action.hint}</Typography>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField
                        autoFocus
                        required
                        label="Số sổ mới"
                        value={bookNumber}
                        onChange={event => setBookNumber(event.target.value)}
                        slotProps={{ htmlInput: { maxLength: 40 } }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Hủy</Button>
                <Button type="submit" variant="contained" disabled={saving || !bookNumber.trim()}>
                    {saving ? "Đang lưu..." : action.button}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
