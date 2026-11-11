import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    InputAdornment,
    Link,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import {
    AccessTimeOutlined,
    ArrowForward,
    CalendarMonthOutlined,
    EmailOutlined,
    ExpandMore,
    InfoOutlined,
    LocalHospitalOutlined,
    LocationOnOutlined,
    MedicalServicesOutlined,
    PhoneOutlined,
    Search,
    ShieldOutlined,
} from "@mui/icons-material";
import { getDepartments } from "../../api/bookingApi";
import { getPublicServices } from "../../api/publicApi";
import usePublicResource from "../../hooks/usePublicResource";
import PublicPage, { ResourceState } from "../../components/patient/PublicPage";
import { CLINIC, FAQS, GUIDES } from "../../data/publicContent";

const cardSx = {
    p: { xs: 2.75, md: 3.25 },
    borderRadius: "14px",
    borderColor: "#e5e9f0",
    bgcolor: "#ffffff",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 1.5,
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
        borderColor: "#90caf9",
        boxShadow: "0 8px 24px rgba(25, 118, 210, 0.08)",
    },
};

const matches = (text, query) =>
    text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replaceAll("đ", "d")
        .replaceAll("Đ", "D")
        .toLocaleLowerCase("vi")
        .includes(
            query
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replaceAll("đ", "d")
                .replaceAll("Đ", "D")
                .toLocaleLowerCase("vi")
        );

const money = value =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export function BookingCallout() {
    return (
        <Paper
            variant="outlined"
            sx={{
                mt: 5,
                p: { xs: 3, md: 4 },
                borderRadius: "16px",
                borderColor: "#bfdbfe",
                background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)",
                boxShadow: "0 4px 16px rgba(25, 118, 210, 0.08)",
            }}
        >
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
            >
                <Box sx={{ maxWidth: 600 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <CalendarMonthOutlined color="primary" sx={{ fontSize: 22 }} />
                        <Typography
                            component="h2"
                            variant="h5"
                            sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 22 }, color: "#0f2c4d" }}
                        >
                            Chủ động chọn lịch khám của bạn
                        </Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ fontSize: 14.5, lineHeight: 1.6 }}>
                        Tìm chuyên khoa, chọn bác sĩ uy tín, xem trước giờ trống và gửi đăng ký lịch hẹn trực tuyến chỉ trong vài phút.
                    </Typography>
                </Box>
                <Button
                    component={RouterLink}
                    to="/booking"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    sx={{
                        flexShrink: 0,
                        borderRadius: "10px",
                        px: 3,
                        py: 1.25,
                        fontWeight: 700,
                        textTransform: "none",
                        boxShadow: "0 4px 12px rgba(25, 118, 210, 0.25)",
                    }}
                >
                    Đặt lịch khám ngay
                </Button>
            </Stack>
        </Paper>
    );
}

export function SpecialtiesPage() {
    const resource = usePublicResource(getDepartments);
    const [query, setQuery] = useState("");
    const departments = (resource.data || []).filter(item =>
        matches(`${item.name} ${item.description || ""}`, query)
    );

    return (
        <PublicPage
            title="Chuyên khoa điều trị"
            description="Tìm hiểu các chuyên khoa đang hoạt động và lựa chọn bác sĩ phù hợp với nhu cầu chăm sóc sức khỏe của bạn."
        >
            <Paper
                elevation={0}
                sx={{
                    p: 0.75,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    bgcolor: "#ffffff",
                    mb: 4,
                    maxWidth: 560,
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                }}
            >
                <TextField
                    placeholder="Tìm chuyên khoa theo tên hoặc triệu chứng..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    fullWidth
                    size="small"
                    slotProps={{
                        htmlInput: { "aria-label": "Tìm chuyên khoa" },
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: "text.secondary", ml: 0.5 }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{
                        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                        "& .MuiOutlinedInput-root": { bgcolor: "transparent" },
                    }}
                />
            </Paper>

            <ResourceState resource={resource}>
                {!departments.length && (
                    <Alert severity="info" sx={{ borderRadius: "12px" }}>
                        {query ? "Không tìm thấy chuyên khoa phù hợp với từ khóa." : "Chưa có chuyên khoa được công bố."}
                    </Alert>
                )}
                <Grid container spacing={2.5}>
                    {departments.map(item => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.departmentId}>
                            <Paper variant="outlined" sx={cardSx}>
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "10px",
                                        bgcolor: "#eff6ff",
                                        color: "primary.main",
                                        display: "grid",
                                        placeItems: "center",
                                    }}
                                >
                                    <LocalHospitalOutlined sx={{ fontSize: 24 }} />
                                </Box>
                                <Typography component="h2" variant="h6" sx={{ fontWeight: 750, fontSize: 17, color: "#1f2937" }}>
                                    {item.name}
                                </Typography>
                                <Typography color="text.secondary" sx={{ flex: 1, lineHeight: 1.65, fontSize: 13.5 }}>
                                    {item.description || "Xem thông tin chuyên khoa, đội ngũ bác sĩ và lịch khám đang được công bố."}
                                </Typography>
                                <Button
                                    component={RouterLink}
                                    to={`/specialties/${item.departmentId}`}
                                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                                    sx={{
                                        alignSelf: "flex-start",
                                        textTransform: "none",
                                        fontWeight: 650,
                                        px: 0,
                                        "&:hover": { bgcolor: "transparent", color: "primary.dark" },
                                    }}
                                >
                                    Tìm hiểu chuyên khoa
                                </Button>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </ResourceState>
            <BookingCallout />
        </PublicPage>
    );
}

