import { useEffect, useState } from "react";
import { Alert, Box, Button, InputAdornment, MenuItem, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { BadgeRounded } from "@mui/icons-material";
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
import StaffAccountLinkDialog from "../../../components/internal/staff/StaffAccountLinkDialog";
import StaffFormDialog from "../../../components/internal/staff/StaffFormDialog";
import StaffStatusDialog from "../../../components/internal/staff/StaffStatusDialog";
import StaffTable from "../../../components/internal/staff/StaffTable";
import useAuth from "../../../hooks/useAuth";
import useStaff from "../../../hooks/useStaff";
import useStaffActions from "../../../hooks/useStaffActions";
import { getApiErrorMessage } from "../../../utils/errorHandler";

const initialQuery = { pageNumber: 1, pageSize: 10, search: "", jobPositionId: "" };

export default function StaffManagementPage() {
    const { permissions } = useAuth();
    const [query, setQuery] = useState(initialQuery);
    const [search, setSearch] = useState("");
    const [jobPositions, setJobPositions] = useState(null);
    const staff = useStaff(query);
    const manager = useStaffActions({
        reload: () => {
            setQuery(current => ({ ...current, pageNumber: 1 }));
            staff.reload();
        },
    });
    const canManage = permissions.includes("staff.manage");
    const canLink = permissions.includes("accounts.assignRole");

    useEffect(() => {
        let active = true;
        catalogApi
            .list("job-positions", { pageNumber: 1, pageSize: 100, isActive: true })
            .then(response => { if (active) setJobPositions({ items: response.data.result.items }); })
            .catch(error => { if (active) setJobPositions({ items: [], error: getApiErrorMessage(error) }); });
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
                title="Quản lý hồ sơ nhân viên"
                icon={BadgeRounded}
                description="Quản lý hồ sơ lễ tân, thu ngân, dược sĩ, kỹ thuật viên xét nghiệm: vị trí công việc, trạng thái và liên kết tài khoản."
                actions={
                    <>
                        <Button variant="outlined" onClick={staff.reload} disabled={staff.loading} startIcon={<AdminRefreshIcon />} sx={clinicSecondaryButtonSx}>
                            Làm mới
                        </Button>
                        <Button
                            variant="contained"
                            disabled={!canManage || staff.loading || Boolean(staff.error) || !jobPositions?.items.length}
                            onClick={() => manager.open("create")}
                            startIcon={<AdminAddIcon />}
                            sx={clinicPrimaryButtonSx}
                        >
                            Thêm nhân viên
                        </Button>
                    </>
                }
            />

            {jobPositions?.error && <Alert severity="error">{jobPositions.error}</Alert>}

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
                        Bộ lọc & tra cứu hồ sơ nhân viên
                    </Typography>
                </Stack>

                <Stack spacing={1.75}>
                    <TextField
                        size="small"
                        label="Tìm theo họ tên nhân viên"
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
                            label="Vị trí công việc"
                            value={query.jobPositionId}
                            onChange={event => changeFilter("jobPositionId", event.target.value)}
                            sx={{ ...clinicFieldSx, minWidth: { md: 240 }, flex: 1 }}
                        >
                            <MenuItem value="">Tất cả vị trí</MenuItem>
                            {(jobPositions?.items || []).map(position => (
                                <MenuItem key={position.jobPositionId} value={String(position.jobPositionId)}>
                                    {position.name}
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

            {staff.loading ? (
                <Box role="status" aria-label="Đang tải hồ sơ nhân viên">
                    <Skeleton variant="rounded" height={320} sx={{ borderRadius: "16px" }} />
                </Box>
            ) : staff.error ? (
                <Alert severity="error" action={<Button color="inherit" onClick={staff.reload}>Thử lại</Button>} sx={{ borderRadius: "12px" }}>
                    {staff.error}
                </Alert>
            ) : (
                <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ px: 2.5, py: 2, justifyContent: "space-between", alignItems: { sm: "center" }, borderBottom: "1px solid #E4ECF5" }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 750, color: clinicColors.heading }}>
                            Danh sách hồ sơ nhân viên ({staff.totalItems} hồ sơ phù hợp)
                        </Typography>
                    </Stack>

                    {!staff.items.length ? (
                        <Box sx={{ p: 3 }}>
                            <Alert severity="info" sx={{ borderRadius: "10px" }}>
                                Không tìm thấy hồ sơ nhân viên phù hợp.
                            </Alert>
                        </Box>
                    ) : (
                        <StaffTable items={staff.items} canManage={canManage} canLink={canLink} onAction={manager.open} />
                    )}

                    <ClinicPagination
                        page={query.pageNumber}
                        pageSize={query.pageSize}
                        totalItems={staff.totalItems}
                        label="hồ sơ"
                        onPageChange={pageNumber => setQuery(current => ({ ...current, pageNumber }))}
                        onPageSizeChange={pageSize => setQuery(current => ({ ...current, pageNumber: 1, pageSize }))}
                    />
                </Paper>
            )}

            <StaffFormDialog manager={manager} jobPositions={jobPositions?.items || []} />
            <StaffStatusDialog manager={manager} />
            <StaffAccountLinkDialog manager={manager} onLinked={staff.reload} />
        </Stack>
    );
}
