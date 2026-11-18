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
    BiotechOutlined,
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
    clinicPageCanvasSx,
    clinicSecondaryButtonSx,
    clinicSurfaceSx,
} from "../../components/common/clinicUi";

const dateText = value => (value ? new Date(value).toLocaleDateString("vi-VN") : "–");
const pageSize = 10;

function LabStatus({ status }) {
    const completed = status === "Completed";
    const pending = status === "Pending";
    const label = completed
        ? "Đã có kết quả"
        : pending
        ? "Đang chờ"
        : status === "Cancelled"
        ? "Đã hủy"
        : status;
    return (
        <Chip
            size="small"
            variant="outlined"
            label={label}
            sx={{
                bgcolor: completed ? "#ECFDF5" : pending ? "#FFFBEB" : "#F1F5F9",
                color: completed ? "#065F46" : pending ? "#92400E" : "#334155",
                borderColor: completed ? "#6EE7B7" : pending ? "#FCD34D" : "#CBD5E1",
                fontWeight: 700,
                fontSize: 12.5,
                borderRadius: "8px",
                flexShrink: 0,
            }}
        />
    );
}

function ResultContent({ order }) {
    return order.result ? (
        <Stack spacing={1.25}>
            <Box
                sx={{
                    p: 2,
                    bgcolor: "#EAF2FA",
                    borderRadius: "10px",
                    border: "1px solid #90BCE6",
                }}
            >
                <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "#0B4F8A", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                    Kết luận xét nghiệm
                </Typography>
                <Typography
                    sx={{
                        fontSize: 14.5,
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        color: "#0A2540",
                        fontWeight: 600,
                    }}
                >
                    {order.result.resultSummary}
                </Typography>
            </Box>
            {order.result.note && (
                <Typography
                    sx={{
                        fontSize: 13.5,
                        color: "#334155",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                    }}
                >
                    Ghi chú kỹ thuật viên: {order.result.note}
                </Typography>
            )}
            {order.result.performedAt && (
                <Typography sx={{ fontSize: 12.5, color: clinicColors.muted, fontWeight: 550 }}>
                    Thực hiện ngày {dateText(order.result.performedAt)}
                </Typography>
            )}
        </Stack>
    ) : (
        <Typography
            sx={{
                p: 2,
                bgcolor: "#F8FAFC",
                borderRadius: "10px",
                color: clinicColors.muted,
                fontSize: 14,
                lineHeight: 1.65,
                border: "1px dashed #B8CCE0",
            }}
        >
            {order.status === "Cancelled"
                ? "Chỉ định xét nghiệm này đã được hủy."
                : "Chưa có kết quả. Bạn có thể bấm Làm mới để kiểm tra sau khi kỹ thuật viên cập nhật."}
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
        <Box sx={clinicPageCanvasSx}>
            <Container maxWidth="lg">
                <Stack spacing={3}>
                    <ClinicPageHeader
                        eyebrow="Cận lâm sàng & xét nghiệm"
                        title="Kết quả xét nghiệm"
                        icon={ScienceOutlined}
                        description="Theo dõi toàn bộ các chỉ định cận lâm sàng và đọc kết quả, nhận xét chuyên môn trong hồ sơ của bạn."
                    />

                    {error && (
                        <Alert
                            severity="error"
                            sx={{ borderRadius: "10px" }}
                            action={
                                <Button color="inherit" onClick={loadOrders}>
                                    Thử lại
                                </Button>
                            }
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Filter Card */}
                    <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2.5, sm: 3 }, borderRadius: "14px" }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2, color: "primary.main" }}>
                            <FilterListOutlined sx={{ fontSize: 20 }} />
                            <Typography sx={{ fontSize: 15, fontWeight: 750, color: "#0A2540" }}>
                                Tìm kiếm chỉ định xét nghiệm
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
                                                <SearchOutlined sx={{ fontSize: 20, color: "#475569" }} />
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
                                sx={{ ...clinicButtonSx, whiteSpace: "nowrap" }}
                            >
                                Đặt lại
                            </Button>
                            <Button
                                variant="outlined"
                                disabled={loading}
                                onClick={loadOrders}
                                startIcon={<RefreshOutlined />}
                                sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap" }}
                            >
                                Làm mới
                            </Button>
                        </Stack>
                    </Paper>

                    {/* Results Grid */}
                    <Box aria-busy={loading}>
                        {loading && (
                            <LinearProgress sx={{ mb: 2.5, borderRadius: 1 }} aria-label="Đang tải kết quả xét nghiệm" />
                        )}
                        {!loading && !error && (
                            <Typography sx={{ mb: 2, fontSize: 14, color: clinicColors.muted, fontWeight: 650 }}>
                                {filtered.length} chỉ định phù hợp
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
                                              display: "flex",
                                              flexDirection: "column",
                                              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                                              "&:hover": {
                                                  borderColor: "#0B4F8A",
                                                  boxShadow: "0 8px 20px rgba(10, 37, 64, 0.08)",
                                              },
                                          }}
                                      >
                                          <Stack spacing={2} sx={{ flex: 1 }}>
                                              <Stack
                                                  direction="row"
                                                  spacing={1.5}
                                                  sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
                                              >
                                                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", minWidth: 0, flex: 1 }}>
                                                      <Box
                                                          sx={{
                                                              width: 44,
                                                              height: 44,
                                                              borderRadius: "10px",
                                                              bgcolor: "#E6F0FA",
                                                              color: "#0B4F8A",
                                                              display: "grid",
                                                              placeItems: "center",
                                                              flexShrink: 0,
                                                          }}
                                                      >
                                                          <BiotechOutlined sx={{ fontSize: 22 }} />
                                                      </Box>
                                                      <Box sx={{ minWidth: 0 }}>
                                                          <Typography
                                                              component="h2"
                                                              sx={{
                                                                  fontSize: 17,
                                                                  fontWeight: 800,
                                                                  lineHeight: 1.35,
                                                                  color: "#0A2540",
                                                                  overflowWrap: "anywhere",
                                                              }}
                                                          >
                                                              {order.labTestTypeName}
                                                          </Typography>
                                                          <Typography sx={{ mt: 0.4, fontSize: 13, color: clinicColors.muted }}>
                                                              Mã #{order.id} · Ngày tạo: {dateText(order.createdAt)}
                                                          </Typography>
                                                      </Box>
                                                  </Stack>
                                                  <LabStatus status={order.status} />
                                              </Stack>

                                              <Box sx={{ flex: 1 }}>
                                                  <ResultContent order={order} />
                                              </Box>

                                              <Box
                                                  sx={{
                                                      borderTop: "1px solid #E2ECF5",
                                                      pt: 1.5,
                                                      display: "flex",
                                                      justifyContent: "flex-end",
                                                  }}
                                              >
                                                  <Button
                                                      size="small"
                                                      variant="outlined"
                                                      startIcon={<VisibilityOutlined />}
                                                      aria-label={`Xem chi tiết xét nghiệm #${order.id}`}
                                                      onClick={() => openDetail(order.id)}
                                                      sx={{ ...clinicSecondaryButtonSx, minHeight: 38, px: 1.75 }}
                                                  >
                                                      Xem chi tiết
                                                  </Button>
                                              </Box>
                                          </Stack>
                                      </Paper>
                                  ))}
                        </Box>

                        {!loading && !error && !visible.length && (
                            <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 4, borderRadius: "14px" }}>
                                <EmptyState
                                    title={search || status ? "Không tìm thấy kết quả phù hợp" : "Chưa có chỉ định xét nghiệm"}
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
                            <Typography sx={{ fontSize: 13.5, color: clinicColors.muted }}>
                                {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)} /{" "}
                                {filtered.length} chỉ định
                            </Typography>
                            <Pagination
                                count={Math.ceil(filtered.length / pageSize)}
                                page={currentPage + 1}
                                onChange={(_, value) => setPage(value - 1)}
                                shape="rounded"
                                color="primary"
                                size="small"
                                getItemAriaLabel={(type, value) =>
                                    type === "next"
                                        ? "Trang tiếp"
                                        : type === "previous"
                                        ? "Trang trước"
                                        : `Trang ${value}`
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
