import { Button, Paper, Stack } from "@mui/material";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MedicationLiquidOutlinedIcon from "@mui/icons-material/MedicationLiquidOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { Link as RouterLink } from "react-router-dom";

const tabs = [
    {
        value: "medicines",
        label: "Thuốc",
        path: "/internal/medicines",
        icon: MedicationLiquidOutlinedIcon,
    },
    {
        value: "categories",
        label: "Danh mục thuốc",
        path: "/internal/medicines/categories",
        icon: CategoryOutlinedIcon,
    },
    {
        value: "suppliers",
        label: "Nhà cung cấp",
        path: "/internal/medicines/suppliers",
        icon: StorefrontOutlinedIcon,
    },
    {
        value: "inventory",
        label: "Tồn kho",
        path: "/internal/medicines/inventory",
        icon: Inventory2OutlinedIcon,
    },
];

function PharmacyModuleTabs({ active }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 1,
                borderRadius: 2,
                border: "1px solid #E5E9F0",
                backgroundColor: "#FFFFFF",
            }}
        >
            <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
            >
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = active === tab.value;

                    return (
                        <Button
                            key={tab.value}
                            component={RouterLink}
                            to={tab.path}
                            startIcon={<Icon />}
                            variant={isActive ? "contained" : "text"}
                            sx={{
                                minHeight: 38,
                                px: 2,
                                borderRadius: 1.5,
                                color: isActive
                                    ? "#FFFFFF"
                                    : "#4B5563",
                                backgroundColor: isActive
                                    ? "#005DAC"
                                    : "transparent",
                                fontWeight: 800,
                                "&:hover": {
                                    backgroundColor: isActive
                                        ? "#00529A"
                                        : "#F5F9FD",
                                },
                            }}
                        >
                            {tab.label}
                        </Button>
                    );
                })}
            </Stack>
        </Paper>
    );
}

export default PharmacyModuleTabs;
