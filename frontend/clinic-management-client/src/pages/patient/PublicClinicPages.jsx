import { useCallback, useState } from "react";
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
    CheckCircleOutlined,
    EmailOutlined,
    ExpandMore,
    HealthAndSafetyOutlined,
    InfoOutlined,
    LocalHospitalOutlined,
    LocationOnOutlined,
    MedicalServicesOutlined,
    PhoneInTalkOutlined,
    PhoneOutlined,
    Search,
    ShieldOutlined,
} from "@mui/icons-material";
import { getDepartments } from "../../api/bookingApi";
import { getPublicServices, getPublicSpecializations, useClinicInfo } from "../../api/publicApi";
import usePublicResource from "../../hooks/usePublicResource";
import PublicPage, { ResourceState } from "../../components/patient/PublicPage";
import { FAQS, GUIDES } from "../../data/publicContent";

const cardSx = {
    p: { xs: 2.75, md: 3.25 },
    borderRadius: "14px",
    borderColor: "#C5D8EC",
    bgcolor: "#FFFFFF",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 1.5,
    boxShadow: "0 2px 8px rgba(10, 37, 64, 0.04)",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    "&:hover": {
        borderColor: "#0B4F8A",
        boxShadow: "0 8px 20px rgba(10, 37, 64, 0.08)",
    },
};

const searchPaperSx = {
    p: 0.75,
    display: "flex",
    alignItems: "center",
    gap: 1,
    borderRadius: "12px",
    border: "2px solid #90BCE6",
    bgcolor: "#FFFFFF",
    "&:focus-within": {
        borderColor: "#0B4F8A",
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
    const clinic = useClinicInfo();
    return (
        <Paper
            elevation={0}
            sx={{
                mt: 5.5,
                p: { xs: 3, md: 4 },
                borderRadius: "16px",
                bgcolor: "#0B3B68",
                color: "#FFFFFF",
                border: "1px solid #082D50",
            }}
        >
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
            >
                <Box sx={{ maxWidth: 600 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                        <CalendarMonthOutlined sx={{ fontSize: 22, color: "#BAE6FD" }} />
                        <Typography
                            component="h2"
                            variant="h5"
                            sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 23 }, color: "#FFFFFF" }}
                        >
                            Chủ động chọn lịch khám phù hợp với bạn
                        </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.65, color: "#E6F0FA" }}>
                        Tra cứu chuyên khoa, chọn bác sĩ uy tín, xem trước giờ trống và gửi đăng ký lịch hẹn trực tuyến chỉ trong vài phút. Hỗ trợ qua tổng đài {clinic.phone}.
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
                        py: 1.35,
                        fontWeight: 800,
                        textTransform: "none",
                        bgcolor: "#FFFFFF",
                        color: "#0A2540",
                        "&:hover": { bgcolor: "#E6F0FA" },
                    }}
                >
                    Đặt lịch khám ngay
                </Button>
            </Stack>
        </Paper>
    );
}

const loadAllPublicSpecializations = () => getPublicSpecializations();

