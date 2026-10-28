import "./appointmentWorkspace.css";

export const appointmentColors = {
    primary: "var(--appt-accent)", primaryDark: "var(--appt-accent-hover)",
    primarySoft: "var(--appt-accent-soft)", canvas: "var(--appt-canvas)",
    paper: "var(--appt-paper)", heading: "var(--appt-ink)", body: "var(--appt-body)",
    muted: "var(--appt-muted)", border: "var(--appt-rule)", borderSoft: "var(--appt-rule-soft)",
    success: "var(--appt-success)", successSoft: "var(--appt-success-soft)",
    warning: "var(--appt-warning)", warningSoft: "var(--appt-warning-soft)",
    danger: "var(--appt-danger)", dangerSoft: "var(--appt-danger-soft)",
    onPrimary: "var(--appt-on-accent)",
};

export const appointmentPageSx = {
    width: "100%", minWidth: 0, maxWidth: 1440, mx: "auto",
    p: { xs: 2, sm: 3, lg: 4 }, color: appointmentColors.body,
    "& .MuiFormLabel-root": { letterSpacing: 0 },
};

export const appointmentHeadingSx = {
    fontSize: { xs: 25, md: 30 }, lineHeight: 1.35, fontWeight: 700,
    letterSpacing: "-0.02em", color: appointmentColors.heading,
};

export const appointmentSurfaceSx = {
    minWidth: 0, bgcolor: appointmentColors.paper, border: "1px solid",
    borderColor: appointmentColors.borderSoft, borderRadius: 2, boxShadow: "none",
};

export const appointmentFieldSx = {
    "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: appointmentColors.paper },
    "& .MuiInputLabel-root": { fontSize: 14, color: appointmentColors.muted },
    "& .MuiInputBase-input": { fontSize: 14, lineHeight: 1.5 },
};

export const appointmentButtonSx = {
    borderRadius: 1.5, textTransform: "none", fontWeight: 600,
    minHeight: 40, boxShadow: "none", letterSpacing: 0,
    "&:hover": { boxShadow: "none" },
};

export const appointmentPrimaryButtonSx = {
    ...appointmentButtonSx, bgcolor: appointmentColors.primary, color: appointmentColors.onPrimary,
    "&:hover": { bgcolor: appointmentColors.primaryDark, boxShadow: "none" },
};

export const appointmentSecondaryButtonSx = {
    ...appointmentButtonSx, color: appointmentColors.primary,
    borderColor: appointmentColors.border, bgcolor: appointmentColors.paper,
};

export const appointmentTableSx = {
    "& th": { bgcolor: appointmentColors.canvas, color: appointmentColors.muted,
        fontSize: 13, fontWeight: 600, py: 1.5, whiteSpace: "nowrap", textTransform: "none", letterSpacing: 0 },
    "& td": { py: 1.5, fontSize: 14, borderColor: appointmentColors.borderSoft },
    "& tbody tr:hover": { bgcolor: appointmentColors.canvas },
};

export const appointmentDialogPaperSx = {
    ...appointmentSurfaceSx, borderRadius: 2.5, maxHeight: "calc(100dvh - 32px)",
    m: { xs: 1, sm: 3 }, width: { xs: "calc(100% - 16px)", sm: "100%" },
};

export const appointmentDialogTitleSx = {
    px: { xs: 2, sm: 3 }, py: 2, fontSize: 22, lineHeight: 1.4,
    fontWeight: 700, color: appointmentColors.heading,
    borderBottom: "1px solid", borderColor: appointmentColors.borderSoft,
};

export const appointmentDialogActionsSx = {
    px: { xs: 2, sm: 3 }, py: 2, gap: 1, flexWrap: "wrap",
    borderTop: "1px solid", borderColor: appointmentColors.borderSoft,
    bgcolor: appointmentColors.paper,
};