export function SpecialtyDetailPage() {
    const { departmentId } = useParams();
    const resource = usePublicResource(getDepartments);
    const department = resource.data?.find(item => item.departmentId === Number(departmentId));
    const information = department?.publicInformation;

    return (
        <PublicPage
            title={department?.name || "Thông tin chuyên khoa"}
            description={department?.description}
        >
            <ResourceState resource={resource}>
                {department ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 3, md: 4.5 },
                            borderRadius: "16px",
                            borderColor: "#e5e9f0",
                            bgcolor: "#ffffff",
                            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "12px",
                                    bgcolor: "#eff6ff",
                                    color: "primary.main",
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                <LocalHospitalOutlined sx={{ fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: "0.05em" }}>
                                    Chuyên khoa lâm sàng
                                </Typography>
                                <Typography component="h2" variant="h5" sx={{ fontWeight: 800, color: "#0f2c4d" }}>
                                    {department.name}
                                </Typography>
                            </Box>
                        </Box>

                        <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.85, fontSize: 15, color: "#374151", mb: 3 }}>
                            {information?.overview ||
                                department.description ||
                                `Chuyên khoa ${department.name} đang tiếp nhận đăng ký khám. Xem danh sách bác sĩ và chọn lịch khám phù hợp.`}
                        </Typography>

                        {information?.focusAreas?.length > 0 && (
                            <Box component="section" sx={{ mt: 3, mb: 3 }}>
                                <Typography component="h3" variant="h6" sx={{ fontWeight: 750, fontSize: 17, mb: 1.5, color: "#1f2937" }}>
                                    Nhóm vấn đề & bệnh lý thường gặp
                                </Typography>
                                <Box
                                    component="ul"
                                    sx={{
                                        pl: 2.5,
                                        m: 0,
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        gap: 1.25,
                                        "& li": { lineHeight: 1.6, fontSize: 14.5, color: "#4b5563" },
                                    }}
                                >
                                    {information.focusAreas.map(item => (
                                        <Typography component="li" key={item}>
                                            {item}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {information?.preparation?.length > 0 && (
                            <Box
                                component="section"
                                sx={{
                                    mt: 3,
                                    p: 3,
                                    bgcolor: "#eff6ff",
                                    borderRadius: "12px",
                                    border: "1px solid #bfdbfe",
                                }}
                            >
                                <Typography
                                    component="h3"
                                    variant="h6"
                                    sx={{
                                        fontWeight: 750,
                                        fontSize: 16.5,
                                        mb: 1.25,
                                        color: "primary.main",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <InfoOutlined fontSize="small" />
                                    Chuẩn bị trước khi đến khám
                                </Typography>
                                <Box
                                    component="ul"
                                    sx={{
                                        pl: 2.5,
                                        m: 0,
                                        "& li": { mb: 0.75, lineHeight: 1.7, fontSize: 14, color: "#1e3a8a" },
                                    }}
                                >
                                    {information.preparation.map(item => (
                                        <Typography component="li" key={item}>
                                            {item}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {information?.sourceUrl && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontSize: 13 }}>
                                Tham khảo nội dung chuyên khoa:{" "}
                                <Link href={information.sourceUrl} target="_blank" rel="noopener noreferrer" underline="hover">
                                    UMC Clinic
                                </Link>
                                . Dịch vụ cụ thể được xác nhận theo lịch và danh mục của phòng khám.
                            </Typography>
                        )}

                        <Divider sx={{ my: 3.5, borderColor: "#e5e9f0" }} />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <Button
                                component={RouterLink}
                                to={`/booking?departmentId=${department.departmentId}`}
                                variant="contained"
                                size="large"
                                startIcon={<CalendarMonthOutlined />}
                                sx={{ borderRadius: "10px", px: 3, fontWeight: 700, textTransform: "none" }}
                            >
                                Đăng ký khám chuyên khoa
                            </Button>
                            <Button
                                component={RouterLink}
                                to={`/doctors?departmentId=${department.departmentId}`}
                                variant="outlined"
                                size="large"
                                sx={{ borderRadius: "10px", px: 2.5, fontWeight: 600, textTransform: "none" }}
                            >
                                Xem bác sĩ chuyên khoa
                            </Button>
                        </Stack>
                    </Paper>
                ) : (
                    <Alert severity="info" sx={{ borderRadius: "12px" }}>
                        Không tìm thấy chuyên khoa đang hoạt động.{" "}
                        <Link component={RouterLink} to="/specialties">
                            Xem tất cả chuyên khoa
                        </Link>
                    </Alert>
                )}
            </ResourceState>
        </PublicPage>
    );
}

export function ServicesPage({ pricing = false }) {
    const resource = usePublicResource(getPublicServices);
    const [query, setQuery] = useState("");
    const services = (resource.data || []).filter(item =>
        matches(`${item.name} ${item.description || ""}`, query)
    );

    return (
        <PublicPage
            title={pricing ? "Bảng giá dịch vụ y tế" : "Dịch vụ & danh mục xét nghiệm"}
            description="Danh mục các dịch vụ xét nghiệm, chẩn đoán và mức giá niêm yết công khai tại phòng khám. Liên hệ nhân viên để được hướng dẫn chuẩn bị chi tiết."
        >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3.5, alignItems: { sm: "center" } }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 0.75,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        bgcolor: "#ffffff",
                        flex: 1,
                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                    }}
                >
                    <TextField
                        placeholder="Tìm tên dịch vụ, xét nghiệm..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        fullWidth
                        size="small"
                        slotProps={{
                            htmlInput: { "aria-label": "Tìm dịch vụ" },
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: "text.secondary", ml: 0.5 }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{
                            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                            "& .MuiOutlinedInput-root": { bgcolor: "transparent" },
                        }}
                    />
                </Paper>

                <Button
                    component={RouterLink}
                    to={pricing ? "/services" : "/pricing"}
                    variant="outlined"
                    startIcon={<MedicalServicesOutlined />}
                    sx={{
                        flexShrink: 0,
                        borderRadius: "10px",
                        minHeight: 46,
                        px: 2.5,
                        fontWeight: 650,
                        textTransform: "none",
                        borderColor: "#cbd5e1",
                        bgcolor: "#ffffff",
                    }}
                >
                    {pricing ? "Chuyển xem dạng thẻ dịch vụ" : "Xem bảng giá chi tiết"}
                </Button>
            </Stack>

            <ResourceState resource={resource}>
                {!services.length && (
                    <Alert severity="info" sx={{ borderRadius: "12px" }}>
                        {query ? "Không tìm thấy dịch vụ phù hợp." : "Chưa có dịch vụ được công bố."}
                    </Alert>
                )}

                {pricing && services.length > 0 ? (
                    <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{
                            borderRadius: "14px",
                            borderColor: "#e5e9f0",
                            boxShadow: "0 1px 4px rgba(15, 23, 42, 0.03)",
                            overflow: "hidden",
                        }}
                    >
                        <Table aria-label="Bảng giá dịch vụ xét nghiệm">
                            <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13, color: "#475569" }}>
                                        TÊN DỊCH VỤ / XÉT NGHIỆM
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 13, color: "#475569" }}>
                                        ĐƠN GIÁ NIÊM YẾT (VNĐ)
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {services.map(item => (
                                    <TableRow
                                        key={item.id}
                                        sx={{
                                            "&:hover": { bgcolor: "#f8fafc" },
                                            "& td": { borderColor: "#f1f5f9", py: 1.75 },
                                        }}
                                    >
                                        <TableCell sx={{ fontSize: 14.5, fontWeight: 500, color: "#1f2937" }}>
                                            {item.name}
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                whiteSpace: "nowrap",
                                                fontWeight: 750,
                                                fontSize: 15,
                                                color: "primary.main",
                                                fontVariantNumeric: "tabular-nums",
                                            }}
                                        >
                                            {money(item.price)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Grid container spacing={2.5}>
                        {services.map(item => (
                            <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Paper variant="outlined" sx={cardSx}>
                                    <Chip
                                        label="Dịch vụ xét nghiệm"
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            alignSelf: "flex-start",
                                            borderRadius: "6px",
                                            fontSize: 11.5,
                                            fontWeight: 600,
                                            bgcolor: "#f0f9ff",
                                            borderColor: "#bae6fd",
                                        }}
                                    />
                                    <Typography component="h2" variant="h6" sx={{ fontWeight: 750, fontSize: 16.5, color: "#1f2937" }}>
                                        {item.name}
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ lineHeight: 1.65, fontSize: 13.5, flex: 1 }}>
                                        {item.description || "Liên hệ phòng khám để được hướng dẫn về dịch vụ và cách chuẩn bị trước khi thực hiện."}
                                    </Typography>
                                    <Box sx={{ pt: 1, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Đơn giá:
                                        </Typography>
                                        <Typography
                                            color="primary.main"
                                            sx={{ fontWeight: 800, fontSize: 17, fontVariantNumeric: "tabular-nums" }}
                                        >
                                            {money(item.price)}
                                        </Typography>
                                    </Box>
                                    <Button
                                        component={RouterLink}
                                        to="/booking"
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            borderRadius: "8px",
                                            textTransform: "none",
                                            fontWeight: 650,
                                            mt: 1,
                                            borderColor: "#cbd5e1",
                                            "&:hover": { borderColor: "primary.main", bgcolor: "#eff6ff" },
                                        }}
                                    >
                                        Đăng ký khám và tư vấn
                                    </Button>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </ResourceState>

            <Alert
                severity="info"
                sx={{
                    mt: 3.5,
                    borderRadius: "12px",
                    bgcolor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#1e3a8a",
                }}
            >
                Đơn giá trên áp dụng cho từng dịch vụ xét nghiệm riêng lẻ. Tổng chi phí một lượt khám sẽ được nhân viên y tế và bác sĩ tư vấn cụ thể tùy theo phác đồ chỉ định thực tế.
            </Alert>
            <BookingCallout />
        </PublicPage>
    );
}

