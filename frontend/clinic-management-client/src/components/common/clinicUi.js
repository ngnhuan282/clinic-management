export const clinicColors = { heading: "#0F172A", muted: "#64748B", primary: "#0284C7", border: "#E2E8F0", subtle: "#F8FAFC" };

export const clinicSurfaceSx = {
    borderRadius: 2.5, borderColor: clinicColors.border, backgroundColor: "#FFFFFF",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
};
export const clinicFieldSx = {
    "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: clinicColors.subtle },
    "& .MuiInputLabel-root": { fontSize: 13.5 },
    "& .MuiInputBase-input": { fontSize: 14 },
};
export const clinicButtonSx = { borderRadius: 2, textTransform: "none", fontWeight: 600, boxShadow: "none", minHeight: 40 };
export const clinicPrimaryButtonSx = {
    ...clinicButtonSx, bgcolor: clinicColors.primary, "&:hover": { bgcolor: "#0369A1", boxShadow: "none" },
};
export const clinicSecondaryButtonSx = { ...clinicButtonSx, color: "#334155", borderColor: "#CBD5E1", bgcolor: "#FFFFFF" };
export const clinicTableSx = {
    "& th": { bgcolor: clinicColors.subtle, color: clinicColors.muted, fontSize: 12, fontWeight: 600, py: 1.75, whiteSpace: "nowrap" },
    "& td": { py: 1.75, fontSize: 14, borderColor: "#F1F5F9" },
    "& tbody tr:hover": { bgcolor: "#F8FAFC" },
};
export const clinicDialogPaperSx = { borderRadius: 3, border: "1px solid #E2E8F0", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)" };
export const clinicDialogTitleSx = { p: 3, pb: 2, fontSize: 20, fontWeight: 700, color: clinicColors.heading };
export const clinicDialogActionsSx = { px: 3, py: 2, borderTop: "1px solid #E2E8F0", gap: 1, flexWrap: "wrap" };
