import { Box, Button, MenuItem, Paper, Select, Skeleton, Stack, Typography } from "@mui/material";
import {
    ADMIN_PAGE_SIZE_OPTIONS,
    adminAccents,
    buildPaginationItems,
    clinicColors,
} from "./clinicUi";

export default function ClinicPageHeader({
    title,
    description,
    icon: Icon,
    eyebrow,
    badge,
    actions,
}) {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: { xs: 2.5, sm: 3, md: 3.25 },
                borderRadius: "16px",
                borderColor: "#CEDCEB",
                bgcolor: "#FFFFFF",
                borderLeft: "5px solid #0B4F8A",
                boxShadow: "0 2px 10px rgba(10, 37, 64, 0.04)",
            }}
        >
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2.25}
                sx={{ justifyContent: "space-between", alignItems: { md: "center" }, minWidth: 0 }}
            >
                <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", minWidth: 0 }}>
                    {Icon && (
                        <Box
                            sx={{
                                width: { xs: 44, sm: 50 },
                                height: { xs: 44, sm: 50 },
                                flexShrink: 0,
                                display: "grid",
                                placeItems: "center",
                                borderRadius: "12px",
                                bgcolor: "#0B4F8A",
                                color: "#FFFFFF",
                            }}
                        >
                            <Icon sx={{ fontSize: 24 }} />
                        </Box>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                        {(eyebrow || badge) && (
                            <Stack
                                direction="row"
                                spacing={1}
                                useFlexGap
                                sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}
                            >
                                {eyebrow && (
                                    <Typography
                                        sx={{
                                            fontSize: 12,
                                            fontWeight: 750,
                                            letterSpacing: "0.04em",
                                            textTransform: "uppercase",
                                            color: clinicColors.primary,
                                        }}
                                    >
                                        {eyebrow}
                                    </Typography>
                                )}
                                {badge}
                            </Stack>
                        )}
                        <Typography
                            component="h1"
                            sx={{
                                fontSize: { xs: 22, sm: 24, md: 26 },
                                fontWeight: 800,
                                lineHeight: 1.3,
                                letterSpacing: "-0.015em",
                                color: clinicColors.heading,
                            }}
                        >
                            {title}
                        </Typography>
                        {description && (
                            <Typography
                                sx={{
                                    mt: 0.65,
                                    fontSize: 14.5,
                                    lineHeight: 1.65,
                                    maxWidth: 780,
                                    color: clinicColors.muted,
                                }}
                            >
                                {description}
                            </Typography>
                        )}
                    </Box>
                </Stack>
                {actions && (
                    <Stack direction="row" spacing={1.25} sx={{ flexShrink: 0, flexWrap: "wrap", rowGap: 1 }}>
                        {actions}
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}

export function AdminStatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    tone = "blue",
    loading = false,
    testId,
}) {
    const palette = adminAccents[tone] || adminAccents.blue;

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2.5,
                height: "100%",
                borderRadius: "16px",
                borderColor: "#D8E4F0",
                borderTop: `4px solid ${palette.main}`,
                bgcolor: "#FFFFFF",
                boxShadow: "0 2px 10px rgba(10, 37, 64, 0.035)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
            }}
        >
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        sx={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "#475569",
                            lineHeight: 1.4,
                        }}
                    >
                        {title}
                    </Typography>

                    {loading ? (
                        <Skeleton width={92} height={42} sx={{ mt: 0.75 }} />
                    ) : (
                        <Typography
                            data-testid={testId}
                            sx={{
                                mt: 1,
                                fontSize: { xs: 24, sm: 27 },
                                fontWeight: 800,
                                lineHeight: 1.2,
                                color: palette.main,
                                fontVariantNumeric: "tabular-nums",
                                overflowWrap: "anywhere",
                            }}
                        >
                            {value}
                        </Typography>
                    )}
                </Box>

                {Icon && (
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "12px",
                            flexShrink: 0,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: palette.soft,
                            color: palette.main,
                            border: `1px solid ${palette.border}`,
                        }}
                    >
                    <Icon sx={{ fontSize: 22 }} />
                    </Box>
                )}
            </Stack>

            {subtitle && (
                <Typography
                    sx={{
                        mt: 1.5,
                        fontSize: 12.5,
                        color: "#64748B",
                        lineHeight: 1.45,
                    }}
                >
                    {subtitle}
                </Typography>
            )}
        </Paper>
    );
}

