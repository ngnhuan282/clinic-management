import { useState } from "react";
import { Alert, Box, Button, MenuItem, Pagination, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";

import BookHistoryDialog from "../../components/internal/patientBooks/BookHistoryDialog";
import BookNumberDialog from "../../components/internal/patientBooks/BookNumberDialog";
import PatientBookStatusChip from "../../components/internal/patientBooks/PatientBookStatusChip";
import { PATIENT_BOOK_PAGE_SIZE, usePatientBooks } from "../../hooks/usePatientBooks";

const STATUS_OPTIONS = [
    { value: "Issued", label: "Đang sử dụng" },
    { value: "Pending", label: "Chờ cấp" },
    { value: "Lost", label: "Đã mất" },
    { value: "Replaced", label: "Đã cấp lại" },
    { value: "", label: "Tất cả" },
];

const EMPTY_FILTERS = { search: "", status: "Issued" };

export default function PatientBooksPage() {
    const [draft, setDraft] = useState(EMPTY_FILTERS);
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS, pageNumber: 1 });
    const [action, setAction] = useState(null); // { mode, book }
    const [historyBook, setHistoryBook] = useState(null);
    const [notice, setNotice] = useState("");
    const { status, data, error, reload } = usePatientBooks(filters);

    const applyFilters = event => {
        event.preventDefault();
        setFilters({ ...draft, pageNumber: 1 });
    };

    const finishAction = () => {
        setAction(null);
        setNotice("Đã cập nhật sổ khám.");
        reload();
    };

    const items = data?.items ?? [];
    const totalPages = data?.totalPages ?? 0;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#F6FAFE", minHeight: "100%" }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Sổ khám bệnh</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Tra cứu sổ đang sử dụng, cấp sổ cho hồ sơ đã thanh toán và cấp lại khi sổ bị mất hoặc hư.
            </Typography>

            {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}

            <Paper component="form" onSubmit={applyFilters} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
                    <TextField
                        label="Tìm theo số sổ, tên hoặc SĐT"
                        value={draft.search}
                        onChange={event => setDraft({ ...draft, search: event.target.value })}
                        slotProps={{ htmlInput: { maxLength: 100 } }}
                        fullWidth
                    />
                    <TextField select label="Trạng thái" value={draft.status}
                        onChange={event => setDraft({ ...draft, status: event.target.value })} sx={{ minWidth: 200 }}>
                        {STATUS_OPTIONS.map(option => <MenuItem key={option.label} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                    <Button type="submit" variant="contained">Tìm kiếm</Button>
                </Stack>
            </Paper>

            {status === "loading" && <Typography color="text.secondary">Đang tải danh sách sổ...</Typography>}
            {status === "error" && <Alert severity="error">{error}</Alert>}

            {status === "ready" && items.length === 0 && (
                <Alert severity="info">Không có sổ nào phù hợp với bộ lọc.</Alert>
            )}

            {status === "ready" && items.length > 0 && (
                <>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Số sổ</TableCell>
                                    <TableCell>Bệnh nhân</TableCell>
                                    <TableCell>SĐT</TableCell>
                                    <TableCell>Trạng thái</TableCell>
                                    <TableCell>Ngày cấp</TableCell>
                                    <TableCell align="right">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map(book => (
                                    <TableRow key={book.patientBookId} hover>
                                        <TableCell sx={{ fontFamily: "monospace" }}>
                                            {book.status === "Pending" ? "—" : book.bookNumber}
                                        </TableCell>
                                        <TableCell>{book.patientName}</TableCell>
                                        <TableCell>{book.patientPhone}</TableCell>
                                        <TableCell><PatientBookStatusChip status={book.status} /></TableCell>
                                        <TableCell>{new Date(book.issuedAt).toLocaleDateString("vi-VN")}</TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                                                {book.status === "Pending" && (
                                                    <Button size="small" variant="contained" onClick={() => setAction({ mode: "issue", book })}>Cấp sổ</Button>
                                                )}
                                                {book.status === "Issued" && (
                                                    <>
                                                        <Button size="small" color="error" onClick={() => setAction({ mode: "lost", book })}>Báo mất</Button>
                                                        <Button size="small" onClick={() => setAction({ mode: "replaced", book })}>Đổi sổ hư</Button>
                                                    </>
                                                )}
                                                <Button size="small" onClick={() => setHistoryBook(book)}>Lịch sử</Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {totalPages > 1 && (
                        <Stack sx={{ mt: 2, alignItems: "center" }}>
                            <Pagination page={filters.pageNumber} count={totalPages} color="primary"
                                onChange={(_, pageNumber) => setFilters({ ...filters, pageNumber })} />
                        </Stack>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Mỗi trang {PATIENT_BOOK_PAGE_SIZE} sổ · Tổng {data.totalItems} sổ
                    </Typography>
                </>
            )}

            {action && (
                <BookNumberDialog
                    mode={action.mode}
                    book={action.book}
                    onClose={() => setAction(null)}
                    onDone={finishAction}
                />
            )}
            {historyBook && <BookHistoryDialog book={historyBook} onClose={() => setHistoryBook(null)} />}
        </Box>
    );
}
