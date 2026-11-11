import { useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";

import { updatePatientBookStatus } from "../../../api/patientBookApi";
import { createBookInvoice, markBookInvoicePaid } from "../../../api/receptionApi";
import getApiErrorMessage from "../../../utils/errorHandler";

const ACTIONS = {
    issue: { title: "Cấp sổ khám", status: "Issued", button: "Cấp sổ", hint: "Nhập số sổ thật đã in cho bệnh nhân." },
    lost: { title: "Báo mất và cấp lại sổ", status: "Lost", button: "Báo mất và cấp lại", hint: "Sổ cũ sẽ chuyển sang trạng thái Đã mất. Nhập số tiền cấp lại và số sổ mới." },
    replaced: { title: "Đổi sổ hư", status: "Replaced", button: "Đổi sổ", hint: "Sổ cũ sẽ chuyển sang trạng thái Đã cấp lại. Nhập số tiền cấp lại và số sổ mới." },
};

/**
 * @param {{ mode: "issue" | "lost" | "replaced", book: import("../../../api/patientBookApi").PatientBookListItem, onClose: () => void, onDone: () => void }} props
 */
export default function BookNumberDialog({ mode, book, onClose, onDone }) {
    const action = ACTIONS[mode];
    const isReissue = mode !== "issue";
    const [bookNumber, setBookNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    // Once a reissue invoice is created and paid, its id is kept here so a retry after a later
    // failure (e.g. a duplicate book number) reuses it instead of charging the patient again.
    const [pendingInvoiceId, setPendingInvoiceId] = useState(null);

    const submit = async event => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            const payload = { status: action.status, newBookNumber: bookNumber.trim() };
            if (isReissue) {
                let invoiceId = pendingInvoiceId;
                if (!invoiceId) {
                    const invoice = await createBookInvoice(book.patientId, Number(amount));
                    await markBookInvoicePaid(invoice.bookInvoiceId);
                    invoiceId = invoice.bookInvoiceId;
                    setPendingInvoiceId(invoiceId);
                }
                payload.bookInvoiceId = invoiceId;
            }
            await updatePatientBookStatus(book.patientBookId, payload);
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
                    {isReissue && (
                        <TextField
                            required
                            type="number"
                            label="Số tiền cấp lại (đồng)"
                            value={amount}
                            onChange={event => setAmount(event.target.value)}
                            disabled={Boolean(pendingInvoiceId)}
                            helperText={pendingInvoiceId ? "Đã ghi nhận thanh toán. Chỉ cần nhập số sổ mới để hoàn tất." : undefined}
                            slotProps={{ htmlInput: { min: 1 } }}
                        />
                    )}
                    <TextField
                        autoFocus={!isReissue}
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
                <Button type="submit" variant="contained"
                    disabled={saving || !bookNumber.trim() || (isReissue && !Number(amount))}>
                    {saving ? "Đang lưu..." : action.button}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
