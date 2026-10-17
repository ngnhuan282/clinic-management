import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import StockReviewDecisionHistory from "./StockReviewDecisionHistory";
import StockShortageTable from "./StockShortageTable";
import { getStockReviewRecheckResultConfig, getStockReviewStatusConfig } from "../../../utils/stockReviewWorkflow";

const formatTime = (value) => new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short",
}).format(new Date(value));

function StockReviewHistory({ reviews, footer, showEmptyResponse = true }) {
    if (!reviews?.length) return null;
    return (
        <Box component="section" aria-label="Nhật ký rà soát" sx={{ minWidth: 0,
            "& .MuiTypography-body2": { fontSize: 16, lineHeight: 1.5 }, "& .MuiTypography-caption": { fontSize: 14, lineHeight: 1.45 },
            "& .MuiTypography-subtitle1": { fontSize: 18, lineHeight: 1.5 }, "& .MuiTypography-subtitle2": { fontSize: 16 },
            "& .MuiTableCell-root": { fontSize: 16, lineHeight: 1.5, px: { xs: 1, sm: 2 }, py: 1.25 },
            "& .MuiTableCell-head": { fontSize: 14, letterSpacing: 0 }, "& .MuiChip-root": { fontSize: 13 } }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
                <HistoryOutlinedIcon color="primary" fontSize="small" />
                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>Nhật ký rà soát</Typography>
            </Stack>
            <Stack spacing={3} useFlexGap>
                {reviews.map((review, index) => {
                    const code = `RS-${String(review.reviewId).padStart(5, "0")}`;
                    const status = getStockReviewStatusConfig(review);
                    const recheckResult = getStockReviewRecheckResultConfig(review);
                    const paid = review.paymentStatus === "Paid";
                    const previousRound = index > 0;
                    const frameSx = { minWidth: 0, border: "1px solid #D9E2EF", borderRadius: 1,
                        bgcolor: "#FFFFFF", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" };
                    const heading = <Stack direction="row" useFlexGap sx={{ flex: 1, minWidth: 0, pb: previousRound ? 0 : 1.5, gap: 1,
                        flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", borderBottom: previousRound ? 0 : "1px solid #E5E9F0" }}>
                            <Stack direction="row" useFlexGap sx={{ gap: 1.5, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
                                <Typography component={previousRound ? "span" : "h3"} variant="subtitle2" sx={{ color: "#005DAC", fontWeight: 600 }}>{code}</Typography>
                                {reviews.length > 1 && <Typography variant="caption" sx={{ color: "#6B7280" }}>{index === 0 ? "Vòng mới nhất" : "Vòng trước"}</Typography>}
                            </Stack>
                            <Chip size="small" label={status.label} sx={{ bgcolor: status.background, color: status.color, fontWeight: 700, maxWidth: "100%" }} />
                        </Stack>;
                    const content = <>
                        <Box component="dl" sx={{ m: 0, py: 2, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(3, minmax(0, 1fr))" },
                            gap: 2, borderBottom: "1px solid #E5E9F0", "& > *": { minWidth: 0 } }}>
                            {[
                                { label: "Dược sĩ gửi", value: review.createdByName },
                                { label: "Thời gian gửi", value: formatTime(review.createdAt) },
                                { label: "Thanh toán lúc gửi", value: <>
                                    <Typography component="span" variant="body2" sx={{ color: paid ? "#047857" : "#B45309", fontWeight: 700 }}>{paid ? "Đã thanh toán" : "Chưa thanh toán"}</Typography>
                                    <Typography component="span" variant="caption" sx={{ display: "block", mt: 0.25, color: "#6B7280" }}>{review.invoiceId ? `HD-${String(review.invoiceId).padStart(5, "0")}` : "Chưa có hóa đơn"}</Typography>
                                </> },
                            ].map((field) => <Box key={field.label}>
                                <Typography component="dt" variant="caption" sx={{ color: "#6B7280", fontWeight: 500 }}>{field.label}</Typography>
                                <Typography component="dd" variant="body2" sx={{ m: 0, mt: 0.5, color: "#1F2937", fontWeight: 600, overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>{field.value}</Typography>
                            </Box>)}
                        </Box>
                        <Box component="dl" sx={{ m: 0, py: 2, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "180px minmax(0, 1fr)" }, columnGap: 2, rowGap: 1, alignItems: "start", borderBottom: "1px solid #E5E9F0" }}>
                            <Box component="dt" sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <NotesOutlinedIcon color="primary" fontSize="small" />
                                <Typography component="span" variant="body2" sx={{ color: "#51647D", fontWeight: 500 }}>Nội dung yêu cầu</Typography>
                            </Box>
                            <Typography component="dd" variant="body2" sx={{ m: 0, pl: { xs: 3.5, sm: 0 }, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{review.note}</Typography>
                        </Box>
                        <Box sx={{ py: 2 }}>
                            <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: "center" }}>
                                <Inventory2OutlinedIcon color="primary" fontSize="small" />
                                <Typography component="h4" variant="body2" sx={{ fontWeight: 700 }}>Thuốc thiếu lúc gửi</Typography>
                            </Stack>
                            <StockShortageTable medicines={review.shortages} ariaLabel={`Thuốc thiếu lúc gửi ${code}`} />
                        </Box>
                        {(showEmptyResponse || Boolean(review.decisions?.length)) && <Box>
                            <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
                                <FactCheckOutlinedIcon color="primary" fontSize="small" />
                                <Typography component="h4" variant="body2" sx={{ fontWeight: 700 }}>Phản hồi của bác sĩ</Typography>
                            </Stack>
                            {review.decisions?.length ? <StockReviewDecisionHistory key={`${review.reviewId}-${review.decisions[0].decisionId}`} decisions={review.decisions} />
                                : <Typography variant="body2" sx={{ pl: 3.5, color: "#6B7280" }}>Chưa có phản hồi.</Typography>}
                        </Box>}
                        {review.resolvedAt && recheckResult && <Box component="section" aria-label={`Kết quả kiểm tra vòng ${code}`} sx={{ mt: 2, pt: 2, borderTop: "1px solid #E5E9F0" }}>
                            <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700 }}>Kết quả kiểm tra vòng {code}</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: recheckResult.color, fontWeight: 700 }}>{recheckResult.label}</Typography>
                            <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#6B7280", overflowWrap: "anywhere" }}>{review.resolvedByName} · {formatTime(review.resolvedAt)}</Typography>
                        </Box>}
                    </>;
                    return previousRound ? <Accordion component="article" aria-label={`Yêu cầu ${code}`} key={review.reviewId}
                        disableGutters elevation={0} defaultExpanded={false} slotProps={{ transition: { unmountOnExit: true } }}
                        sx={{ ...frameSx, borderRadius: "8px !important", "&:before": { display: "none" }, "&.Mui-expanded": { m: 0 } }}>
                        <AccordionSummary id={`stock-review-${review.reviewId}-summary`} aria-controls={`stock-review-${review.reviewId}-content`}
                            aria-label={`Chi tiết vòng ${code}`} expandIcon={<ExpandMoreOutlinedIcon />}
                            sx={{ px: { xs: 2, sm: 2.5 }, py: 2, minHeight: 68, gap: 1.5,
                                "& .MuiAccordionSummary-content": { m: 0, minWidth: 0 }, "& .MuiAccordionSummary-expandIconWrapper": { flexShrink: 0 } }}>
                            {heading}
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: { xs: 2, sm: 2.5 }, pt: 0, pb: { xs: 2, sm: 2.5 }, borderTop: "1px solid #E5E9F0" }}>
                            {content}
                        </AccordionDetails>
                    </Accordion> : <Paper component="article" aria-label={`Yêu cầu ${code}`} key={review.reviewId} elevation={0}
                        sx={{ ...frameSx, p: { xs: 2, sm: 2.5 } }}>
                        {heading}
                        {content}
                    </Paper>;
                })}
                {footer && <Box sx={{ minWidth: 0, p: { xs: 2, sm: 2.5 }, border: "1px solid #D9E2EF", borderRadius: 1,
                    bgcolor: "#FFFFFF", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" }}>{footer}</Box>}
            </Stack>
        </Box>
    );
}

export default StockReviewHistory;
