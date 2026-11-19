import { useEffect, useState } from "react";
import { Alert, Box, Button, InputAdornment, MenuItem, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { LocalHospitalRounded } from "@mui/icons-material";
import catalogApi from "../../../api/catalogApi";
import ClinicPageHeader, { ClinicPagination } from "../../../components/common/ClinicPageHeader";
import {
    AdminAddIcon,
    AdminFilterIcon,
    AdminRefreshIcon,
    AdminResetIcon,
    AdminSearchIcon,
    adminFilterCardSx,
    clinicColors,
    clinicFieldSx,
    clinicPrimaryButtonSx,
    clinicResetButtonSx,
    clinicSecondaryButtonSx,
    clinicSurfaceSx,
} from "../../../components/common/clinicUi";
import DoctorFormDialog from "../../../components/internal/doctors/DoctorFormDialog";
import DoctorStatusDialog from "../../../components/internal/doctors/DoctorStatusDialog";
import DoctorsTable from "../../../components/internal/doctors/DoctorsTable";
import useAuth from "../../../hooks/useAuth";
import useDoctorActions from "../../../hooks/useDoctorActions";
import useDoctors from "../../../hooks/useDoctors";
import { getApiErrorMessage } from "../../../utils/errorHandler";

const initialQuery = { pageNumber: 1, pageSize: 10, search: "", departmentId: "" };

export default function DoctorsManagementPage() {
    const { permissions } = useAuth();
    const [query, setQuery] = useState(initialQuery);
    const [search, setSearch] = useState("");
    const [catalogs, setCatalogs] = useState(null);
    const doctors = useDoctors(query);
    const manager = useDoctorActions({
        reload: () => {
            setQuery(current => ({ ...current, pageNumber: 1 }));
            doctors.reload();
        },
    });
    const canManage = permissions.includes("staff.manage");

    useEffect(() => {
        let active = true;
        Promise.all([
            catalogApi.list("departments", { pageNumber: 1, pageSize: 100, isActive: true }),
            catalogApi.list("specializations", { pageNumber: 1, pageSize: 100, isActive: true }),
        ])
            .then(([departmentResponse, specializationResponse]) => {
                if (active) setCatalogs({
                    departments: departmentResponse.data.result.items,
                    specializations: specializationResponse.data.result.items,
                });
            })
            .catch(error => { if (active) setCatalogs({ error: getApiErrorMessage(error) }); });
        return () => { active = false; };
    }, []);

    const changeFilter = (name, value) => setQuery(current => ({ ...current, [name]: value, pageNumber: 1 }));
    const reset = () => {
        setQuery(initialQuery);
        setSearch("");
    };

    return (
        <Stack spacing={3} sx={{ pb: 4, minWidth: 0 }}>
            <ClinicPageHeader
                title="Quản lý hồ sơ bác sĩ"
                icon={LocalHospitalRounded}
                description="Thêm hồ sơ bác sĩ, gán khoa/chuyên khoa và quản lý trạng thái hoạt động."
                actions={
                    <>
                        <Button variant="outlined" onClick={doctors.reload} disabled={doctors.loading} startIcon={<AdminRefreshIcon />} sx={clinicSecondaryButtonSx}>
                            Làm mới
                        </Button>
                        <Button
                            variant="contained"
                            disabled={!canManage || doctors.loading || Boolean(doctors.error) || !catalogs?.departments}
                            onClick={() => manager.open("create")}
                            startIcon={<AdminAddIcon />}
                            sx={clinicPrimaryButtonSx}
                        >
                            Thêm bác sĩ
                        </Button>
                    </>
                }
            />

            <Paper
                component="form"
                variant="outlined"
                onSubmit={event => {
                    event.preventDefault();
                    changeFilter("search", search);
                }}
                sx={adminFilterCardSx}
            >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.75 }}>
                    <AdminFilterIcon sx={{ fontSize: 19, color: clinicColors.primary }} />
                    <Typography sx={{ fontSize: 14.5, fontWeight: 750, color: clinicColors.heading }}>
                        Bộ lọc & tra cứu hồ sơ bác sĩ
                    </Typography>
                </Stack>

                <Stack spacing={1.75}>
                    <TextField
                        size="small"
                        label="Tìm theo họ tên bác sĩ"
                        fullWidth
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        sx={clinicFieldSx}
                        slotProps={{
                            htmlInput: { maxLength: 100 },
                            input: { startAdornment: <InputAdornment position="start"><AdminSearchIcon sx={{ color: "#64748B", fontSize: 20 }} /></InputAdornment> },
                        }}
                    />

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                        <TextField
                            select
                            size="small"
                            label="Khoa"
                            value={query.departmentId}
                            onChange={event => changeFilter("departmentId", event.target.value)}
                            sx={{ ...clinicFieldSx, minWidth: { md: 240 }, flex: 1 }}
                        >
                            <MenuItem value="">Tất cả khoa</MenuItem>
                            {(catalogs?.departments || []).map(department => (
                                <MenuItem key={department.departmentId} value={String(department.departmentId)}>
                                    {department.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Button type="submit" variant="contained" startIcon={<AdminSearchIcon />} sx={{ ...clinicPrimaryButtonSx, whiteSpace: "nowrap" }}>
                            Tìm kiếm
                        </Button>
                        <Button onClick={reset} variant="outlined" startIcon={<AdminResetIcon />} sx={{ ...clinicResetButtonSx, whiteSpace: "nowrap" }}>
                            Đặt lại bộ lọc
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {doctors.loading ? (
                <Box role="status" aria-label="Đang tải hồ sơ bác sĩ">
                    <Skeleton variant="rounded" height={320} sx={{ borderRadius: "16px" }} />
                </Box>
            ) : doctors.error ? (
                <Alert severity="error" action={<Button color="inherit" onClick={doctors.reload}>Thử lại</Button>} sx={{ borderRadius: "12px" }}>
                    {doctors.error}
                </Alert>
            ) : (
                <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ px: 2.5, py: 2, justifyContent: "space-between", alignItems: { sm: "center" }, borderBottom: "1px solid #E4ECF5" }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 750, color: clinicColors.heading }}>
                            Danh sách hồ sơ bác sĩ ({doctors.totalItems} hồ sơ phù hợp)
                        </Typography>
                    </Stack>

                    {!doctors.items.length ? (
                        <Box sx={{ p: 3 }}>
                            <Alert severity="info" sx={{ borderRadius: "10px" }}>
                                Không tìm thấy hồ sơ bác sĩ phù hợp.
                            </Alert>
                        </Box>
                    ) : (
                        <DoctorsTable items={doctors.items} canManage={canManage} onAction={manager.open} />
                    )}

                    <ClinicPagination
                        page={query.pageNumber}
                        pageSize={query.pageSize}
                        totalItems={doctors.totalItems}
                        label="hồ sơ"
                        onPageChange={pageNumber => setQuery(current => ({ ...current, pageNumber }))}
                        onPageSizeChange={pageSize => setQuery(current => ({ ...current, pageNumber: 1, pageSize }))}
                    />
                </Paper>
            )}

            <DoctorFormDialog manager={manager} departments={catalogs?.departments || []} specializations={catalogs?.specializations || []} />
            <DoctorStatusDialog manager={manager} />
        </Stack>
    );
}
