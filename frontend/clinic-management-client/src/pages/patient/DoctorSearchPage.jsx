import { useEffect, useState } from "react";
import { Alert, Box, Button, Grid, MenuItem, Pagination, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";

import { getDepartments } from "../../api/bookingApi";
import { getPublicRooms } from "../../api/roomApi";
import PublicDoctorCard from "../../components/patient/PublicDoctorCard";
import { DOCTOR_PAGE_SIZE, usePublicDoctors } from "../../hooks/usePublicDoctors";
import getApiErrorMessage from "../../utils/errorHandler";

const EMPTY_FILTERS = { fullName: "", departmentId: "", roomId: "" };

export default function DoctorSearchPage() {
    const [draft, setDraft] = useState(EMPTY_FILTERS);
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS, pageNumber: 1 });
    const [departments, setDepartments] = useState([]);
    const [departmentError, setDepartmentError] = useState("");
    const [rooms, setRooms] = useState([]);
    const [roomError, setRoomError] = useState("");
    const { status, data, error } = usePublicDoctors(filters);

    useEffect(() => {
        getDepartments()
            .then(setDepartments)
            .catch(loadError => setDepartmentError(getApiErrorMessage(loadError)));
        getPublicRooms()
            .then(setRooms)
            .catch(loadError => setRoomError(getApiErrorMessage(loadError)));
    }, []);

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
        <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>Tra cứu bác sĩ</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Tìm bác sĩ theo tên hoặc chuyên khoa và xem phòng khám sắp tới của bác sĩ.
            </Typography>

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
                        disabled={Boolean(departmentError)}
                        helperText={departmentError || undefined}
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
                        disabled={Boolean(roomError)}
                        helperText={roomError || undefined}
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

            {status === "loading" && (
                <Grid container spacing={2}>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Skeleton variant="rounded" height={200} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {status === "error" && <Alert severity="error">{error}</Alert>}

            {status === "ready" && doctors.length === 0 && (
                <Alert severity="info">Không tìm thấy bác sĩ phù hợp với bộ lọc hiện tại.</Alert>
            )}

            {status === "ready" && doctors.length > 0 && (
                <>
                    <Grid container spacing={2}>
                        {doctors.map(doctor => (
                            <Grid key={doctor.doctorId} size={{ xs: 12, sm: 6, md: 4 }}>
                                <PublicDoctorCard doctor={doctor} />
                            </Grid>
                        ))}
                    </Grid>
                    {totalPages > 1 && (
                        <Stack sx={{ mt: 3, alignItems: "center" }}>
                            <Pagination
                                page={filters.pageNumber}
                                count={totalPages}
                                onChange={(_, pageNumber) => setFilters({ ...filters, pageNumber })}
                                color="primary"
                            />
                        </Stack>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Hiển thị tối đa {DOCTOR_PAGE_SIZE} bác sĩ mỗi trang · Tổng {data.totalItems} bác sĩ
                    </Typography>
                </>
            )}
        </Box>
    );
}