const navButtonBaseSx = {
    minWidth: 36,
    height: 36,
    px: 1,
    borderRadius: "9px",
    fontSize: 13.5,
    fontWeight: 700,
    textTransform: "none",
    fontVariantNumeric: "tabular-nums",
    boxShadow: "none",
};

export function ClinicPagination({
    page = 1,
    pageSize = 10,
    totalItems = 0,
    pageSizeOptions = ADMIN_PAGE_SIZE_OPTIONS,
    onPageChange,
    onPageSizeChange,
    label = "dòng",
    navLabel = "Phân trang danh sách",
    disabled = false,
    borderTop = true,
}) {
    const safeOptions = Array.isArray(pageSizeOptions) && pageSizeOptions.length
        ? pageSizeOptions
        : ADMIN_PAGE_SIZE_OPTIONS;
    const numericSize = Number(pageSize) > 0 ? Number(pageSize) : 10;
    const displayOptions = safeOptions.includes(numericSize)
        ? safeOptions
        : [...safeOptions, numericSize].sort((a, b) => a - b);

    const total = Math.max(0, Number(totalItems) || 0);
    const totalPages = Math.max(1, Math.ceil(total / numericSize));
    const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    const from = total === 0 ? 0 : (currentPage - 1) * numericSize + 1;
    const to = total === 0 ? 0 : Math.min(total, currentPage * numericSize);
    const items = buildPaginationItems(currentPage, totalPages);

    const goTo = (targetPage) => {
        if (disabled || !onPageChange) return;
        const clamped = Math.min(Math.max(1, targetPage), totalPages);
        if (clamped !== currentPage) {
            onPageChange(clamped);
        }
    };

    return (
        <Box
            component="nav"
            aria-label={navLabel}
            sx={{
                px: { xs: 2, sm: 2.5 },
                py: 1.75,
                bgcolor: "#FFFFFF",
                ...(borderTop ? { borderTop: "1px solid #E4ECF5" } : {}),
            }}
        >
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.75}
                sx={{
                    alignItems: { xs: "stretch", md: "center" },
                    justifyContent: "space-between",
                }}
            >
                <Stack
                    direction="row"
                    spacing={2}
                    useFlexGap
                    sx={{
                        alignItems: "center",
                        flexWrap: "wrap",
                        rowGap: 1,
                        justifyContent: { xs: "space-between", md: "flex-start" },
                    }}
                >
                    <Typography sx={{ fontSize: 13.5, color: "#475569", fontVariantNumeric: "tabular-nums" }}>
                        {total === 0
                            ? `0 ${label}`
                            : `Hiển thị ${from.toLocaleString("vi-VN")}–${to.toLocaleString("vi-VN")} / ${total.toLocaleString("vi-VN")} ${label}`}
                    </Typography>

                    {onPageSizeChange && (
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Typography sx={{ fontSize: 13.5, color: "#475569", whiteSpace: "nowrap" }}>
                                Hiển thị:
                            </Typography>
                            <Select
                                size="small"
                                value={numericSize}
                                disabled={disabled}
                                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                                inputProps={{ "aria-label": "Số dòng mỗi trang" }}
                                sx={{
                                    borderRadius: "9px",
                                    fontSize: 13.5,
                                    fontWeight: 650,
                                    bgcolor: "#F8FAFC",
                                    "& .MuiSelect-select": {
                                        py: 0.7,
                                        pl: 1.25,
                                        pr: "28px !important",
                                    },
                                }}
                            >
                                {displayOptions.map((option) => (
                                    <MenuItem key={option} value={option} sx={{ fontSize: 13.5 }}>
                                        {option} dòng / trang
                                    </MenuItem>
                                ))}
                            </Select>
                        </Stack>
                    )}
                </Stack>

                <Stack
                    direction="row"
                    spacing={0.65}
                    useFlexGap
                    sx={{
                        alignItems: "center",
                        flexWrap: "wrap",
                        justifyContent: { xs: "center", md: "flex-end" },
                    }}
                >
                    <Button
                        size="small"
                        variant="outlined"
                        aria-label="Go to first page"
                        disabled={disabled || currentPage <= 1}
                        onClick={() => goTo(1)}
                        sx={{
                            ...navButtonBaseSx,
                            color: "#0A2540",
                            borderColor: "#CBD8E6",
                            bgcolor: "#FFFFFF",
                            "&:hover": { bgcolor: "#E8F2FC", borderColor: "#0B4F8A" },
                        }}
                    >
                        {"<<"}
                    </Button>

                    <Button
                        size="small"
                        variant="outlined"
                        aria-label="Go to previous page"
                        disabled={disabled || currentPage <= 1}
                        onClick={() => goTo(currentPage - 1)}
                        sx={{
                            ...navButtonBaseSx,
                            color: "#0A2540",
                            borderColor: "#CBD8E6",
                            bgcolor: "#FFFFFF",
                            "&:hover": { bgcolor: "#E8F2FC", borderColor: "#0B4F8A" },
                        }}
                    >
                        {"<"}
                    </Button>

                    {items.map((item) =>
                        typeof item === "string" ? (
                            <Box
                                key={item}
                                aria-hidden="true"
                                sx={{
                                    minWidth: 30,
                                    height: 36,
                                    display: "grid",
                                    placeItems: "center",
                                    color: "#64748B",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    userSelect: "none",
                                }}
                            >
                                ...
                            </Box>
                        ) : (
                            <Button
                                key={item}
                                size="small"
                                variant={item === currentPage ? "contained" : "outlined"}
                                aria-label={`Go to page ${item}`}
                                aria-current={item === currentPage ? "page" : undefined}
                                disabled={disabled}
                                onClick={() => goTo(item)}
                                sx={
                                    item === currentPage
                                        ? {
                                              ...navButtonBaseSx,
                                              bgcolor: "#0B4F8A",
                                              color: "#FFFFFF",
                                              borderColor: "#0B4F8A",
                                              "&:hover": { bgcolor: "#083A66" },
                                          }
                                        : {
                                              ...navButtonBaseSx,
                                              color: "#0A2540",
                                              borderColor: "#CBD8E6",
                                              bgcolor: "#FFFFFF",
                                              "&:hover": { bgcolor: "#E8F2FC", borderColor: "#0B4F8A" },
                                          }
                                }
                            >
                                {item}
                            </Button>
                        )
                    )}

                    <Button
                        size="small"
                        variant="outlined"
                        aria-label="Go to next page"
                        disabled={disabled || currentPage >= totalPages}
                        onClick={() => goTo(currentPage + 1)}
                        sx={{
                            ...navButtonBaseSx,
                            color: "#0A2540",
                            borderColor: "#CBD8E6",
                            bgcolor: "#FFFFFF",
                            "&:hover": { bgcolor: "#E8F2FC", borderColor: "#0B4F8A" },
                        }}
                    >
                        {">"}
                    </Button>

                    <Button
                        size="small"
                        variant="outlined"
                        aria-label="Go to last page"
                        disabled={disabled || currentPage >= totalPages}
                        onClick={() => goTo(totalPages)}
                        sx={{
                            ...navButtonBaseSx,
                            color: "#0A2540",
                            borderColor: "#CBD8E6",
                            bgcolor: "#FFFFFF",
                            "&:hover": { bgcolor: "#E8F2FC", borderColor: "#0B4F8A" },
                        }}
                    >
                        {">>"}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
