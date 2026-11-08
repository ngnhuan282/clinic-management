import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Grid, InputAdornment, Link, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { ArrowForward, ExpandMore, LocalHospitalOutlined, Search } from "@mui/icons-material";
import { getDepartments } from "../../api/bookingApi";
import { getPublicServices } from "../../api/publicApi";
import usePublicResource from "../../hooks/usePublicResource";
import PublicPage, { ResourceState } from "../../components/patient/PublicPage";
import { CLINIC, FAQS, GUIDES } from "../../data/publicContent";

const cardSx = { p: { xs: 2.5, md: 3 }, borderRadius: 3, height: "100%", display: "flex", flexDirection: "column", gap: 1.5 };
const matches = (text, query) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll("đ", "d").replaceAll("Đ", "D").toLocaleLowerCase("vi").includes(query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll("đ", "d").replaceAll("Đ", "D").toLocaleLowerCase("vi"));
const money = value => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export function BookingCallout() {
    return <Paper variant="outlined" sx={{ mt: 5, p: { xs: 3, md: 4 }, borderRadius: 3, bgcolor: "#eff6ff" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}   sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
            <Box><Typography component="h2" variant="h5"   sx={{ fontWeight: 750, mb: 1 }}>Chủ động chọn lịch khám của bạn</Typography>
                <Typography color="text.secondary">Chọn bác sĩ, xem giờ trống và gửi đăng ký trực tuyến.</Typography></Box>
            <Button component={RouterLink} to="/booking" variant="contained" endIcon={<ArrowForward />} sx={{ flexShrink: 0 }}>Đặt lịch khám</Button>
        </Stack>
    </Paper>;
}

export function SpecialtiesPage() {
    const resource = usePublicResource(getDepartments);
    const [query, setQuery] = useState("");
    const departments = (resource.data || []).filter(item => matches(`${item.name} ${item.description || ""}`, query));
    return <PublicPage title="Chuyên khoa" description="Tìm hiểu các chuyên khoa đang hoạt động và lựa chọn bác sĩ phù hợp với nhu cầu khám.">
        <TextField fullWidth label="Tìm chuyên khoa" value={query} onChange={e => setQuery(e.target.value)} sx={{ mb: 3 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }} />
        <ResourceState resource={resource}>
            {!departments.length && <Alert severity="info">{query ? "Không tìm thấy chuyên khoa phù hợp." : "Chưa có chuyên khoa được công bố."}</Alert>}
            <Grid container spacing={2.5}>{departments.map(item => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.departmentId}>
                <Paper variant="outlined" sx={cardSx}><LocalHospitalOutlined color="primary" fontSize="large" />
                    <Typography component="h2" variant="h6"  sx={{ fontWeight: 700 }}>{item.name}</Typography>
                    <Typography color="text.secondary" sx={{ flex: 1, lineHeight: 1.7 }}>{item.description || "Xem thông tin chuyên khoa, đội ngũ bác sĩ và lịch khám đang được công bố."}</Typography>
                    <Button component={RouterLink} to={`/specialties/${item.departmentId}`} endIcon={<ArrowForward />} sx={{ alignSelf: "flex-start" }}>Tìm hiểu chuyên khoa</Button>
                </Paper>
            </Grid>)}</Grid>
        </ResourceState>
        <BookingCallout />
    </PublicPage>;
}