export function AboutPage() {
    return (
        <PublicPage
            title="Về Phòng Khám Đa Khoa"
            description="Kết nối người bệnh với chuyên khoa, bác sĩ và thông tin khám chữa bệnh trong cùng một nền tảng số hiện đại, an toàn và tận tâm."
        >
            <Grid container spacing={3}>
                {[
                    ["Tìm hiểu trước khi đến khám", "Xem các chuyên khoa đang hoạt động, hồ sơ bác sĩ và đánh giá công khai từ cộng đồng để bạn và gia đình chủ động đưa ra lựa chọn tối ưu."],
                    ["Đăng ký khám thuận tiện", "Tra cứu giờ trống theo lịch làm việc thực tế của bác sĩ và đăng ký nhanh chóng kể cả khi bạn chưa có tài khoản."],
                    ["Đồng hành sau buổi khám", "Bệnh nhân có tài khoản có thể dễ dàng tra cứu lịch hẹn, hồ sơ bệnh án và kết quả xét nghiệm mọi lúc, mọi nơi."],
                ].map(([title, text]) => (
                    <Grid size={{ xs: 12, md: 4 }} key={title}>
                        <Paper variant="outlined" sx={cardSx}>
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "10px",
                                    bgcolor: "#eff6ff",
                                    color: "primary.main",
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                <LocalHospitalOutlined sx={{ fontSize: 24 }} />
                            </Box>
                            <Typography component="h2" variant="h6" sx={{ fontWeight: 750, fontSize: 17, color: "#1f2937" }}>
                                {title}
                            </Typography>
                            <Typography color="text.secondary" sx={{ lineHeight: 1.75, fontSize: 14 }}>
                                {text}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 4 }}>
                <Button
                    component={RouterLink}
                    to="/doctors"
                    variant="outlined"
                    sx={{ borderRadius: "10px", px: 2.5, fontWeight: 650, textTransform: "none", minHeight: 42 }}
                >
                    Đội ngũ bác sĩ
                </Button>
                <Button
                    component={RouterLink}
                    to="/contact"
                    variant="outlined"
                    sx={{ borderRadius: "10px", px: 2.5, fontWeight: 650, textTransform: "none", minHeight: 42 }}
                >
                    Thông tin liên hệ
                </Button>
            </Stack>

            <BookingCallout />
        </PublicPage>
    );
}

export function PatientGuidePage() {
    const [query, setQuery] = useState("");
    const articles = GUIDES.filter(item =>
        matches(`${item.title} ${item.summary} ${item.category}`, query)
    );

    return (
        <PublicPage
            title="Cẩm nang & hướng dẫn khách hàng"
            description="Tìm hiểu quy trình đặt lịch, chuẩn bị hồ sơ bệnh án và cách khai thác tối đa tiện ích từ cổng dịch vụ bệnh nhân."
        >
            <Paper
                elevation={0}
                sx={{
                    p: 0.75,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    bgcolor: "#ffffff",
                    mb: 3.5,
                    maxWidth: 560,
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                }}
            >
                <TextField
                    placeholder="Tìm kiếm bài viết, hướng dẫn đặt lịch..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    fullWidth
                    size="small"
                    slotProps={{
                        htmlInput: { "aria-label": "Tìm bài hướng dẫn" },
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: "text.secondary", ml: 0.5 }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{
                        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                        "& .MuiOutlinedInput-root": { bgcolor: "transparent" },
                    }}
                />
            </Paper>

            {!articles.length && (
                <Alert severity="info" sx={{ borderRadius: "12px", mb: 3 }}>
                    Không tìm thấy bài hướng dẫn phù hợp với từ khóa.
                </Alert>
            )}

            <Grid container spacing={2.5}>
                {articles.map(article => (
                    <Grid key={article.slug} size={{ xs: 12, md: 4 }}>
                        <Paper variant="outlined" sx={cardSx}>
                            <Box
                                sx={{
                                    display: "inline-block",
                                    alignSelf: "flex-start",
                                    px: 1.25,
                                    py: 0.35,
                                    borderRadius: "6px",
                                    bgcolor: "#eff6ff",
                                    color: "primary.main",
                                    fontWeight: 700,
                                    fontSize: 11.5,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.03em",
                                }}
                            >
                                {article.category}
                            </Box>
                            <Typography component="h2" variant="h6" sx={{ fontWeight: 750, fontSize: 17, color: "#1f2937" }}>
                                {article.title}
                            </Typography>
                            <Typography color="text.secondary" sx={{ flex: 1, lineHeight: 1.7, fontSize: 13.5 }}>
                                {article.summary}
                            </Typography>
                            <Button
                                component={RouterLink}
                                to={`/health-guide/${article.slug}`}
                                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                                sx={{
                                    alignSelf: "flex-start",
                                    textTransform: "none",
                                    fontWeight: 650,
                                    px: 0,
                                    "&:hover": { bgcolor: "transparent", color: "primary.dark" },
                                }}
                            >
                                Đọc hướng dẫn
                            </Button>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* FAQs Accordion */}
            <Typography
                component="h2"
                variant="h5"
                sx={{
                    fontWeight: 800,
                    fontSize: { xs: 20, sm: 24 },
                    color: "#0f2c4d",
                    mt: 6,
                    mb: 2.5,
                }}
            >
                Câu hỏi thường gặp
            </Typography>

            <Stack spacing={1.5}>
                {FAQS.map(([question, answer], index) => (
                    <Accordion
                        key={question}
                        disableGutters
                        variant="outlined"
                        sx={{
                            borderRadius: "12px !important",
                            borderColor: "#e5e9f0",
                            bgcolor: "#ffffff",
                            "&::before": { display: "none" },
                            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
                            "&.Mui-expanded": {
                                borderColor: "#90caf9",
                                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.06)",
                            },
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMore sx={{ color: "primary.main" }} />}
                            id={`faq-${index}`}
                            aria-controls={`faq-answer-${index}`}
                            sx={{ px: 2.5, py: 1 }}
                        >
                            <Typography sx={{ fontWeight: 650, fontSize: 15, color: "#1f2937" }}>
                                {question}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails id={`faq-answer-${index}`} sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                            <Typography color="text.secondary" sx={{ lineHeight: 1.8, fontSize: 14 }}>
                                {answer}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Stack>

            <BookingCallout />
        </PublicPage>
    );
}

export function GuideArticlePage() {
    const { slug } = useParams();
    const article = GUIDES.find(item => item.slug === slug);

    return (
        <PublicPage
            title={article?.title || "Không tìm thấy bài hướng dẫn"}
            description={article?.summary}
        >
            {article ? (
                <Box component="article" sx={{ maxWidth: 840 }}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 3, md: 4.5 },
                            borderRadius: "16px",
                            borderColor: "#e5e9f0",
                            bgcolor: "#ffffff",
                            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                            mb: 4,
                        }}
                    >
                        {article.sections.map(([title, text], idx) => (
                            <Box component="section" key={title} sx={{ mb: idx === article.sections.length - 1 ? 0 : 3.5 }}>
                                <Typography
                                    component="h2"
                                    variant="h6"
                                    sx={{ fontWeight: 750, fontSize: 17.5, mb: 1.25, color: "#0f2c4d" }}
                                >
                                    {title}
                                </Typography>
                                <Typography
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.85, fontSize: 15, color: "#374151" }}
                                >
                                    {text}
                                </Typography>
                            </Box>
                        ))}
                    </Paper>

                    <Button
                        component={RouterLink}
                        to="/health-guide"
                        variant="outlined"
                        sx={{ borderRadius: "10px", px: 2.5, fontWeight: 650, textTransform: "none", minHeight: 42 }}
                    >
                        Quay lại cẩm nang hướng dẫn
                    </Button>
                    <BookingCallout />
                </Box>
            ) : (
                <Button component={RouterLink} to="/health-guide" variant="outlined">
                    Về cẩm nang
                </Button>
            )}
        </PublicPage>
    );
}

export function ContactPage() {
    return (
        <PublicPage
            title="Liên hệ & Cơ sở phòng khám"
            description="Đội ngũ hỗ trợ luôn sẵn sàng tiếp nhận, giải đáp thắc mắc và hỗ trợ đặt lịch khám nhanh chóng."
        >
            <Grid container spacing={3}>
                {/* Contact Card */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper variant="outlined" sx={cardSx}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "10px",
                                    bgcolor: "#eff6ff",
                                    color: "primary.main",
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                <PhoneOutlined sx={{ fontSize: 24 }} />
                            </Box>
                            <Typography component="h2" variant="h5" sx={{ fontWeight: 800, fontSize: 19, color: "#0f2c4d" }}>
                                Thông tin liên hệ
                            </Typography>
                        </Box>

                        <Stack spacing={2} sx={{ my: 1 }}>
                            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                                <PhoneOutlined sx={{ color: "primary.main", fontSize: 20 }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                        Tổng đài tư vấn & đặt hẹn
                                    </Typography>
                                    <Link
                                        href={CLINIC.phoneHref}
                                        underline="hover"
                                        sx={{ fontSize: 17, fontWeight: 750, color: "primary.main" }}
                                    >
                                        {CLINIC.phone}
                                    </Link>
                                </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                                <EmailOutlined sx={{ color: "primary.main", fontSize: 20 }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                        Thư điện tử (Email)
                                    </Typography>
                                    <Link
                                        href={`mailto:${CLINIC.email}`}
                                        underline="hover"
                                        sx={{ fontSize: 14.5, color: "#374151", overflowWrap: "anywhere" }}
                                    >
                                        {CLINIC.email}
                                    </Link>
                                </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                                <AccessTimeOutlined sx={{ color: "primary.main", fontSize: 20 }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                        Thời gian làm việc
                                    </Typography>
                                    <Typography sx={{ fontSize: 14.5, color: "#374151", fontWeight: 500 }}>
                                        {CLINIC.hours}
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>

                        <Button
                            component={RouterLink}
                            to="/booking"
                            variant="contained"
                            size="large"
                            startIcon={<CalendarMonthOutlined />}
                            sx={{
                                alignSelf: "flex-start",
                                mt: 2,
                                borderRadius: "10px",
                                px: 3,
                                fontWeight: 700,
                                textTransform: "none",
                            }}
                        >
                            Đăng ký khám trực tuyến
                        </Button>
                    </Paper>
                </Grid>

                {/* Locations Card */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Stack spacing={2.5}>
                        {CLINIC.locations.map(location => (
                            <Paper key={location.name} variant="outlined" sx={cardSx}>
                                <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "10px",
                                            bgcolor: "#eff6ff",
                                            color: "primary.main",
                                            display: "grid",
                                            placeItems: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <LocationOnOutlined sx={{ fontSize: 22 }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography component="h2" variant="h6" sx={{ fontWeight: 750, fontSize: 16.5, color: "#1f2937" }}>
                                            {location.name}
                                        </Typography>
                                        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14, lineHeight: 1.6 }}>
                                            {location.address}
                                        </Typography>
                                        <Link
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            underline="hover"
                                            sx={{
                                                display: "inline-block",
                                                mt: 1.5,
                                                fontSize: 13.5,
                                                fontWeight: 650,
                                                color: "primary.main",
                                            }}
                                        >
                                            Xem đường đi trên Google Maps →
                                        </Link>
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                </Grid>
            </Grid>
        </PublicPage>
    );
}

export function PrivacyPage() {
    return (
        <PublicPage
            title="Thông tin cá nhân & Chính sách dịch vụ"
            description="Cam kết bảo vệ dữ liệu, quyền riêng tư của bệnh nhân và hướng dẫn sử dụng thông tin khi tương tác trên website."
        >
            <Stack spacing={2.5} sx={{ maxWidth: 840 }}>
                {[
                    ["Thông tin đăng ký khám", "Khi gửi đăng ký khám, bạn cung cấp họ tên, số điện thoại, lý do khám, bác sĩ và giờ khám đã chọn. Phòng khám chỉ sử dụng thông tin này để tiếp nhận, xác nhận lịch hẹn và liên hệ khi có thay đổi."],
                    ["Lịch hẹn của khách chưa có tài khoản", "Đăng ký với tư cách khách không tự động tạo tài khoản và không liên kết với tài khoản bạn tạo sau đó. Vui lòng lưu lại mã lịch hẹn để tra cứu hoặc thông báo với lễ tân khi đến khám."],
                    ["Truy cập hồ sơ & bệnh án điện tử", "Hồ sơ khám bệnh, đơn thuốc và kết quả xét nghiệm chỉ hiển thị khi bạn đăng nhập tài khoản bệnh nhân và được mã hóa bảo mật nghiêm ngặt. Hãy bảo mật mật khẩu và đăng xuất khi dùng thiết bị công cộng."],
                    ["Quyền chỉnh sửa & hỗ trợ", "Nếu bạn cần cập nhật hoặc điều chỉnh bất kỳ thông tin nào đã cung cấp, vui lòng liên hệ nhân viên tiếp nhận qua hotline hoặc trực tiếp tại quầy lễ tân."],
                ].map(([title, text]) => (
                    <Paper key={title} variant="outlined" sx={cardSx}>
                        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "8px",
                                    bgcolor: "#eff6ff",
                                    color: "primary.main",
                                    display: "grid",
                                    placeItems: "center",
                                    flexShrink: 0,
                                    mt: 0.25,
                                }}
                            >
                                <ShieldOutlined sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography component="h2" variant="h6" sx={{ fontWeight: 750, fontSize: 16.5, color: "#1f2937", mb: 0.75 }}>
                                    {title}
                                </Typography>
                                <Typography color="text.secondary" sx={{ lineHeight: 1.8, fontSize: 14 }}>
                                    {text}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                ))}

                <Button
                    component={RouterLink}
                    to="/contact"
                    variant="outlined"
                    sx={{
                        alignSelf: "flex-start",
                        mt: 2,
                        borderRadius: "10px",
                        px: 2.5,
                        fontWeight: 650,
                        textTransform: "none",
                        minHeight: 42,
                    }}
                >
                    Liên hệ phòng khám
                </Button>
            </Stack>
        </PublicPage>
    );
}
