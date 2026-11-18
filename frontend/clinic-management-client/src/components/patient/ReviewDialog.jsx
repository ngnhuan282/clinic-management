import { useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Rating,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { CloseOutlined, SendOutlined } from "@mui/icons-material";
import { reviewApi } from "../../api/reviewApi";
import { getApiErrorMessage } from "../../utils/errorHandler";
import {
    clinicColors,
    clinicDialogActionsSx,
    clinicDialogPaperSx,
    clinicDialogTitleSx,
    clinicFieldSx,
    clinicPrimaryButtonSx,
    clinicSecondaryButtonSx,
} from "../common/clinicUi";

const ratingLabels = [
    "",
    "1 sao · Chưa hài lòng",
    "2 sao · Cần cải thiện",
    "3 sao · Bình thường",
    "4 sao · Hài lòng",
    "5 sao · Rất hài lòng",
];

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
        setSaving(true);
        setError("");
        try {
            await reviewApi.create({
                appointmentId: appointment.appointmentId,
                rating,
                comment: comment.trim() || null,
            });
            onSaved();
        } catch (requestError) {
            setError(
                requestError.response?.status === 404 && requestError.response?.data?.code === 4001
                    ? "Lịch hẹn này chưa có hồ sơ bệnh nhân được xác nhận. Vui lòng liên hệ quầy tiếp nhận để hoàn tất hồ sơ trước khi đánh giá."
                    : getApiErrorMessage(requestError)
            );
        } finally {
            pending.current = false;
            setSaving(false);
        }
    };

    return (
        <Dialog
            open
            onClose={saving ? undefined : onClose}
            fullWidth
            maxWidth="sm"
            aria-labelledby="review-form-title"
            slotProps={{ paper: { sx: clinicDialogPaperSx } }}
        >
            <DialogTitle id="review-form-title" sx={clinicDialogTitleSx}>
                <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <span>Đánh giá buổi khám</span>
                    <Tooltip title="Đóng biểu mẫu">
                        <span>
                            <IconButton
                                aria-label="Đóng biểu mẫu đánh giá"
                                disabled={saving}
                                onClick={onClose}
                                size="small"
                                sx={{ color: clinicColors.muted }}
                            >
                                <CloseOutlined />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Stack>
            </DialogTitle>
            <Box component="form" onSubmit={submit}>
                <DialogContent sx={{ px: 3, pb: 3 }}>
                    <Stack spacing={2.5}>
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: "12px",
                                bgcolor: "#EAF2FA",
                                border: "1px solid #90BCE6",
                            }}
                        >
                            <Typography sx={{ fontSize: 16.5, fontWeight: 800, color: "#0A2540" }}>
                                {appointment.doctorName}
                            </Typography>
                            <Typography sx={{ mt: 0.4, fontSize: 13.5, color: "#0B4F8A", fontWeight: 700 }}>
                                Lịch hẹn #{appointment.appointmentId} · Đã hoàn thành
                            </Typography>
                        </Box>

                        {error && <Alert severity="error">{error}</Alert>}

                        <Box>
                            <Typography id="review-rating-label" sx={{ fontSize: 14.5, fontWeight: 750, color: "#0A2540", mb: 1 }}>
                                Mức độ hài lòng của bạn về buổi khám:
                            </Typography>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
                                <Rating
                                    name="review-rating"
                                    value={rating}
                                    onChange={(_, value) => setRating(value)}
                                    disabled={saving}
                                    getLabelText={value => `${value} sao`}
                                    aria-labelledby="review-rating-label"
                                    size="large"
                                />
                                <Chip
                                    size="small"
                                    label={ratingLabels[rating] || "Chọn số sao"}
                                    sx={{
                                        bgcolor: "#FFFBEB",
                                        color: "#92400E",
                                        border: "1px solid #FCD34D",
                                        fontWeight: 700,
                                    }}
                                />
                            </Stack>
                        </Box>

                        <TextField
                            fullWidth
                            label="Nhận xét"
                            placeholder="Chia sẻ cảm nhận của bạn về sự tư vấn của bác sĩ và quy trình tiếp đón…"
                            multiline
                            minRows={4}
                            value={comment}
                            onChange={event => setComment(event.target.value)}
                            disabled={saving}
                            helperText={`${comment.length}/500 ký tự · Không bắt buộc`}
                            slotProps={{ htmlInput: { maxLength: 500 } }}
                            sx={clinicFieldSx}
                        />

                        <Typography sx={{ fontSize: 13, color: clinicColors.muted, lineHeight: 1.6 }}>
                            Mỗi lượt khám hoàn tất được gửi một đánh giá để đảm bảo tính khách quan cho cộng đồng bệnh nhân.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={clinicDialogActionsSx}>
                    <Button disabled={saving} onClick={onClose} variant="outlined" sx={clinicSecondaryButtonSx}>
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={<SendOutlined />}
                        sx={clinicPrimaryButtonSx}
                    >
                        {saving ? "Đang gửi..." : "Gửi đánh giá"}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}