export function SpecialtyDetailPage() {
    const { departmentId } = useParams();
    const resource = usePublicResource(getDepartments);
    const department = resource.data?.find(item => item.departmentId === Number(departmentId));
    const information = department?.publicInformation;
    return <PublicPage title={department?.name || "Thông tin chuyên khoa"} description={department?.description}>
        <ResourceState resource={resource}>
            {department ? <Paper variant="outlined" sx={cardSx}>
                <Typography component="h2" variant="h5" sx={{ fontWeight: 750 }}>Giới thiệu chuyên khoa</Typography>
                <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.9 }}>{information?.overview || department.description || `Chuyên khoa ${department.name} đang tiếp nhận đăng ký khám. Xem danh sách bác sĩ và chọn lịch khám phù hợp.`}</Typography>
                {information?.focusAreas?.length > 0 && <Box component="section" sx={{ mt: 2 }}>
                    <Typography component="h2" variant="h6" sx={{ fontWeight: 750, mb: 1 }}>Nhóm vấn đề thường gặp</Typography>
                    <Box component="ul" sx={{ pl: 3, m: 0, "& li": { mb: 1, lineHeight: 1.8 } }}>{information.focusAreas.map(item => <Typography component="li" key={item}>{item}</Typography>)}</Box>
                </Box>}
                {information?.preparation?.length > 0 && <Box component="section" sx={{ mt: 2, p: 2.5, bgcolor: "#eff6ff", borderRadius: 2 }}>
                    <Typography component="h2" variant="h6" sx={{ fontWeight: 750, mb: 1 }}>Chuẩn bị trước khi đến khám</Typography>
                    <Box component="ul" sx={{ pl: 3, m: 0, "& li": { mb: 1, lineHeight: 1.8 } }}>{information.preparation.map(item => <Typography component="li" key={item}>{item}</Typography>)}</Box>
                </Box>}
                {information?.sourceUrl && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Tham khảo nội dung chuyên khoa: <Link href={information.sourceUrl} target="_blank" rel="noopener noreferrer">UMC Clinic</Link>. Dịch vụ cụ thể được xác nhận theo lịch và danh mục của phòng khám.</Typography>}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}  sx={{ mt: 2 }}>
                    <Button component={RouterLink} to={`/doctors?departmentId=${department.departmentId}`} variant="outlined">Xem bác sĩ chuyên khoa</Button>
                    <Button component={RouterLink} to={`/booking?departmentId=${department.departmentId}`} variant="contained">Đăng ký khám chuyên khoa</Button>
                </Stack>
            </Paper> : <Alert severity="info">Không tìm thấy chuyên khoa đang hoạt động. <Link component={RouterLink} to="/specialties">Xem tất cả chuyên khoa</Link></Alert>}
        </ResourceState>
    </PublicPage>;
}

export function ServicesPage({ pricing = false }) {
    const resource = usePublicResource(getPublicServices);
    const [query, setQuery] = useState("");
    const services = (resource.data || []).filter(item => matches(`${item.name} ${item.description || ""}`, query));
    return <PublicPage title={pricing ? "Bảng giá dịch vụ" : "Dịch vụ y tế"} description="Danh mục xét nghiệm và giá dịch vụ đang được phòng khám công bố. Liên hệ phòng khám để được tư vấn về dịch vụ phù hợp.">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            <TextField fullWidth label="Tìm dịch vụ" value={query} onChange={e => setQuery(e.target.value)} />
            <Button component={RouterLink} to={pricing ? "/services" : "/pricing"} variant="outlined" sx={{ flexShrink: 0 }}>{pricing ? "Xem mô tả dịch vụ" : "Xem bảng giá"}</Button>
        </Stack>
        <ResourceState resource={resource}>
            {!services.length && <Alert severity="info">{query ? "Không tìm thấy dịch vụ phù hợp." : "Chưa có dịch vụ được công bố."}</Alert>}
            {pricing && services.length > 0 ? <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                <Table aria-label="Bảng giá dịch vụ xét nghiệm"><TableHead><TableRow><TableCell>Tên dịch vụ</TableCell><TableCell align="right">Đơn giá (VNĐ)</TableCell></TableRow></TableHead>
                    <TableBody>{services.map(item => <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell align="right" sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>{money(item.price)}</TableCell></TableRow>)}</TableBody>
                </Table>
            </TableContainer> : <Grid container spacing={2.5}>{services.map(item => <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper variant="outlined" sx={cardSx}><Chip label="Dịch vụ xét nghiệm" color="primary" variant="outlined" sx={{ alignSelf: "flex-start" }} />
                    <Typography component="h2" variant="h6"  sx={{ fontWeight: 700 }}>{item.name}</Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7, flex: 1 }}>{item.description || "Liên hệ phòng khám để được hướng dẫn về dịch vụ và cách chuẩn bị trước khi thực hiện."}</Typography>
                    <Typography color="primary"  sx={{ fontWeight: 750 }}>{money(item.price)}</Typography>
                    <Button component={RouterLink} to="/booking" variant="outlined">Đăng ký khám và tư vấn</Button>
                </Paper>
            </Grid>)}</Grid>}
        </ResourceState>
        <Alert severity="info" sx={{ mt: 3 }}>Đơn giá áp dụng cho từng dịch vụ, chưa phải tổng chi phí của một lượt khám. Phòng khám sẽ xác nhận các khoản phí theo chỉ định và dịch vụ thực tế.</Alert>
        <BookingCallout />
    </PublicPage>;
}

