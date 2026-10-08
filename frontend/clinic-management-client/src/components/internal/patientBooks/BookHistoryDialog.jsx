import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";

import { getPatientBookHistory } from "../../../api/patientBookApi";
import getApiErrorMessage from "../../../utils/errorHandler";
import PatientBookStatusChip from "./PatientBookStatusChip";

/**
 * @param {{ book: import("../../../api/patientBookApi").PatientBookListItem, onClose: () => void }} props
 */
export default function BookHistoryDialog({ book, onClose }) {
    const [state, setState] = useState({ status: "loading", items: [], error: "" });

    useEffect(() => {
        let active = true;
        getPatientBookHistory(book.patientBookId)
            .then(items => active && setState({ status: "ready", items, error: "" }))
            .catch(error => active && setState({ status: "error", items: [], error: getApiErrorMessage(error) }));
        return () => { active = false; };
    }, [book.patientBookId]);

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Lịch sử cấp sổ · {book.patientName}</DialogTitle>
            <DialogContent>
                {state.status === "loading" && <Typography color="text.secondary">Đang tải lịch sử...</Typography>}
                {state.status === "error" && <Alert severity="error">{state.error}</Alert>}
                {state.status === "ready" && state.items.length === 0 && (
                    <Alert severity="info">Chưa có lịch sử cấp sổ.</Alert>
                )}
                {state.status === "ready" && state.items.length > 0 && (
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                        {state.items.map((item, index) => (
                            <Stack key={item.patientBookId} direction="row" sx={{ justifyContent: "space-between", alignItems: "center", borderLeft: 3, borderColor: item.patientBookId === book.patientBookId ? "primary.main" : "divider", pl: 2 }}>
                                <Stack>
                                    <Typography fontWeight={600}>
                                        {index + 1}. {item.bookNumber}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Cấp ngày {new Date(item.issuedAt).toLocaleDateString("vi-VN")}
                                        {item.previousBookId ? ` · thay cho sổ #${item.previousBookId}` : ""}
                                    </Typography>
                                </Stack>
                                <PatientBookStatusChip status={item.status} />
                            </Stack>
                        ))}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
}
