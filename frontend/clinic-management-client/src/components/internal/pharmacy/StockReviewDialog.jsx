import { useState } from "react";
import {
    Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
    DialogTitle, IconButton, Stack, TextField, Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleAltOutlined";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import StockShortageTable from "./StockShortageTable";
import { getDispensingPaymentLabel } from "./dispensingStatus";

function StockReviewDialog({ open, detail, loading, error, onClose, onSubmit }) {
    const [note, setNote] = useState("");
    const recipients = detail?.reviewRecipients || [];
    const doctors = recipients.filter((x) => x.department === "Doctor");
    const billing = recipients.filter((x) => x.department === "Billing");
    const missingRecipient = doctors.length === 0 || billing.length === 0;

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm"
            aria-labelledby="stock-review-title" slotProps={{ paper: { sx: { borderRadius: 2, m: { xs: 2, sm: 4 }, width: { xs: "calc(100% - 32px)", sm: "calc(100% - 64px)" } } } }}>
            <DialogTitle id="stock-review-title" sx={{ display: "flex", alignItems: "center", gap: 1.25, borderBottom: "1px solid #E5E9F0" }}>
                <FactCheckOutlinedIcon color="primary" />
                <Typography component="span" sx={{ flex: 1, fontWeight: 800, fontSize: 18 }}>Yêu cầu rà soát thuốc thiếu</Typography>
                <IconButton aria-label="Đóng yêu cầu rà soát" onClick={onClose} disabled={loading}><CloseOutlinedIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ px: 2.5, py: 2, bgcolor: "#EFF6FF", borderBottom: "1px solid #E5E9F0" }}>
                    <Typography sx={{ fontWeight: 800, mb: 0.75, overflowWrap: "anywhere" }}>{detail?.patientName}</Typography>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
                        <Typography color="primary" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{detail?.prescriptionCode}</Typography>
                        <Chip size="small" label={getDispensingPaymentLabel(detail?.paymentStatus)}
                            sx={{ bgcolor: detail?.paymentStatus === "Paid" ? "#ECFDF5" : "#FFFBEB", color: detail?.paymentStatus === "Paid" ? "#047857" : "#B45309" }} />
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.75 }}>SĐT: {detail?.patientPhone || "Chưa có"}</Typography>
                </Box>
                <Stack spacing={2.5} sx={{ p: 2.5 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 1.25, alignItems: "center" }}>
                            <MedicationOutlinedIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Thuốc cần xử lý</Typography>
                        </Stack>
                        <StockShortageTable medicines={(detail?.medicines || []).filter((x) => !x.isFulfillable)} />
                    </Box>
                    <Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
                            <PeopleOutlineIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Bộ phận nhận yêu cầu</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Bác sĩ kê đơn: {doctors.map((x) => x.fullName).join(", ") || "Chưa có tài khoản hoạt động"}</Typography>
                    </Box>
                    <TextField label="Ghi chú đề xuất" multiline minRows={3} fullWidth value={note}
                        onChange={(event) => setNote(event.target.value)} disabled={loading}
                        slotProps={{ htmlInput: { maxLength: 2000 } }}
                        helperText={`${note.length}/2000`} />
                    {missingRecipient && <Alert severity="error">Chưa đủ người nhận đang hoạt động. Vui lòng kiểm tra tài khoản và phân quyền trước khi gửi.</Alert>}
                    <Alert severity="info">Gửi yêu cầu không thay đổi đơn thuốc, hóa đơn hoặc tồn kho.</Alert>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 2.5, py: 2, borderTop: "1px solid #E5E9F0", flexWrap: "wrap", gap: 1 }}>
                <Button onClick={onClose} disabled={loading} variant="outlined">Hủy bỏ</Button>
                <Button startIcon={<SendOutlinedIcon />} variant="contained"
                    disabled={loading || note.trim().length < 3 || missingRecipient || !detail?.canRequestReview}
                    onClick={() => onSubmit({ note: note.trim(), expectedUpdatedAt: detail.updatedAt })}>
                    {loading ? "Đang gửi..." : "Gửi yêu cầu rà soát"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default StockReviewDialog;