export function AboutPage() {
    return <PublicPage title="Về phòng khám" description="Kết nối người bệnh với chuyên khoa, bác sĩ và thông tin khám chữa bệnh trong cùng một cổng dịch vụ.">
        <Grid container spacing={3}>{[
            ["Tìm hiểu trước khi đến khám", "Xem các chuyên khoa đang hoạt động, hồ sơ bác sĩ và đánh giá công khai để chủ động lựa chọn."],
            ["Đăng ký khám thuận tiện", "Tra cứu giờ trống theo lịch làm việc của bác sĩ và gửi đăng ký, kể cả khi bạn chưa có tài khoản."],
            ["Đồng hành sau buổi khám", "Bệnh nhân có tài khoản có thể truy cập các lịch hẹn, hồ sơ và kết quả của mình trong cổng bệnh nhân."],
        ].map(([title, text]) => <Grid size={{ xs: 12, md: 4 }} key={title}><Paper variant="outlined" sx={cardSx}>
            <LocalHospitalOutlined color="primary" /><Typography component="h2" variant="h6"  sx={{ fontWeight: 700 }}>{title}</Typography><Typography color="text.secondary"  sx={{ lineHeight: 1.8 }}>{text}</Typography>
        </Paper></Grid>)}</Grid>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}  sx={{ mt: 4 }}><Button component={RouterLink} to="/doctors" variant="outlined">Đội ngũ bác sĩ</Button><Button component={RouterLink} to="/contact" variant="outlined">Thông tin liên hệ</Button></Stack>
        <BookingCallout />
    </PublicPage>;
}

export function PatientGuidePage() {
    const [query, setQuery] = useState("");
    const articles = GUIDES.filter(item => matches(`${item.title} ${item.summary} ${item.category}`, query));
    return <PublicPage title="Cẩm nang & hướng dẫn khách hàng" description="Tìm hiểu cách đặt lịch, chuẩn bị hồ sơ và sử dụng cổng bệnh nhân.">
        <TextField label="Tìm bài hướng dẫn" fullWidth value={query} onChange={e => setQuery(e.target.value)} sx={{ mb: 3 }} />
        {!articles.length && <Alert severity="info">Không tìm thấy bài hướng dẫn phù hợp.</Alert>}
        <Grid container spacing={2.5}>{articles.map(article => <Grid key={article.slug} size={{ xs: 12, md: 4 }}><Paper variant="outlined" sx={cardSx}>
            <Chip label={article.category} size="small" sx={{ alignSelf: "flex-start" }} /><Typography component="h2" variant="h6"  sx={{ fontWeight: 700 }}>{article.title}</Typography>
            <Typography color="text.secondary" sx={{ flex: 1, lineHeight: 1.8 }}>{article.summary}</Typography><Button component={RouterLink} to={`/health-guide/${article.slug}`} endIcon={<ArrowForward />} sx={{ alignSelf: "flex-start" }}>Đọc hướng dẫn</Button>
        </Paper></Grid>)}</Grid>
        <Typography component="h2" variant="h5"  sx={{ fontWeight: 750,  mt: 5, mb: 2  }}>Câu hỏi thường gặp</Typography>
        {FAQS.map(([question, answer], index) => <Accordion key={question} disableGutters variant="outlined"><AccordionSummary expandIcon={<ExpandMore />} id={`faq-${index}`} aria-controls={`faq-answer-${index}`}><Typography  sx={{ fontWeight: 600 }}>{question}</Typography></AccordionSummary><AccordionDetails id={`faq-answer-${index}`}><Typography color="text.secondary"  sx={{ lineHeight: 1.8 }}>{answer}</Typography></AccordionDetails></Accordion>)}
        <BookingCallout />
    </PublicPage>;
}

