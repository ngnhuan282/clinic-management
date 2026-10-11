import { useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Rating, Stack, TextField, Typography } from "@mui/material";
import { reviewApi } from "../../api/reviewApi";
import { getApiErrorMessage } from "../../utils/errorHandler";

export default function ReviewDialog({ appointment, onClose, onSaved }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const submit = async () => {
        if (!rating || rating < 1 || rating > 5 || comment.length > 500) { setError("Chọn từ 1 đến 5 sao; nhận xét tối đa 500 ký tự."); return; }
        setSaving(true);
        setError("");
        try {
            await reviewApi.create({ appointmentId: appointment.appointmentId, rating, comment: comment.trim() || null });
            onSaved();
        } catch (requestError) { setError(getApiErrorMessage(requestError)); }
        finally { setSaving(false); }
    };
    return <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
        <DialogTitle>Đánh giá {appointment.doctorName}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>Lịch hẹn #{appointment.appointmentId} · Đã hoàn thành</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Rating aria-label="Số sao" value={rating} onChange={(_, value) => setRating(value)} disabled={saving} />
            <TextField label="Nhận xét" multiline minRows={3} value={comment} onChange={event => setComment(event.target.value)}
                disabled={saving} helperText={`${comment.length}/500 ký tự`} slotProps={{ htmlInput: { maxLength: 500 } }} />
        </Stack></DialogContent>
        <DialogActions><Button disabled={saving} onClick={onClose}>Hủy</Button>
            <Button variant="contained" disabled={saving} onClick={submit}>{saving ? "Đang gửi..." : "Gửi đánh giá"}</Button></DialogActions>
    </Dialog>;
}
