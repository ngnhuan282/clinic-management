import { appointmentColors, appointmentFieldSx, appointmentPrimaryButtonSx, appointmentSecondaryButtonSx, appointmentSurfaceSx } from "../../appointments/appointmentUi";
import "./bookingUi.css";

export const bookingColors = {
    ...appointmentColors,
    green: "var(--booking-green)", greenSoft: "var(--booking-green-soft)",
    greenBorder: "var(--booking-green-border)", greenText: "var(--booking-green-text)",
    blueSoft: "var(--appt-accent-soft)", borderStrong: "var(--booking-border-strong)",
    occupied: "var(--booking-occupied)",
};

export const bookingPanelSx = {
    ...appointmentSurfaceSx, borderRadius: "12px", p: { xs: 2, md: 3 },
    boxShadow: "0 1px 3px var(--booking-panel-shadow)",
};

export const bookingSectionTitleSx = {
    fontSize: 18, fontWeight: 800, lineHeight: 1.45, color: bookingColors.heading,
};

export const bookingFieldSx = {
    ...appointmentFieldSx,
    "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: bookingColors.paper, minHeight: 56 },
};

export const bookingPrimaryButtonSx = { ...appointmentPrimaryButtonSx, minHeight: 44, fontWeight: 800 };
export const bookingSecondaryButtonSx = {
    ...appointmentSecondaryButtonSx, minHeight: 44, fontWeight: 700, borderColor: bookingColors.primary,
};
