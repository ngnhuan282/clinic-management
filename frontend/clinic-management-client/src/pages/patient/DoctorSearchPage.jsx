import { useState } from "react";
import {
    Alert,
    Box,
    Breadcrumbs,
    Button,
    Chip,
    Container,
    Grid,
    InputAdornment,
    Link,
    MenuItem,
    Pagination,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    ChevronRight,
    FilterAltOutlined,
    HomeOutlined,
    PersonSearchOutlined,
    RestartAltOutlined,
    Search,
} from "@mui/icons-material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";

import { getDepartments } from "../../api/bookingApi";
import { getPublicRooms } from "../../api/roomApi";
import PublicDoctorCard from "../../components/patient/PublicDoctorCard";
import { DOCTOR_PAGE_SIZE, usePublicDoctors } from "../../hooks/usePublicDoctors";
import usePublicResource from "../../hooks/usePublicResource";

const EMPTY_FILTERS = { fullName: "", departmentId: "", roomId: "" };

export default function DoctorSearchPage() {
    const [params, setParams] = useSearchParams();
    const readId = name =>
        /^[1-9]\d{0,9}$/.test(params.get(name) || "") && Number(params.get(name)) <= 2147483647
            ? params.get(name)
            : "";
    const filters = {
        fullName: (params.get("fullName") || "").slice(0, 100),
        departmentId: readId("departmentId"),
        roomId: readId("roomId"),
        pageNumber: Math.min(100000, Math.max(1, Math.floor(Number(params.get("page")) || 1))),
    };

    const [draftState, setDraftState] = useState(null);
    const draft =
        draftState?.key === params.toString()
            ? draftState.values
            : { fullName: filters.fullName, departmentId: filters.departmentId, roomId: filters.roomId };
    const setDraft = values => setDraftState({ key: params.toString(), values });

    const departmentResource = usePublicResource(getDepartments);
    const roomResource = usePublicResource(getPublicRooms);
    const departments = departmentResource.data || [];
    const rooms = roomResource.data || [];

    const { status, data, error, retry } = usePublicDoctors(filters);

    const setFilters = next => {
        setDraftState(null);
        setParams(
            Object.fromEntries(
                Object.entries({
                    fullName: next.fullName.trim(),
                    departmentId: next.departmentId,
                    roomId: next.roomId,
                    page: next.pageNumber > 1 ? next.pageNumber : "",
                }).filter(([, value]) => value !== "")
            )
        );
    };

    const applyFilters = event => {
        event.preventDefault();
        setFilters({ ...draft, pageNumber: 1 });
    };

    const resetFilters = () => {
        setDraft(EMPTY_FILTERS);
        setFilters({ ...EMPTY_FILTERS, pageNumber: 1 });
    };

    const totalPages = data?.totalPages ?? 0;
    const doctors = data?.items ?? [];
    const activeDepartment = departments.find(d => String(d.departmentId) === filters.departmentId);
    const activeRoom = rooms.find(r => String(r.roomId) === filters.roomId);

    return (
        <Box sx={{ bgcolor: "#F4F7FA", minHeight: "82vh", pb: { xs: 5, md: 7 } }}>
            {/* Solid Calm Blue Header Band */}
            <Box
                sx={{
                    pt: { xs: 3, md: 4.5 },
                    pb: { xs: 3.5, md: 5 },
                    mb: { xs: 3, md: 4 },
                    bgcolor: "#EAF2FA",
                    borderBottom: "1px solid #C5D8EC",
                }}
            >
                <Container maxWidth="lg">
                    <Breadcrumbs
                        separator={<ChevronRight sx={{ fontSize: 16, color: "#64748B" }} />}
                        aria-label="Đường dẫn"
                        sx={{ mb: { xs: 2, md: 2.5 }, fontSize: 14 }}
                    >
                        <Link
                            component={RouterLink}
                            to="/"
                            underline="hover"
                            sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#334155", fontWeight: 550 }}
                        >
                            <HomeOutlined sx={{ fontSize: 17 }} />
                            Trang chủ
                        </Link>
                        <Typography color="primary.main" sx={{ fontSize: "inherit", fontWeight: 750 }}>
                            Đội ngũ bác sĩ
                        </Typography>
                    </Breadcrumbs>

                    <Box sx={{ maxWidth: 780 }}>
                        <Typography
                            component="h1"
                            sx={{
                                fontSize: { xs: 26, sm: 32, md: 38 },
                                fontWeight: 800,
                                letterSpacing: "-0.02em",
                                color: "#0A2540",
                                lineHeight: 1.25,
                                mb: 1.25,
                            }}
                        >
                            Tra cứu bác sĩ chuyên khoa
                        </Typography>
                        <Typography sx={{ fontSize: { xs: 15, sm: 16 }, lineHeight: 1.7, color: "#334155" }}>
                            Tìm kiếm bác sĩ theo họ tên, chuyên khoa điều trị hoặc phòng khám tiếp nhận để chủ động lựa chọn trước khi đặt lịch.
                        </Typography>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg">
                {/* Single Filter Form Card */}
                <Paper
                    component="form"
                    onSubmit={applyFilters}
                    variant="outlined"
                    sx={{
                        p: { xs: 2.5, sm: 3 },
                        mb: 3.5,
                        borderRadius: "14px",
                        borderColor: "#C5D8EC",
                        bgcolor: "#FFFFFF",
                        boxShadow: "0 2px 10px rgba(10, 37, 64, 0.04)",
                    }}
                >
                    <Stack spacing={2.25}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                                <FilterAltOutlined fontSize="small" />
                                <Typography sx={{ fontWeight: 750, fontSize: 15.5, color: "#0A2540" }}>
                                    Bộ lọc tìm kiếm bác sĩ
                                </Typography>
                            </Box>
                            {(filters.fullName || filters.departmentId || filters.roomId) && (
                                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                                    {filters.fullName && (
                                        <Chip
                                            size="small"
                                            label={`Từ khóa: "${filters.fullName}"`}
                                            sx={{ bgcolor: "#E6F0FA", color: "#0B4F8A", fontWeight: 700 }}
                                        />
                                    )}
                                    {activeDepartment && (
                                        <Chip
                                            size="small"
                                            label={`Khoa: ${activeDepartment.name}`}
                                            sx={{ bgcolor: "#E6F0FA", color: "#0B4F8A", fontWeight: 700 }}
                                        />
                                    )}
                                    {activeRoom && (
                                        <Chip
                                            size="small"
                                            label={`Phòng: ${activeRoom.roomCode}`}
                                            sx={{ bgcolor: "#F1F5F9", color: "#0A2540", fontWeight: 700 }}
                                        />
                                    )}
                                </Stack>
                            )}
                        </Stack>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="Tên bác sĩ"
                                    placeholder="Nhập họ tên bác sĩ..."
                                    value={draft.fullName}
                                    onChange={event => setDraft({ ...draft, fullName: event.target.value })}
                                    slotProps={{
                                        htmlInput: { maxLength: 100 },
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search fontSize="small" sx={{ color: "#475569" }} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Chuyên khoa"
                                    value={draft.departmentId}
                                    onChange={event => setDraft({ ...draft, departmentId: event.target.value })}
                                    disabled={departmentResource.status !== "ready"}
                                >
                                    <MenuItem value="">Tất cả chuyên khoa</MenuItem>
                                    {departments.map(department => (
                                        <MenuItem key={department.departmentId} value={String(department.departmentId)}>
                                            {department.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Phòng khám"
                                    value={draft.roomId}
                                    onChange={event => setDraft({ ...draft, roomId: event.target.value })}
                                    disabled={roomResource.status !== "ready"}
                                >
                                    <MenuItem value="">Tất cả phòng khám</MenuItem>
                                    {rooms.map(room => (
                                        <MenuItem key={room.roomId} value={String(room.roomId)}>
                                            {`${room.roomCode} - ${room.roomName}`}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<Search />}
                                sx={{ px: 3, bgcolor: "#0B4F8A", "&:hover": { bgcolor: "#083A66" } }}
                            >
                                Tìm kiếm
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={resetFilters}
                                startIcon={<RestartAltOutlined />}
                                sx={{ borderColor: "#B8CCE0", color: "#0A2540" }}
                            >
                                Xóa lọc
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                {/* Resource errors */}
                {[departmentResource, roomResource]
                    .filter(resource => resource.status === "error")
                    .map((resource, index) => (
                        <Alert
                            key={index}
                            severity="error"
                            sx={{ mb: 2, borderRadius: "10px" }}
                            action={
                                <Button color="inherit" size="small" onClick={resource.retry}>
                                    Thử lại
                                </Button>
                            }
                        >
                            {resource.error}
                        </Alert>
                    ))}

                {/* Status States */}
                {status === "loading" && (
                    <Grid container spacing={2.5}>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Skeleton variant="rounded" height={240} sx={{ borderRadius: "14px" }} />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {status === "error" && (
                    <Alert
                        severity="error"
                        sx={{ borderRadius: "12px" }}
                        action={
                            <Button color="inherit" onClick={retry}>
                                Thử lại
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {status === "ready" && doctors.length === 0 && (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 4, sm: 6 },
                            borderRadius: "14px",
                            textAlign: "center",
                            bgcolor: "#FFFFFF",
                            borderColor: "#CEDCEB",
                        }}
                    >
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                mx: "auto",
                                mb: 2,
                                borderRadius: "50%",
                                display: "grid",
                                placeItems: "center",
                                bgcolor: "#E6F0FA",
                                color: "#0B4F8A",
                            }}
                        >
                            <PersonSearchOutlined sx={{ fontSize: 34 }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: 19, color: "#0A2540", mb: 0.75 }}>
                            Không tìm thấy bác sĩ phù hợp
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: 14.5, mb: 2.5, maxWidth: 460, mx: "auto" }}>
                            Không tìm thấy bác sĩ phù hợp với bộ lọc hiện tại. Hãy thử từ khóa khác hoặc xóa bớt tiêu chí lọc chuyên khoa và phòng khám.
                        </Typography>
                        <Button variant="outlined" onClick={resetFilters} sx={{ borderRadius: "10px", textTransform: "none" }}>
                            Xóa bộ lọc tìm kiếm
                        </Button>
                    </Paper>
                )}

                {/* Doctors List */}
                {status === "ready" && doctors.length > 0 && (
                    <>
                        <Box
                            sx={{
                                mb: 2.5,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 1,
                            }}
                        >
                            <Typography sx={{ fontSize: 14.5, color: "#334155", fontWeight: 550 }}>
                                Tìm thấy{" "}
                                <Box component="span" sx={{ fontWeight: 800, color: "#0A2540" }}>
                                    {data.totalItems}
                                </Box>{" "}
                                bác sĩ đang tiếp nhận khám
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Hiển thị tối đa {DOCTOR_PAGE_SIZE} bác sĩ/trang
                            </Typography>
                        </Box>

                        <Grid container spacing={2.5}>
                            {doctors.map(doctor => (
                                <Grid key={doctor.doctorId} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <PublicDoctorCard doctor={doctor} />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Stack sx={{ mt: 4.5, alignItems: "center" }}>
                                <Pagination
                                    page={filters.pageNumber}
                                    count={totalPages}
                                    onChange={(_, pageNumber) => setFilters({ ...filters, pageNumber })}
                                    color="primary"
                                    shape="rounded"
                                />
                            </Stack>
                        )}
                    </>
                )}
            </Container>
        </Box>
    );
}
