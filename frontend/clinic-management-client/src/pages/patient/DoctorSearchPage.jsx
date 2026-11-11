import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Container,
    Grid,
    InputAdornment,
    MenuItem,
    Pagination,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { FilterAltOutlined, PersonSearchOutlined, RestartAltOutlined, Search } from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";

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

    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "80vh", py: { xs: 3.5, md: 5.5 } }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        component="h1"
                        sx={{
                            fontSize: { xs: 26, sm: 32, md: 36 },
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            color: "#0f2c4d",
                            lineHeight: 1.25,
                            mb: 1,
                        }}
                    >
                        Tra cứu đội ngũ bác sĩ
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: 14.5, sm: 15.5 }, lineHeight: 1.6 }}>
                        Tìm kiếm bác sĩ theo họ tên, chuyên khoa điều trị hoặc phòng khám để nắm rõ thông tin trước khi đăng ký.
                    </Typography>
                </Box>

                {/* Filter Form Card */}
                <Paper
                    component="form"
                    onSubmit={applyFilters}
                    variant="outlined"
                    sx={{
                        p: { xs: 2.5, sm: 3 },
                        mb: 4,
                        borderRadius: "14px",
                        borderColor: "#e5e9f0",
                        bgcolor: "#ffffff",
                        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                    }}
                >
                    <Stack spacing={2}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                            <FilterAltOutlined fontSize="small" />
                            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>
                                Bộ lọc tìm kiếm
                            </Typography>
                        </Box>

            <Paper component="form" onSubmit={applyFilters} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
                    <TextField
                        label="Tên bác sĩ"
                        value={draft.fullName}
                        onChange={event => setDraft({ ...draft, fullName: event.target.value })}
                        slotProps={{ htmlInput: { maxLength: 100 } }}
                        fullWidth
                    />
                    <TextField
                        select
                        label="Chuyên khoa"
                        value={draft.departmentId}
                        onChange={event => setDraft({ ...draft, departmentId: event.target.value })}
                        sx={{ minWidth: 220 }}
                        disabled={departmentResource.status !== "ready"}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        {departments.map(department => (
                            <MenuItem key={department.departmentId} value={String(department.departmentId)}>
                                {department.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label="Phòng khám"
                        value={draft.roomId}
                        onChange={event => setDraft({ ...draft, roomId: event.target.value })}
                        sx={{ minWidth: 240 }}
                        disabled={roomResource.status !== "ready"}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        {rooms.map(room => (
                            <MenuItem key={room.roomId} value={String(room.roomId)}>
                                {`${room.roomCode} - ${room.roomName}`}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Stack direction="row" spacing={1}>
                        <Button type="submit" variant="contained">Tìm kiếm</Button>
                        <Button variant="outlined" onClick={resetFilters}>Xóa lọc</Button>
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
                                <Skeleton variant="rounded" height={220} sx={{ borderRadius: "14px" }} />
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
                            borderRadius: "16px",
                            textAlign: "center",
                            bgcolor: "#ffffff",
                            borderColor: "#e5e9f0",
                        }}
                    >
                        <PersonSearchOutlined sx={{ fontSize: 56, color: "#94a3b8", mb: 1.5 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: 18, color: "#1f2937", mb: 0.5 }}>
                            Không tìm thấy bác sĩ phù hợp
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: 14, mb: 2.5, maxWidth: 440, mx: "auto" }}>
                            Hãy thử tìm kiếm với từ khóa khác hoặc xóa bớt tiêu chí lọc chuyên khoa và phòng khám.
                        </Typography>
                        <Button variant="outlined" onClick={resetFilters} sx={{ borderRadius: "8px", textTransform: "none" }}>
                            Xóa bộ lọc tìm kiếm
                        </Button>
                    </Paper>
                )}

                {/* Doctors List */}
                {status === "ready" && doctors.length > 0 && (
                    <>
                        <Box sx={{ mb: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                            <Typography sx={{ fontSize: 14, color: "text.secondary", fontWeight: 500 }}>
                                Tìm thấy <Box component="span" sx={{ fontWeight: 700, color: "#1f2937" }}>{data.totalItems}</Box> bác sĩ
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Tối đa {DOCTOR_PAGE_SIZE} bác sĩ/trang
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
                            <Stack sx={{ mt: 4, alignItems: "center" }}>
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
