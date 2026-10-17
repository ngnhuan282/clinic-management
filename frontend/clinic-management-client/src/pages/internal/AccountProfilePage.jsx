import { Stack } from "@mui/material";
import { PersonOutlineOutlined } from "@mui/icons-material";
import AccountProfile from "../../components/common/AccountProfile";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";

export default function AccountProfilePage() {
    return <Stack spacing={2.5} sx={{ maxWidth: 900, mx: "auto", py: 1, pb: 4 }}>
        <ClinicPageHeader title="Hồ sơ cá nhân" icon={PersonOutlineOutlined} description="Xem và cập nhật thông tin liên hệ của tài khoản đang đăng nhập." />
        <AccountProfile />
    </Stack>;
}
