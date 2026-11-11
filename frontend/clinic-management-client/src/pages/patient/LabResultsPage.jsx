import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    InputAdornment,
    LinearProgress,
    MenuItem,
    Pagination,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    FilterListOutlined,
    RefreshOutlined,
    RestartAltOutlined,
    ScienceOutlined,
    SearchOutlined,
    VisibilityOutlined,
} from "@mui/icons-material";
import useLabOrders from "../../hooks/useLabOrders";
import LabResultDialog from "../../components/common/LabResultDialog";
import { positiveId } from "../../utils/notificationNavigation";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import EmptyState from "../../components/common/EmptyState";
import {
    clinicButtonSx,
    clinicColors,
    clinicFieldSx,
    clinicSecondaryButtonSx,
    clinicSurfaceSx,
} from "../../components/common/clinicUi";

const dateText = value => (value ? new Date(value).toLocaleDateString("vi-VN") : "–");
const pageSize = 10;

function LabStatus({ status }) {
    const completed = status === "Completed";
    const pending = status === "Pending";
    const label = completed ? "Đã có kết quả" : pending ? "Đang chờ" : status === "Cancelled" ? "Đã hủy" : status;
    return (
        <Chip
            size="small"
            label={label}
            sx={{
                bgcolor: completed ? "#ECFDF5" : pending ? "#FFFBEB" : "#F1F5F9",
                color: completed ? "#047857" : pending ? "#92400E" : "#64748B",
                fontWeight: 650,
                fontSize: 12,
                borderRadius: "6px",
            }}
        />
    );
}

function ResultContent({ order }) {
    return order.result ? (
        <Stack spacing={1.5}>
            <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: "10px", border: "1px solid #edf2f7" }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "primary.main", mb: 0.75 }}>
                    Kết luận xét nghiệm:
                </Typography>
                <Typography sx={{ fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#1f2937" }}>
                    {order.result.resultSummary}
                </Typography>
            </Box>
            {order.result.note && (
                <Typography sx={{ fontSize: 13.5, color: clinicColors.muted, lineHeight: 1.65, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    Ghi chú kỹ thuật viên: {order.result.note}
                </Typography>
            )}
            {order.result.performedAt && (
                <Typography sx={{ fontSize: 12, color: clinicColors.muted }}>
                    Thực hiện ngày {dateText(order.result.performedAt)}
                </Typography>
            )}
        </Stack>
    ) : (
        <Typography sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: "10px", color: clinicColors.muted, fontSize: 13.5, lineHeight: 1.65, border: "1px dashed #e2e8f0" }}>
            {order.status === "Cancelled"
                ? "Chỉ định xét nghiệm này đã được hủy."
                : "Chưa có kết quả. Bạn có thể bấm Làm mới danh sách để kiểm tra lại sau khi kỹ thuật viên cập nhật."}
        </Typography>
    );
}

