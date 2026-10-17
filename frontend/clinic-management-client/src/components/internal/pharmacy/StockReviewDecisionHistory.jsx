import { useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from "@mui/material";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import { STOCK_REVIEW_OUTCOMES } from "../../../utils/stockReviewDecision";

const formatTime = value => new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short",
}).format(new Date(value));

function ItemValue({ item }) {
    return item ? <>
        <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{item.quantity} {item.unit}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>Liều dùng: {item.dosage}<br />Hướng dẫn: {item.instructions}</Typography>
    </> : <Typography variant="body2" color="text.secondary">Không có trong đơn</Typography>;
}

export default function StockReviewDecisionHistory({ decisions = [] }) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(3);
    const visiblePage = Math.min(page, Math.max(0, Math.ceil(decisions.length / rowsPerPage) - 1));
    const visibleDecisions = decisions.slice(visiblePage * rowsPerPage, (visiblePage + 1) * rowsPerPage);
    return <Stack sx={{ minWidth: 0 }}>
        {visibleDecisions.map(decision => {
            const medicines = new Map([...decision.before.details, ...decision.after.details].map(item => [item.medicineId, item]));
            return <Box component="article" aria-label={`Phản hồi của ${decision.doctorName}`} key={decision.decisionId}
                sx={{ minWidth: 0, "& + &": { mt: 2, pt: 2, borderTop: "1px solid #D6DAE2" } }}>
                <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(3, minmax(0, 1fr))" },
                    gap: 2, pb: 2, "& > *": { minWidth: 0 } }}>
                    {[
                        { label: "Bác sĩ phản hồi", value: decision.doctorName },
                        { label: "Thời gian phản hồi", value: formatTime(decision.createdAt) },
                        { label: "Quyết định", value: <Chip size="small" label={STOCK_REVIEW_OUTCOMES[decision.outcome] || decision.outcome}
                            sx={{ bgcolor: decision.outcome === "AwaitingBilling" ? "#FFFBEB" : "#EFF6FF", color: decision.outcome === "AwaitingBilling" ? "#B45309" : "#005DAC", fontWeight: 700, maxWidth: "100%" }} /> },
                    ].map((field) => <Box key={field.label}>
                        <Typography component="dt" variant="caption" sx={{ color: "#6B7280", fontWeight: 500 }}>{field.label}</Typography>
                        <Typography component="dd" variant="body2" sx={{ m: 0, mt: 0.5, fontWeight: 600, overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>{field.value}</Typography>
                    </Box>)}
                </Box>
                <Box component="dl" sx={{ m: 0, py: 2, borderTop: "1px solid #E5E9F0" }}>
                    <Box component="dt" sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <NotesOutlinedIcon color="primary" fontSize="small" />
                        <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>Lý do xử lý</Typography>
                    </Box>
                    <Typography component="dd" variant="body2" sx={{ m: 0, mt: 1, pl: 3.5, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{decision.reason}</Typography>
                </Box>
                {decision.action === "AdjustPrescription" && <Accordion disableGutters elevation={0} sx={{ borderTop: "1px solid #E5E9F0", borderRadius: "0 !important", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />} sx={{ px: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                            <CompareArrowsOutlinedIcon color="primary" fontSize="small" sx={{ flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Đơn trước / {decision.outcome === "AwaitingBilling" ? "Phương án đề xuất" : "Đơn sau điều chỉnh"}</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, px: 0, pb: 0 }}>
                        <TableContainer sx={{ border: "1px solid #E5E9F0", borderRadius: 1 }}><Table size="small" aria-label="So sánh đơn thuốc trước và sau phản hồi"
                            sx={{ minWidth: 620, tableLayout: "fixed", "& td": { verticalAlign: "top", overflowWrap: "anywhere" }, "& tbody tr:last-child td": { borderBottom: 0 } }}>
                            <TableHead><TableRow sx={{ bgcolor: "#F8FAFC" }}><TableCell>Thuốc</TableCell><TableCell>Trước xử lý</TableCell><TableCell>{decision.outcome === "AwaitingBilling" ? "Đề xuất (chưa áp dụng)" : "Sau xử lý"}</TableCell></TableRow></TableHead>
                            <TableBody>{[...medicines.values()].map(item => <TableRow key={item.medicineId}>
                                <TableCell sx={{ fontWeight: 700 }}>{item.medicineName}</TableCell>
                                <TableCell><ItemValue item={decision.before.details.find(x => x.medicineId === item.medicineId)} /></TableCell>
                                <TableCell><ItemValue item={decision.after.details.find(x => x.medicineId === item.medicineId)} /></TableCell>
                            </TableRow>)}</TableBody>
                        </Table></TableContainer>
                        <Box component="section" aria-label="So sánh lời dặn bác sĩ" sx={{ mt: 2, borderTop: "1px solid #E5E9F0" }}>
                            <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}>
                                {[
                                    { label: "Lời dặn trước", value: decision.before.notes, icon: <NotesOutlinedIcon fontSize="small" sx={{ color: "#6B7280", flexShrink: 0 }} /> },
                                    { label: decision.outcome === "AwaitingBilling" ? "Lời dặn đề xuất (chưa áp dụng)" : "Lời dặn sau", value: decision.after.notes, icon: <EditNoteOutlinedIcon color="primary" fontSize="small" sx={{ flexShrink: 0 }} /> },
                                ].map((field, index) => <Box key={field.label} sx={{ minWidth: 0, pt: 2,
                                    pb: { xs: index === 0 ? 2 : 0, sm: 0 }, pl: { xs: 0, sm: index === 1 ? 2 : 0 }, pr: { xs: 0, sm: index === 0 ? 2 : 0 },
                                    borderLeft: { xs: 0, sm: index === 1 ? "1px solid #E5E9F0" : 0 }, borderTop: { xs: index === 1 ? "1px solid #E5E9F0" : 0, sm: 0 } }}>
                                    <Stack component="dt" direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                        {field.icon}
                                        <Typography component="span" variant="body2" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{field.label}</Typography>
                                    </Stack>
                                    <Typography component="dd" variant="body2" sx={{ m: 0, mt: 1, pl: 3.5, color: field.value ? "#374151" : "#6B7280", lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{field.value || "Không có"}</Typography>
                                </Box>)}
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>}
            </Box>;
        })}
        {decisions.length > 3 && <TablePagination component="div" count={decisions.length} page={visiblePage}
            rowsPerPage={rowsPerPage} rowsPerPageOptions={[3, 5, 10]} labelRowsPerPage="Phản hồi/trang"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
            onPageChange={(_, value) => setPage(value)}
            onRowsPerPageChange={event => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
            getItemAriaLabel={type => type === "next" ? "Phản hồi cũ hơn" : "Phản hồi mới hơn"}
            sx={{ mt: 2, borderTop: "1px solid #E5E9F0", "& .MuiTablePagination-toolbar": { px: 0, flexWrap: "wrap", justifyContent: "flex-end", rowGap: 1 },
                "& .MuiTablePagination-spacer": { display: "none" }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { my: 1 } }} />}
    </Stack>;
}