export function GuideArticlePage() {
    const { slug } = useParams();
    const article = GUIDES.find(item => item.slug === slug);
    return <PublicPage title={article?.title || "Không tìm thấy bài hướng dẫn"} description={article?.summary}>
        {article ? <Box component="article" sx={{ maxWidth: 850 }}>{article.sections.map(([title, text]) => <Box component="section" key={title} sx={{ mb: 4 }}>
            <Typography component="h2" variant="h6"   sx={{ fontWeight: 750, mb: 1 }}>{title}</Typography><Typography  color="text.secondary" sx={{ lineHeight: 1.9 }}>{text}</Typography>
        </Box>)}<Button component={RouterLink} to="/health-guide" variant="outlined">Tất cả bài hướng dẫn</Button><BookingCallout /></Box> : <Button component={RouterLink} to="/health-guide">Về cẩm nang</Button>}
    </PublicPage>;
}

export function ContactPage() {
    return <PublicPage title="Liên hệ & cơ sở phòng khám" description="Liên hệ để được hỗ trợ đăng ký, xác nhận hoặc thay đổi lịch khám.">
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}><Paper variant="outlined" sx={cardSx}>
                <Typography component="h2" variant="h5"  sx={{ fontWeight: 750 }}>Thông tin liên hệ</Typography>
                <Typography>Tổng đài: <Link href={CLINIC.phoneHref}>{CLINIC.phone}</Link></Typography>
                <Typography sx={{ overflowWrap: "anywhere" }}>Email: <Link href={`mailto:${CLINIC.email}`}>{CLINIC.email}</Link></Typography>
                <Typography>Giờ làm việc: {CLINIC.hours}</Typography>
                <Button component={RouterLink} to="/booking" variant="contained" sx={{ alignSelf: "flex-start", mt: 1 }}>Đăng ký khám trực tuyến</Button>
            </Paper></Grid>
            <Grid size={{ xs: 12, md: 7 }}><Stack spacing={3}>{CLINIC.locations.map(location => <Paper key={location.name} variant="outlined" sx={cardSx}>
                <Typography component="h2" variant="h6"  sx={{ fontWeight: 700 }}>{location.name}</Typography><Typography color="text.secondary">{location.address}</Typography>
                <Link href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`} target="_blank" rel="noopener noreferrer">Xem đường đi trên Google Maps</Link>
            </Paper>)}</Stack></Grid>
        </Grid>
    </PublicPage>;
}

export function PrivacyPage() {
    return <PublicPage title="Thông tin cá nhân khi đăng ký khám" description="Tìm hiểu thông tin được gửi và cách sử dụng lịch hẹn trên website.">
        <Stack spacing={3} sx={{ maxWidth: 850 }}>
            {[
                ["Thông tin đăng ký", "Khi gửi đăng ký khám, bạn cung cấp họ tên, số điện thoại, lý do khám, bác sĩ và giờ khám đã chọn. Phòng khám sử dụng thông tin này để tiếp nhận và liên hệ xác nhận lịch."],
                ["Lịch hẹn của khách", "Đăng ký với tư cách khách không tạo tài khoản và không tự động liên kết với tài khoản bạn đăng ký sau đó. Vui lòng giữ mã lịch hẹn và liên hệ tổng đài khi cần thay đổi."],
                ["Truy cập hồ sơ cá nhân", "Hồ sơ khám và kết quả xét nghiệm trên cổng bệnh nhân yêu cầu đăng nhập và được giới hạn theo quyền của tài khoản. Hãy giữ bí mật thông tin đăng nhập và đăng xuất khi dùng thiết bị chung."],
                ["Yêu cầu hỗ trợ", "Nếu cần kiểm tra hoặc điều chỉnh thông tin đã gửi, vui lòng liên hệ phòng khám qua thông tin tại trang Liên hệ."],
            ].map(([title, text]) => <Box key={title}><Typography component="h2" variant="h6"   sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography><Typography color="text.secondary"  sx={{ lineHeight: 1.9 }}>{text}</Typography></Box>)}
            <Button component={RouterLink} to="/contact" variant="outlined" sx={{ alignSelf: "flex-start" }}>Liên hệ phòng khám</Button>
        </Stack>
    </PublicPage>;
}
