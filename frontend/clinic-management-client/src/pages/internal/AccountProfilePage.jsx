import { Box, Typography } from "@mui/material";
import AccountProfile from "../../components/common/AccountProfile";

export default function AccountProfilePage() {
    return <Box sx={{ maxWidth: 720, mx: "auto", py: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Hồ sơ cá nhân</Typography>
        <AccountProfile />
    </Box>;
}