export default function LabResultsPage() {
    const { orders, loading, error, reload: loadOrders } = useLabOrders();
    const [params, setParams] = useSearchParams();
    const selectedLabId = positiveId(params.get("labTestId"));
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        return orders.filter(order => {
            const query = search.trim().toLocaleLowerCase("vi");
            return (
                (!query || `${order.id} ${order.labTestTypeName}`.toLocaleLowerCase("vi").includes(query)) &&
                (!status || order.status === status)
            );
        });
    }, [orders, search, status]);

    const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1));
    const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const reset = () => {
        setSearch("");
        setStatus("");
        setPage(0);
    };
    const openDetail = id =>
        setParams(current => {
            current.set("labTestId", String(id));
            return current;
        });
    const closeDetail = () =>
        setParams(current => {
            current.delete("labTestId");
            return current;
        });

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "85vh", py: { xs: 3.5, md: 5.5 } }}>
            <Container maxWidth="lg">
                <Stack spacing={3}>
                    <ClinicPageHeader
                        title="Kết quả xét nghiệm"
                        icon={ScienceOutlined}
                        description="Theo dõi toàn bộ các chỉ định xét nghiệm và đọc kết quả, kết luận y khoa trong hồ sơ của bạn."
                    />

                    {error && (
                        <Alert severity="error" sx={{ borderRadius: "10px" }} action={<Button color="inherit" onClick={loadOrders}>Thử lại</Button>}>
                            {error}
                        </Alert>
                    )}

                    {/* Filter Card */}
                    <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2.5, sm: 3 }, borderRadius: "14px" }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2, color: "primary.main" }}>
                            <FilterListOutlined sx={{ fontSize: 20 }} />
                            <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>
                                Tìm kiếm xét nghiệm
                            </Typography>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Tìm xét nghiệm"
                                placeholder="Nhập tên xét nghiệm hoặc mã số..."
                                value={search}
                                onChange={event => {
                                    setSearch(event.target.value);
                                    setPage(0);
                                }}
                                sx={{ ...clinicFieldSx, flex: 1.4 }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchOutlined sx={{ fontSize: 20, color: "#94A3B8" }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Trạng thái"
                                value={status}
                                onChange={event => {
                                    setStatus(event.target.value);
                                    setPage(0);
                                }}
                                sx={{ ...clinicFieldSx, flex: 1 }}
                            >
                                <MenuItem value="">Tất cả trạng thái</MenuItem>
                                <MenuItem value="Completed">Đã có kết quả</MenuItem>
                                <MenuItem value="Pending">Đang chờ</MenuItem>
                                <MenuItem value="Cancelled">Đã hủy</MenuItem>
                            </TextField>
                            <Button
                                onClick={reset}
                                startIcon={<RestartAltOutlined />}
                                sx={{ ...clinicButtonSx, whiteSpace: "nowrap", borderRadius: "8px" }}
                            >
                                Đặt lại bộ lọc
                            </Button>
                            <Button
                                variant="outlined"
                                disabled={loading}
                                onClick={loadOrders}
                                startIcon={<RefreshOutlined />}
                                sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap", borderRadius: "8px" }}
                            >
                                Làm mới dữ liệu
                            </Button>
                        </Stack>
                    </Paper>

                    {/* Results Grid */}
                    <Box aria-busy={loading}>
                        {loading && <LinearProgress sx={{ mb: 2.5, borderRadius: 1 }} aria-label="Đang tải kết quả xét nghiệm" />}
                        {!loading && !error && (
                            <Typography sx={{ mb: 2, fontSize: 13.5, color: clinicColors.muted, fontWeight: 500 }}>
                                Tìm thấy {filtered.length} chỉ định phù hợp
                            </Typography>
                        )}

                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
                            {loading
                                ? Array.from({ length: 4 }, (_, index) => (
                                      <Paper key={index} variant="outlined" sx={{ ...clinicSurfaceSx, p: 3, borderRadius: "14px" }}>
                                          <Stack spacing={2}>
                                              <Skeleton width="70%" height={30} />
                                              <Skeleton width="40%" />
                                              <Skeleton variant="rounded" height={110} sx={{ borderRadius: "10px" }} />
                                          </Stack>
                                      </Paper>
                                  ))
                                : !error &&
                                  visible.map(order => (
                                      <Paper
                                          key={order.id}
                                          variant="outlined"
                                          sx={{
                                              ...clinicSurfaceSx,
                                              p: { xs: 2.5, sm: 3 },
                                              borderRadius: "14px",
                                              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                              "&:hover": {
                                                  borderColor: "#90caf9",
                                                  boxShadow: "0 6px 18px rgba(25, 118, 210, 0.08)",
                                              },
                                          }}
                                      >
                                          <Stack spacing={2}>
                                              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                                      <Typography
                                                          component="h2"
                                                          sx={{ fontSize: 17, fontWeight: 750, lineHeight: 1.35, color: "#0f2c4d", overflowWrap: "anywhere" }}
                                                      >
                                                          {order.labTestTypeName}
                                                      </Typography>
                                                      <Typography sx={{ mt: 0.5, fontSize: 13, color: clinicColors.muted }}>
                                                          Mã chỉ định: #{order.id} · Ngày tạo: {dateText(order.createdAt)}
                                                      </Typography>
                                                  </Box>
                                                  <LabStatus status={order.status} />
                                              </Stack>

                                              <ResultContent order={order} />

                                              <Box sx={{ borderTop: "1px solid #E2E8F0", pt: 1.5, display: "flex", justifyContent: "flex-end" }}>
                                                  <Button
                                                      size="small"
                                                      startIcon={<VisibilityOutlined />}
                                                      aria-label={`Xem chi tiết xét nghiệm #${order.id}`}
                                                      onClick={() => openDetail(order.id)}
                                                      sx={{ ...clinicButtonSx, borderRadius: "8px", textTransform: "none", fontWeight: 650 }}
                                                  >
                                                      Xem chi tiết chỉ định
                                                  </Button>
                                              </Box>
                                          </Stack>
                                      </Paper>
                                  ))}
                        </Box>

                        {!loading && !error && !visible.length && (
                            <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 4, borderRadius: "14px" }}>
                                <EmptyState
                                    message={
                                        search || status
                                            ? "Không có xét nghiệm phù hợp với bộ lọc tìm kiếm."
                                            : "Bạn chưa có chỉ định xét nghiệm nào trong hồ sơ."
                                    }
                                />
                            </Paper>
                        )}
                    </Box>

                    {/* Pagination */}
                    {!loading && !error && filtered.length > pageSize && (
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, pt: 1 }}
                        >
                            <Typography sx={{ fontSize: 13, color: clinicColors.muted }}>
                                {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)} / {filtered.length} chỉ định
                            </Typography>
                            <Pagination
                                count={Math.ceil(filtered.length / pageSize)}
                                page={currentPage + 1}
                                onChange={(_, value) => setPage(value - 1)}
                                shape="rounded"
                                color="primary"
                                size="small"
                                getItemAriaLabel={(type, value) =>
                                    type === "next" ? "Trang tiếp" : type === "previous" ? "Trang trước" : `Trang ${value}`
                                }
                            />
                        </Stack>
                    )}
                </Stack>
                <LabResultDialog id={selectedLabId} onClose={closeDetail} />
            </Container>
        </Box>
    );
}
