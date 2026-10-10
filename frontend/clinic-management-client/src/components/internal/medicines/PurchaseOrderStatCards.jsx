import { Box, Paper, Typography } from "@mui/material";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

import formatCurrency from "../../../utils/formatCurrency";

const cards = [
    {
        key: "totalOrders",
        label: "Tổng phiếu nhập",
        icon: ReceiptLongOutlinedIcon,
        color: "#2563EB",
        backgroundColor: "#EFF6FF",
        format: (value) => `${value || 0} phiếu`,
    },
    {
        key: "draftOrders",
        label: "Bản nháp chờ nhập",
        icon: PendingActionsOutlinedIcon,
        color: "#D97706",
        backgroundColor: "#FFFBEB",
        format: (value) => `${value || 0} phiếu`,
    },
    {
        key: "receivedOrders",
        label: "Đã nhập kho",
        icon: InventoryOutlinedIcon,
        color: "#059669",
        backgroundColor: "#ECFDF5",
        format: (value) => `${value || 0} phiếu`,
    },
    {
        key: "receivedValueThisMonth",
        label: "Giá trị nhập tháng này",
        icon: PaidOutlinedIcon,
        color: "#005DAC",
        backgroundColor: "#EFF6FF",
        format: (value) => formatCurrency(value || 0),
    },
];

function PurchaseOrderStatCards({ summary }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
            }}
        >
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <Paper
                        key={card.key}
                        elevation={0}
                        sx={{
                            p: 2.25,
                            minHeight: 126,
                            borderRadius: 2,
                            border: "1px solid #E5E9F0",
                            backgroundColor: "#FFFFFF",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "#64748B",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                }}
                            >
                                {card.label}
                            </Typography>

                            <Typography
                                variant="h5"
                                sx={{
                                    mt: 1.25,
                                    color: "#111827",
                                    fontWeight: 800,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {card.format(summary?.[card.key])}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                flexShrink: 0,
                                borderRadius: 2,
                                display: "grid",
                                placeItems: "center",
                                color: card.color,
                                backgroundColor: card.backgroundColor,
                            }}
                        >
                            <Icon />
                        </Box>
                    </Paper>
                );
            })}
        </Box>
    );
}

export default PurchaseOrderStatCards;