export function SpecialtiesPage() {
    const departmentResource = usePublicResource(getDepartments);
    const specializationResource = usePublicResource(loadAllPublicSpecializations);
    const [query, setQuery] = useState("");

    const allSpecializations = specializationResource.data || [];
    const specializationsForDepartment = department => {
        const fromCatalog = allSpecializations.filter(item => item.departmentId === department.departmentId);
        return fromCatalog.length > 0 ? fromCatalog : department.specializations || [];
    };

    const departments = (departmentResource.data || []).filter(item => {
        const specText = specializationsForDepartment(item)
            .map(spec => `${spec.code || ""} ${spec.name} ${spec.description || ""}`)
            .join(" ");
        return matches(`${item.code || ""} ${item.name} ${item.description || ""} ${specText}`, query);
    });

    const filteredSpecializations = allSpecializations.filter(spec =>
        matches(`${spec.code || ""} ${spec.name} ${spec.description || ""} ${spec.departmentName || ""}`, query)
    );

    const combinedResource =
        departmentResource.status !== "ready"
            ? departmentResource
            : specializationResource.status === "error"
            ? specializationResource
            : departmentResource;

    return (
        <PublicPage
            badge="Danh mục chuyên môn"
            title="Khoa & Chuyên khoa điều trị"
            description="Tìm hiểu danh sách các khoa lâm sàng, danh mục chuyên khoa trực thuộc và lựa chọn bác sĩ phù hợp với nhu cầu chăm sóc sức khỏe của bạn."
        >
            <Paper elevation={0} sx={{ ...searchPaperSx, mb: 4, maxWidth: 580 }}>
                <TextField
                    placeholder="Tìm khoa, chuyên khoa theo tên, mã hoặc triệu chứng..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    fullWidth
                    size="small"
                    slotProps={{
                        htmlInput: { "aria-label": "Tìm chuyên khoa" },
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: "#0B4F8A", ml: 0.5 }} />
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

            <ResourceState resource={combinedResource}>
                {!departments.length && !filteredSpecializations.length && (
                    <Alert severity="info" sx={{ borderRadius: "12px" }}>
                        {query
                            ? "Không tìm thấy khoa hoặc chuyên khoa phù hợp với từ khóa."
                            : "Chưa có khoa hoặc chuyên khoa được công bố."}
                    </Alert>
                )}

                {departments.length > 0 && (
                    <Box component="section" sx={{ mb: filteredSpecializations.length > 0 ? 5.5 : 0 }}>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            sx={{ justifyContent: "space-between", alignItems: { sm: "baseline" }, mb: 2.5, gap: 1 }}
                        >
                            <Typography component="h2" sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 23 }, color: "#0A2540" }}>
                                Danh sách khoa lâm sàng ({departments.length})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Mỗi khoa quản lý các chuyên khoa chuyên sâu và đội ngũ bác sĩ tiếp nhận khám
                            </Typography>
                        </Stack>
                        <Grid container spacing={2.5}>
                            {departments.map(item => {
                                const deptSpecs = specializationsForDepartment(item);
                                return (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.departmentId}>
                                        <Paper variant="outlined" sx={cardSx}>
                                            <Stack
                                                direction="row"
                                                sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 46,
                                                        height: 46,
                                                        borderRadius: "10px",
                                                        bgcolor: "#E6F0FA",
                                                        color: "#0B4F8A",
                                                        display: "grid",
                                                        placeItems: "center",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <LocalHospitalOutlined sx={{ fontSize: 24 }} />
                                                </Box>
                                                {item.code && (
                                                    <Chip
                                                        label={`Khoa ${item.code}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: "#EAF2FA",
                                                            color: "#0B4F8A",
                                                            border: "1px solid #90BCE6",
                                                            fontWeight: 750,
                                                            fontSize: 12,
                                                        }}
                                                    />
                                                )}
                                            </Stack>
                                            <Typography
                                                component="h2"
                                                variant="h6"
                                                sx={{ fontWeight: 800, fontSize: 18, color: "#0A2540" }}
                                            >
                                                {item.name}
                                            </Typography>
                                            <Typography sx={{ flex: 1, lineHeight: 1.65, fontSize: 14, color: "#334155" }}>
                                                {item.description ||
                                                    "Xem thông tin chuyên khoa, đội ngũ bác sĩ và lịch khám đang được công bố."}
                                            </Typography>
                                            {deptSpecs.length > 0 && (
                                                <Box sx={{ pt: 0.5 }}>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ display: "block", color: "#475569", fontWeight: 750, mb: 0.75 }}
                                                    >
                                                        Chuyên khoa trực thuộc ({deptSpecs.length}):
                                                    </Typography>
                                                    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                                                        {deptSpecs.map(spec => (
                                                            <Chip
                                                                key={spec.specializationId}
                                                                label={spec.name}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{
                                                                    borderRadius: "6px",
                                                                    fontSize: 12,
                                                                    fontWeight: 650,
                                                                    bgcolor: "#F4F8FC",
                                                                    borderColor: "#90BCE6",
                                                                    color: "#0A2540",
                                                                }}
                                                            />
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}
                                            <Box sx={{ pt: 1, borderTop: "1px solid #E2ECF5" }}>
                                                <Button
                                                    component={RouterLink}
                                                    to={`/specialties/${item.departmentId}`}
                                                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                                                    sx={{
                                                        textTransform: "none",
                                                        fontWeight: 750,
                                                        px: 0,
                                                        color: "#0B4F8A",
                                                        "&:hover": { bgcolor: "transparent", color: "#083A66" },
                                                    }}
                                                >
                                                    Tìm hiểu chuyên khoa
                                                </Button>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                )}

                {filteredSpecializations.length > 0 && (
                    <Box component="section">
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            sx={{ justifyContent: "space-between", alignItems: { sm: "baseline" }, mb: 2.5, gap: 1 }}
                        >
                            <Typography component="h2" sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 23 }, color: "#0A2540" }}>
                                Danh mục chuyên khoa theo khoa ({filteredSpecializations.length})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Quan hệ khoa chủ quản và chuyên khoa chuyên môn đang hoạt động tại phòng khám
                            </Typography>
                        </Stack>
                        <Grid container spacing={2.5}>
                            {filteredSpecializations.map(spec => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={spec.specializationId}>
                                    <Paper variant="outlined" sx={cardSx}>
                                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
                                            <Chip
                                                icon={<MedicalServicesOutlined sx={{ fontSize: 16 }} />}
                                                label={`Khoa: ${spec.departmentName}`}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: "6px",
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    bgcolor: "#E6F0FA",
                                                    borderColor: "#90BCE6",
                                                    color: "#0B4F8A",
                                                }}
                                            />
                                            {spec.code && (
                                                <Chip
                                                    label={spec.code}
                                                    size="small"
                                                    sx={{
                                                        borderRadius: "6px",
                                                        fontSize: 11.5,
                                                        fontWeight: 750,
                                                        bgcolor: "#F1F5F9",
                                                        color: "#0A2540",
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                        <Typography
                                            component="h3"
                                            variant="h6"
                                            sx={{ fontWeight: 800, fontSize: 17, color: "#0A2540" }}
                                        >
                                            {spec.name}
                                        </Typography>
                                        <Typography sx={{ flex: 1, lineHeight: 1.65, fontSize: 14, color: "#334155" }}>
                                            {spec.description ||
                                                `Chuyên khoa ${spec.name} trực thuộc khoa ${spec.departmentName}, tiếp nhận thăm khám và tư vấn chuyên sâu.`}
                                        </Typography>
                                        <Stack direction="row" spacing={1.5} sx={{ pt: 1, borderTop: "1px solid #E2ECF5", flexWrap: "wrap" }}>
                                            <Button
                                                component={RouterLink}
                                                to={`/specialties/${spec.departmentId}`}
                                                size="small"
                                                sx={{ textTransform: "none", fontWeight: 750, px: 0, color: "#0B4F8A" }}
                                            >
                                                Xem khoa {spec.departmentName}
                                            </Button>
                                            <Button
                                                component={RouterLink}
                                                to={`/doctors?departmentId=${spec.departmentId}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", borderColor: "#B8CCE0", color: "#0A2540" }}
                                            >
                                                Tra cứu bác sĩ
                                            </Button>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </ResourceState>
            <BookingCallout />
        </PublicPage>
    );
}

export function SpecialtyDetailPage() {
    const { departmentId } = useParams();
    const numericDepartmentId = Number(departmentId);
    const departmentResource = usePublicResource(getDepartments);
    const loadSpecializations = useCallback(
        () =>
            Number.isInteger(numericDepartmentId) && numericDepartmentId > 0
                ? getPublicSpecializations(numericDepartmentId)
                : Promise.resolve([]),
        [numericDepartmentId]
    );
    const specializationResource = usePublicResource(loadSpecializations);
    const department = departmentResource.data?.find(item => item.departmentId === numericDepartmentId);
    const specializations =
        specializationResource.data?.length > 0
            ? specializationResource.data
            : department?.specializations || [];
    const information = department?.publicInformation;
    const combinedResource =
        departmentResource.status !== "ready"
            ? departmentResource
            : specializationResource.status === "error"
            ? specializationResource
            : departmentResource;

    return (
        <PublicPage
            badge="Chi tiết khoa lâm sàng"
            title={department?.name || "Thông tin chuyên khoa"}
            description={department?.description}
        >
            <ResourceState resource={combinedResource}>
                {department ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 3, md: 4.5 },
                            borderRadius: "16px",
                            borderColor: "#C5D8EC",
                            bgcolor: "#FFFFFF",
                            boxShadow: "0 2px 12px rgba(10, 37, 64, 0.04)",
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, mb: 3 }}>
                            <Box
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: "12px",
                                    bgcolor: "#0B4F8A",
                                    color: "#FFFFFF",
                                    display: "grid",
                                    placeItems: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <LocalHospitalOutlined sx={{ fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="overline"
                                    sx={{ fontWeight: 750, letterSpacing: "0.05em", color: "#0B4F8A", display: "block", lineHeight: 1.4 }}
                                >
                                    Khoa lâm sàng {department.code ? `· Mã ${department.code}` : ""}
                                </Typography>
                                <Typography component="h2" variant="h5" sx={{ fontWeight: 800, color: "#0A2540" }}>
                                    {department.name}
                                </Typography>
                            </Box>
                        </Box>

                        <Typography component="h3" variant="h6" sx={{ fontWeight: 800, fontSize: 18, mb: 1, color: "#0A2540" }}>
                            Giới thiệu chuyên khoa
                        </Typography>
                        <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.85, fontSize: 15.5, color: "#1E293B", mb: 3.5 }}>
                            {information?.overview ||
                                department.description ||
                                `Khoa ${department.name} đang tiếp nhận đăng ký khám. Xem danh sách chuyên khoa trực thuộc, bác sĩ và chọn lịch khám phù hợp.`}
                        </Typography>

                        <Box component="section" sx={{ mt: 3, mb: 3.5 }}>
                            <Typography component="h3" variant="h6" sx={{ fontWeight: 800, fontSize: 18, mb: 1.75, color: "#0A2540" }}>
                                Chuyên khoa trực thuộc ({specializations.length})
                            </Typography>
                            {specializations.length > 0 ? (
                                <Grid container spacing={2}>
                                    {specializations.map(spec => (
                                        <Grid key={spec.specializationId} size={{ xs: 12, sm: 6 }}>
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2.25,
                                                    height: "100%",
                                                    borderRadius: "12px",
                                                    borderColor: "#B8D4F0",
                                                    bgcolor: "#F4F8FC",
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{ alignItems: "center", mb: 0.75, flexWrap: "wrap" }}
                                                >
                                                    <Typography sx={{ fontWeight: 750, fontSize: 16, color: "#0A2540" }}>
                                                        {spec.name}
                                                    </Typography>
                                                    {spec.code && (
                                                        <Chip
                                                            label={spec.code}
                                                            size="small"
                                                            sx={{
                                                                height: 22,
                                                                fontSize: 11.5,
                                                                fontWeight: 750,
                                                                bgcolor: "#E6F0FA",
                                                                color: "#0B4F8A",
                                                            }}
                                                        />
                                                    )}
                                                </Stack>
                                                <Typography variant="body2" sx={{ lineHeight: 1.65, color: "#334155" }}>
                                                    {spec.description ||
                                                        `Chuyên khoa ${spec.name} trực thuộc khoa ${department.name}.`}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Khoa hiện đang tiếp nhận khám tổng hợp theo phạm vi chuyên môn của đội ngũ bác sĩ trong khoa.
                                </Typography>
                            )}
                        </Box>

                        {information?.focusAreas?.length > 0 && (
                            <Box component="section" sx={{ mt: 3.5, mb: 3.5 }}>
                                <Typography component="h3" variant="h6" sx={{ fontWeight: 800, fontSize: 18, mb: 1.5, color: "#0A2540" }}>
                                    Nhóm vấn đề thường gặp
                                </Typography>
                                <Box
                                    component="ul"
                                    sx={{
                                        listStyle: "none",
                                        p: 0,
                                        m: 0,
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        gap: 1.25,
                                    }}
                                >
                                    {information.focusAreas.map(item => (
                                        <Box
                                            component="li"
                                            key={item}
                                            sx={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 1,
                                                p: 1.5,
                                                borderRadius: "10px",
                                                bgcolor: "#F4F7FA",
                                                border: "1px solid #DCE7F2",
                                            }}
                                        >
                                            <CheckCircleOutlined sx={{ fontSize: 19, color: "#0B4F8A", mt: 0.2, flexShrink: 0 }} />
                                            <Typography sx={{ lineHeight: 1.6, fontSize: 14.5, color: "#1E293B" }}>
                                                {item}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {information?.preparation?.length > 0 && (
                            <Box
                                component="section"
                                sx={{
                                    mt: 3.5,
                                    p: { xs: 2.5, sm: 3 },
                                    bgcolor: "#EAF2FA",
                                    borderRadius: "14px",
                                    border: "1px solid #90BCE6",
                                }}
                            >
                                <Typography
                                    component="h3"
                                    variant="h6"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: 17,
                                        mb: 1.25,
                                        color: "#0B4F8A",
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
                                        "& li": { mb: 0.75, lineHeight: 1.7, fontSize: 14.5, color: "#0A2540" },
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
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontSize: 13.5 }}>
                                Tham khảo nội dung chuyên khoa:{" "}
                                <Link href={information.sourceUrl} target="_blank" rel="noopener noreferrer" underline="hover">
                                    UMC Clinic
                                </Link>
                                . Dịch vụ cụ thể được xác nhận theo lịch và danh mục của phòng khám.
                            </Typography>
                        )}

                        <Divider sx={{ my: 3.5, borderColor: "#DCE7F2" }} />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.75}>
                            <Button
                                component={RouterLink}
                                to={`/booking?departmentId=${department.departmentId}`}
                                variant="contained"
                                size="large"
                                startIcon={<CalendarMonthOutlined />}
                                sx={{
                                    borderRadius: "10px",
                                    px: 3,
                                    fontWeight: 750,
                                    textTransform: "none",
                                    bgcolor: "#0B4F8A",
                                    "&:hover": { bgcolor: "#083A66" },
                                }}
                            >
                                Đăng ký khám chuyên khoa
                            </Button>
                            <Button
                                component={RouterLink}
                                to={`/doctors?departmentId=${department.departmentId}`}
                                variant="outlined"
                                size="large"
                                sx={{
                                    borderRadius: "10px",
                                    px: 2.5,
                                    fontWeight: 700,
                                    textTransform: "none",
                                    borderColor: "#B8CCE0",
                                    color: "#0A2540",
                                }}
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
    const clinic = useClinicInfo();
    const [query, setQuery] = useState("");
    const services = (resource.data || []).filter(item =>
        matches(`${item.name} ${item.description || ""}`, query)
    );

    return (
        <PublicPage
            badge={pricing ? "Niêm yết minh bạch" : "Cận lâm sàng & xét nghiệm"}
            title={pricing ? "Bảng giá dịch vụ y tế" : "Dịch vụ y tế & danh mục xét nghiệm"}
            description="Danh mục phí khám mặc định, phí sổ khám bệnh và các dịch vụ xét nghiệm niêm yết công khai tại phòng khám."
        >
            <Grid container spacing={2.25} sx={{ mb: 3.5 }}>
                {[
                    [
                        "Phí khám ban đầu mặc định",
                        money(clinic.defaultExaminationFee),
                        "Áp dụng cho mỗi lượt khám chuyên khoa tiêu chuẩn",
                    ],
                    [
                        "Phí sổ khám bệnh",
                        money(clinic.patientBookFee),
                        "Áp dụng khi mua sổ mới hoặc cấp lại sổ tại quầy",
                    ],
                    [
                        "Thời lượng khung giờ khám",
                        `${clinic.defaultSlotDurationMinutes} phút`,
                        `Tiếp nhận trong khung giờ ${clinic.hours}`,
                    ],
                ].map(([label, value, helper]) => (
                    <Grid key={label} size={{ xs: 12, md: 4 }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2.75,
                                height: "100%",
                                borderRadius: "14px",
                                borderColor: "#C5D8EC",
                                borderTop: "4px solid #0B4F8A",
                                bgcolor: "#FFFFFF",
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "#0B4F8A",
                                    fontWeight: 750,
                                    fontSize: 12,
                                    textTransform: "uppercase",
                                    display: "block",
                                    mb: 0.75,
                                }}
                            >
                                {label}
                            </Typography>
                            <Typography
                                sx={{
                                    color: "#0A2540",
                                    fontWeight: 800,
                                    fontSize: 24,
                                    mb: 0.5,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {value}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 13.5, color: "#334155" }}>
                                {helper}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3.5, alignItems: { sm: "center" } }}>
                <Paper elevation={0} sx={{ ...searchPaperSx, flex: 1 }}>
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
                                        <Search sx={{ color: "#0B4F8A", ml: 0.5 }} />
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
                        minHeight: 48,
                        px: 2.5,
                        fontWeight: 750,
                        textTransform: "none",
                        borderColor: "#90BCE6",
                        color: "#0B4F8A",
                        bgcolor: "#FFFFFF",
                        "&:hover": { borderColor: "#0B4F8A", bgcolor: "#E6F0FA" },
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
                            borderColor: "#C5D8EC",
                            overflowX: "auto",
                        }}
                    >
                        <Table aria-label="Bảng giá dịch vụ xét nghiệm">
                            <TableHead sx={{ bgcolor: "#EAF2FA" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 13, color: "#0A2540" }}>
                                        TÊN DỊCH VỤ / XÉT NGHIỆM
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: 13, color: "#0A2540" }}>
                                        ĐƠN GIÁ NIÊM YẾT (VNĐ)
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {services.map(item => (
                                    <TableRow
                                        key={item.id}
                                        sx={{
                                            "&:hover": { bgcolor: "#F4F8FC" },
                                            "& td": { borderColor: "#E2ECF5", py: 1.85 },
                                        }}
                                    >
                                        <TableCell sx={{ fontSize: 15, fontWeight: 650, color: "#0A2540" }}>
                                            {item.name}
                                            {item.description && (
                                                <Typography sx={{ fontSize: 13, color: "#475569", mt: 0.3, fontWeight: 400 }}>
                                                    {item.description}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                whiteSpace: "nowrap",
                                                fontWeight: 800,
                                                fontSize: 15.5,
                                                color: "#0B4F8A",
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
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            alignSelf: "flex-start",
                                            borderRadius: "6px",
                                            fontSize: 12,
                                            fontWeight: 750,
                                            bgcolor: "#E6F0FA",
                                            borderColor: "#90BCE6",
                                            color: "#0B4F8A",
                                        }}
                                    />
                                    <Typography
                                        component="h2"
                                        variant="h6"
                                        sx={{ fontWeight: 800, fontSize: 17, color: "#0A2540" }}
                                    >
                                        {item.name}
                                    </Typography>
                                    <Typography sx={{ lineHeight: 1.65, fontSize: 14, color: "#334155", flex: 1 }}>
                                        {item.description ||
                                            "Liên hệ phòng khám để được hướng dẫn về dịch vụ và cách chuẩn bị trước khi thực hiện."}
                                    </Typography>
                                    <Box
                                        sx={{
                                            pt: 1.25,
                                            borderTop: "1px solid #E2ECF5",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "baseline",
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary">
                                            Đơn giá niêm yết:
                                        </Typography>
                                        <Typography
                                            sx={{ fontWeight: 800, fontSize: 18, color: "#0B4F8A", fontVariantNumeric: "tabular-nums" }}
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
                                            fontWeight: 700,
                                            mt: 0.5,
                                            borderColor: "#90BCE6",
                                            color: "#0B4F8A",
                                            "&:hover": { borderColor: "#0B4F8A", bgcolor: "#E6F0FA" },
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
                    bgcolor: "#EAF2FA",
                    border: "1px solid #90BCE6",
                    color: "#0A2540",
                }}
            >
                Đơn giá trên áp dụng cho từng dịch vụ xét nghiệm riêng lẻ. Tổng chi phí một lượt khám sẽ được bác sĩ và nhân viên y tế tư vấn cụ thể tùy theo chỉ định chuyên môn thực tế.
            </Alert>
            <BookingCallout />
        </PublicPage>
    );
}

export function AboutPage() {
    const clinic = useClinicInfo();
    return (
        <PublicPage
            badge="Giới thiệu đơn vị y tế"
            title={`Về phòng khám — ${clinic.name}`}
            description={clinic.description}
        >
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 2.75, md: 3.5 },
                    mb: 3.5,
                    borderRadius: "16px",
                    borderColor: "#90BCE6",
                    bgcolor: "#EAF2FA",
                }}
            >
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 750, textTransform: "uppercase", color: "#0B4F8A" }}>
                            Đơn vị vận hành
                        </Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: "#0A2540", mt: 0.5 }}>
                            {clinic.name}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.25, color: "#334155" }}>
                            {clinic.tagline}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 750, textTransform: "uppercase", color: "#0B4F8A" }}>
                            Khung giờ làm việc
                        </Typography>
                        <Typography sx={{ fontWeight: 750, fontSize: 16, color: "#0A2540", mt: 0.5 }}>
                            {clinic.hours}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.25, color: "#334155" }}>
                            Tổng đài: {clinic.phone}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 750, textTransform: "uppercase", color: "#0B4F8A" }}>
                            Cơ sở tiếp nhận ({clinic.locations.length})
                        </Typography>
                        <Typography sx={{ fontWeight: 750, fontSize: 16, color: "#0A2540", mt: 0.5 }}>
                            {clinic.locations.map(item => item.name).join(" · ")}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.25, color: "#334155", overflowWrap: "anywhere" }}>
                            Email: {clinic.email}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3}>
                {[
                    [
                        "Tìm hiểu trước khi đến khám",
                        "Xem danh sách khoa, chuyên khoa trực thuộc, hồ sơ bác sĩ và đánh giá công khai từ cộng đồng để chủ động đưa ra lựa chọn phù hợp nhất.",
                    ],
                    [
                        "Đăng ký khám thuận tiện",
                        "Tra cứu giờ trống theo lịch làm việc thực tế của bác sĩ và đăng ký nhanh chóng kể cả khi bạn chưa có tài khoản.",
                    ],
                    [
                        "Đồng hành sau buổi khám",
                        "Bệnh nhân có tài khoản dễ dàng theo dõi lịch hẹn, hồ sơ bệnh án, đơn thuốc và kết quả xét nghiệm mọi lúc, mọi nơi.",
                    ],
                ].map(([title, text]) => (
                    <Grid size={{ xs: 12, md: 4 }} key={title}>
                        <Paper variant="outlined" sx={cardSx}>
                            <Box
                                sx={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: "10px",
                                    bgcolor: "#E6F0FA",
                                    color: "#0B4F8A",
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                <HealthAndSafetyOutlined sx={{ fontSize: 24 }} />
                            </Box>
                            <Typography component="h2" variant="h6" sx={{ fontWeight: 800, fontSize: 17.5, color: "#0A2540" }}>
                                {title}
                            </Typography>
                            <Typography sx={{ lineHeight: 1.75, fontSize: 14.5, color: "#334155" }}>
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
                    sx={{ borderRadius: "10px", px: 2.5, fontWeight: 700, textTransform: "none", minHeight: 44, bgcolor: "#FFFFFF" }}
                >
                    Đội ngũ bác sĩ
                </Button>
                <Button
                    component={RouterLink}
                    to="/contact"
                    variant="outlined"
                    sx={{ borderRadius: "10px", px: 2.5, fontWeight: 700, textTransform: "none", minHeight: 44, bgcolor: "#FFFFFF" }}
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
            badge="Hướng dẫn người bệnh"
            title="Cẩm nang & hướng dẫn khách hàng"
            description="Tìm hiểu quy trình đặt lịch, chuẩn bị hồ sơ bệnh án và cách khai thác tối đa tiện ích từ cổng dịch vụ bệnh nhân."
        >
            <Paper elevation={0} sx={{ ...searchPaperSx, mb: 3.5, maxWidth: 580 }}>
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
                                    <Search sx={{ color: "#0B4F8A", ml: 0.5 }} />
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
                                    bgcolor: "#E6F0FA",
                                    border: "1px solid #90BCE6",
                                    color: "#0B4F8A",
                                    fontWeight: 750,
                                    fontSize: 12,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.02em",
                                }}
                            >
                                {article.category}
                            </Box>
                            <Typography component="h2" variant="h6" sx={{ fontWeight: 800, fontSize: 17.5, color: "#0A2540" }}>
                                {article.title}
                            </Typography>
                            <Typography sx={{ flex: 1, lineHeight: 1.7, fontSize: 14, color: "#334155" }}>
                                {article.summary}
                            </Typography>
                            <Button
                                component={RouterLink}
                                to={`/health-guide/${article.slug}`}
                                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                                sx={{
                                    alignSelf: "flex-start",
                                    textTransform: "none",
                                    fontWeight: 750,
                                    px: 0,
                                    color: "#0B4F8A",
                                    "&:hover": { bgcolor: "transparent", color: "#083A66" },
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
                    color: "#0A2540",
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
                            borderColor: "#C5D8EC",
                            bgcolor: "#FFFFFF",
                            "&::before": { display: "none" },
                            "&.Mui-expanded": {
                                borderColor: "#0B4F8A",
                            },
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMore sx={{ color: "#0B4F8A" }} />}
                            id={`faq-${index}`}
                            aria-controls={`faq-answer-${index}`}
                            sx={{ px: 2.5, py: 1.1 }}
                        >
                            <Typography sx={{ fontWeight: 750, fontSize: 15.5, color: "#0A2540" }}>
                                {question}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails id={`faq-answer-${index}`} sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                            <Typography sx={{ lineHeight: 1.8, fontSize: 14.5, color: "#334155" }}>
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
            badge={article?.category || "Cẩm nang y tế"}
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
                            borderColor: "#C5D8EC",
                            bgcolor: "#FFFFFF",
                            mb: 4,
                        }}
                    >
                        {article.sections.map(([title, text], idx) => (
                            <Box
                                component="section"
                                key={title}
                                sx={{
                                    mb: idx === article.sections.length - 1 ? 0 : 3.5,
                                    pb: idx === article.sections.length - 1 ? 0 : 3,
                                    borderBottom: idx === article.sections.length - 1 ? "none" : "1px solid #E2ECF5",
                                }}
                            >
                                <Typography
                                    component="h2"
                                    variant="h6"
                                    sx={{ fontWeight: 800, fontSize: 18.5, mb: 1.25, color: "#0A2540" }}
                                >
                                    {title}
                                </Typography>
                                <Typography sx={{ lineHeight: 1.85, fontSize: 15.5, color: "#1E293B" }}>
                                    {text}
                                </Typography>
                            </Box>
                        ))}
                    </Paper>

                    <Button
                        component={RouterLink}
                        to="/health-guide"
                        variant="outlined"
                        sx={{ borderRadius: "10px", px: 2.5, fontWeight: 700, textTransform: "none", minHeight: 44, bgcolor: "#FFFFFF" }}
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
    const clinic = useClinicInfo();
    return (
        <PublicPage
            badge="Tổng đài & cơ sở y tế"
            title="Liên hệ & cơ sở phòng khám"
            description="Đội ngũ lễ tân và tổng đài viên luôn sẵn sàng tiếp nhận, giải đáp thắc mắc và hỗ trợ đặt lịch khám nhanh chóng."
        >
            <Grid container spacing={3}>
                {/* Contact Card */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper variant="outlined" sx={cardSx}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                            <Box
                                sx={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: "10px",
                                    bgcolor: "#0B4F8A",
                                    color: "#FFFFFF",
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                <PhoneInTalkOutlined sx={{ fontSize: 24 }} />
                            </Box>
                            <Typography component="h2" variant="h5" sx={{ fontWeight: 800, fontSize: 19.5, color: "#0A2540" }}>
                                Thông tin liên hệ
                            </Typography>
                        </Box>

                        <Stack spacing={2.25} sx={{ my: 1.5 }}>
                            <Box sx={{ p: 2, borderRadius: "12px", bgcolor: "#EAF2FA", border: "1px solid #90BCE6", display: "flex", gap: 1.5, alignItems: "center" }}>
                                <PhoneOutlined sx={{ color: "#0B4F8A", fontSize: 23 }} />
                                <Box>
                                    <Typography variant="caption" sx={{ display: "block", color: "#334155", fontWeight: 650 }}>
                                        Tổng đài tư vấn & đặt hẹn
                                    </Typography>
                                    <Link
                                        href={clinic.phoneHref}
                                        underline="hover"
                                        sx={{ fontSize: 19, fontWeight: 800, color: "#0B4F8A" }}
                                    >
                                        {clinic.phone}
                                    </Link>
                                </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                                <EmailOutlined sx={{ color: "#0B4F8A", fontSize: 21 }} />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                        Thư điện tử (Email)
                                    </Typography>
                                    <Link
                                        href={`mailto:${clinic.email}`}
                                        underline="hover"
                                        sx={{ fontSize: 15, color: "#0A2540", fontWeight: 650, overflowWrap: "anywhere" }}
                                    >
                                        {clinic.email}
                                    </Link>
                                </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                                <AccessTimeOutlined sx={{ color: "#0B4F8A", fontSize: 21 }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                        Thời gian tiếp nhận
                                    </Typography>
                                    <Typography sx={{ fontSize: 15, color: "#0A2540", fontWeight: 650 }}>
                                        {clinic.hours}
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
                                mt: "auto",
                                borderRadius: "10px",
                                px: 3,
                                fontWeight: 750,
                                textTransform: "none",
                                bgcolor: "#0B4F8A",
                                "&:hover": { bgcolor: "#083A66" },
                            }}
                        >
                            Đăng ký khám trực tuyến
                        </Button>
                    </Paper>
                </Grid>

                {/* Locations Card */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Stack spacing={2.5}>
                        {clinic.locations.map(location => (
                            <Paper key={location.name} variant="outlined" sx={cardSx}>
                                <Box sx={{ display: "flex", gap: 1.75, alignItems: "flex-start" }}>
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
                                        <LocationOnOutlined sx={{ fontSize: 22 }} />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            component="h2"
                                            variant="h6"
                                            sx={{ fontWeight: 800, fontSize: 17.5, color: "#0A2540" }}
                                        >
                                            {location.name}
                                        </Typography>
                                        <Typography sx={{ mt: 0.5, fontSize: 15, lineHeight: 1.65, color: "#334155" }}>
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
                                                fontSize: 14,
                                                fontWeight: 750,
                                                color: "#0B4F8A",
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
            badge="Cam kết quyền riêng tư y tế"
            title="Thông tin cá nhân khi đăng ký khám & bảo mật"
            description="Cam kết bảo vệ dữ liệu y tế, quyền riêng tư của người bệnh và hướng dẫn sử dụng thông tin an toàn trên cổng trực tuyến."
        >
            <Stack spacing={2.5} sx={{ maxWidth: 840 }}>
                {[
                    [
                        "Thông tin đăng ký khám",
                        "Khi gửi đăng ký khám, bạn cung cấp họ tên, số điện thoại, lý do khám, bác sĩ và giờ khám đã chọn. Phòng khám chỉ sử dụng thông tin này để tiếp nhận, xác nhận lịch hẹn và liên hệ khi có thay đổi.",
                    ],
                    [
                        "Lịch hẹn của khách chưa có tài khoản",
                        "Đăng ký với tư cách khách không tự động tạo tài khoản và không liên kết với tài khoản bạn tạo sau đó. Vui lòng lưu lại mã lịch hẹn để tra cứu hoặc thông báo với lễ tân khi đến khám.",
                    ],
                    [
                        "Truy cập hồ sơ & bệnh án điện tử",
                        "Hồ sơ khám bệnh, đơn thuốc và kết quả xét nghiệm chỉ hiển thị khi bạn đăng nhập tài khoản bệnh nhân và được bảo vệ nghiêm ngặt. Hãy giữ bí mật mật khẩu và đăng xuất khi dùng thiết bị công cộng.",
                    ],
                    [
                        "Quyền chỉnh sửa & hỗ trợ",
                        "Nếu bạn cần cập nhật hoặc điều chỉnh bất kỳ thông tin nào đã cung cấp, vui lòng liên hệ nhân viên tiếp nhận qua tổng đài hoặc trực tiếp tại quầy lễ tân.",
                    ],
                ].map(([title, text]) => (
                    <Paper key={title} variant="outlined" sx={cardSx}>
                        <Box sx={{ display: "flex", gap: 1.75, alignItems: "flex-start" }}>
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: "10px",
                                    bgcolor: "#E6F0FA",
                                    color: "#0B4F8A",
                                    display: "grid",
                                    placeItems: "center",
                                    flexShrink: 0,
                                    mt: 0.15,
                                }}
                            >
                                <ShieldOutlined sx={{ fontSize: 22 }} />
                            </Box>
                            <Box>
                                <Typography
                                    component="h2"
                                    variant="h6"
                                    sx={{ fontWeight: 800, fontSize: 17, color: "#0A2540", mb: 0.75 }}
                                >
                                    {title}
                                </Typography>
                                <Typography sx={{ lineHeight: 1.8, fontSize: 15, color: "#1E293B" }}>
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
                        mt: 1,
                        borderRadius: "10px",
                        px: 2.5,
                        fontWeight: 700,
                        textTransform: "none",
                        minHeight: 44,
                        bgcolor: "#FFFFFF",
                    }}
                >
                    Liên hệ phòng khám
                </Button>
            </Stack>
        </PublicPage>
    );
}
