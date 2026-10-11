import { useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Rating, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { CloseOutlined, SendOutlined } from "@mui/icons-material";
import { reviewApi } from "../../api/reviewApi";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { clinicColors, clinicDialogActionsSx, clinicDialogPaperSx, clinicDialogTitleSx, clinicFieldSx, clinicPrimaryButtonSx, clinicSecondaryButtonSx } from "../common/clinicUi";

const ratingLabels = ["", "1 sao", "2 sao", "3 sao", "4 sao", "5 sao"];

export default function ReviewDialog({ appointment, onClose, onSaved }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const pending = useRef(false);
    const submit = async event => {
        event.preventDefault();
        if (saving || pending.current) return;
        if (!rating || rating < 1 || rating > 5 || comment.length > 500) {
            setError("Chọn từ 1 đến 5 sao; nhận xét tối đa 500 ký tự.");
            return;
        }
        pending.current = true;
        setSaving(true); setError("");
        try {
            await reviewApi.create({ appointmentId: appointment.appointmentId, rating, comment: comment.trim() || null });
            onSaved();
        } catch (requestError) {
            setError(requestError.response?.status === 404 && requestError.response?.data?.code === 4001
                ? "Lịch hẹn này chưa có hồ sơ bệnh nhân được xác nhận. Vui lòng liên hệ quầy tiếp nhận để hoàn tất hồ sơ trước khi đánh giá."
                : getApiErrorMessage(requestError));
        }
        finally { pending.current = false; setSaving(false); }
    };

    return <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="review-form-title" slotProps={{ paper: { sx: clinicDialogPaperSx } }}>
        <DialogTitle id="review-form-title" sx={clinicDialogTitleSx}><Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}><span>Đánh giá buổi khám</span><Tooltip title="Đóng biểu mẫu"><span><IconButton aria-label="Đóng biểu mẫu đánh giá" disabled={saving} onClick={onClose} size="small" sx={{ color: clinicColors.muted }}><CloseOutlined /></IconButton></span></Tooltip></Stack></DialogTitle>
        <Box component="form" onSubmit={submit}>
            <DialogContent sx={{ px: 3, pb: 3 }}><Stack spacing={2.5}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F0F9FF" }}><Typography sx={{ fontSize: 16, fontWeight: 600 }}>{appointment.doctorName}</Typography><Typography sx={{ mt: 0.5, fontSize: 13, color: clinicColors.muted }}>Lịch hẹn #{appointment.appointmentId} · Đã hoàn thành</Typography></Box>
                {error && <Alert severity="error">{error}</Alert>}
                <Box><Typography id="review-rating-label" sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>Bạn đánh giá buổi khám này thế nào?</Typography><Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}><Rating name="review-rating" value={rating} onChange={(_, value) => setRating(value)} disabled={saving} getLabelText={value => `${value} sao`} aria-labelledby="review-rating-label" size="large" /><Typography sx={{ fontSize: 13, color: clinicColors.muted }}>{ratingLabels[rating] || "Chọn số sao"}</Typography></Stack></Box>
                <TextField fullWidth label="Nhận xét" placeholder="Chia sẻ trải nghiệm của bạn về buổi khám…" multiline minRows={4} value={comment} onChange={event => setComment(event.target.value)} disabled={saving} helperText={`${comment.length}/500 ký tự · Không bắt buộc`} slotProps={{ htmlInput: { maxLength: 500 } }} sx={clinicFieldSx} />
                <Typography sx={{ fontSize: 13, color: clinicColors.muted, lineHeight: 1.6 }}>Bạn có thể gửi một đánh giá cho lịch hẹn này.</Typography>
            </Stack></DialogContent>
            <DialogActions sx={clinicDialogActionsSx}><Button disabled={saving} onClick={onClose} variant="outlined" sx={clinicSecondaryButtonSx}>Hủy</Button><Button type="submit" variant="contained" disabled={saving} startIcon={<SendOutlined />} sx={clinicPrimaryButtonSx}>{saving ? "Đang gửi..." : "Gửi đánh giá"}</Button></DialogActions>
        </Box>
    </Dialog>;
}
