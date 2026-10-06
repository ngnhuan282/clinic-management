import { Chip } from "@mui/material";

const BOOK_STATUS = {
    Pending: { label: "Chờ cấp", color: "warning" },
    Issued: { label: "Đang sử dụng", color: "success" },
    Lost: { label: "Đã mất", color: "error" },
    Replaced: { label: "Đã cấp lại", color: "default" },
};

/**
 * @param {{ status: import("../../../api/patientBookApi").PatientBookStatus }} props
 */
export default function PatientBookStatusChip({ status }) {
    const config = BOOK_STATUS[status] ?? { label: status, color: "default" };
    return <Chip size="small" label={config.label} color={config.color} variant="outlined" />;
}
