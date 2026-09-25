import {
    Box,
    Button,
    Chip,
    Divider,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import RadioButtonUncheckedOutlinedIcon from "@mui/icons-material/RadioButtonUncheckedOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import { getDiseaseLabel } from "./MedicalRecordFormSections";

function ChecklistItem({ checked, label }) {
    const Icon = checked
        ? CheckCircleOutlineOutlinedIcon
        : RadioButtonUncheckedOutlinedIcon;

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Icon
                fontSize="small"
                sx={{ color: checked ? "#059669" : "#9CA3AF" }}
            />
            <Typography
                variant="body2"
                sx={{
                    color: checked ? "#1F2937" : "#6B7280",
                    fontWeight: 600,
                }}
            >
                {label}
            </Typography>
        </Stack>
    );
}

function MedicalRecordStatusPanel({
    diseases,
    selectedDiagnoses,
    form,
    saving,
    completionReady,
    submitRecord,
}) {
    const selectedDiagnosisDetails = selectedDiagnoses.map(
        (diagnosis) => ({
            ...diagnosis,
            disease: diseases.find(
                (item) =>
                    Number(item.diseaseId) ===
                    Number(diagnosis.diseaseId)
            ),
        })
    );

    return (
        <Stack spacing={3}>
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    border: "1px solid #E5E9F0",
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: "#1F2937",
                        fontWeight: 900,
                    }}
                >
                    Trạng thái hồ sơ
                </Typography>

                <Stack spacing={1.25} sx={{ mt: 2 }}>
                    <ChecklistItem
                        checked={Boolean(form.symptoms.trim())}
                        label="Đã nhập triệu chứng"
                    />
                    <ChecklistItem
                        checked={selectedDiagnoses.length > 0}
                        label="Đã chọn chẩn đoán"
                    />
                    <ChecklistItem
                        checked={Boolean(form.conclusion.trim())}
                        label="Đã nhập kết luận"
                    />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.25}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<SaveOutlinedIcon />}
                        disabled={saving}
                        onClick={() => submitRecord(false)}
                        sx={{ minHeight: 42 }}
                    >
                        Lưu tạm hồ sơ
                    </Button>

                    <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleOutlineOutlinedIcon />}
                        disabled={saving || !completionReady}
                        onClick={() => submitRecord(true)}
                        sx={{ minHeight: 42 }}
                    >
                        Hoàn tất khám
                    </Button>
                </Stack>
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    border: "1px solid #E5E9F0",
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: "#1F2937",
                        fontWeight: 900,
                    }}
                >
                    Chẩn đoán đã chọn
                </Typography>

                <Stack spacing={1} sx={{ mt: 2 }}>
                    {selectedDiagnosisDetails.length ? (
                        selectedDiagnosisDetails.map((diagnosis) => (
                            <Box
                                key={diagnosis.diseaseId}
                                sx={{
                                    px: 1.25,
                                    py: 1,
                                    borderRadius: 1,
                                    border: "1px solid #E5E9F0",
                                    bgcolor: diagnosis.isPrimary
                                        ? "#EFF6FF"
                                        : "#F8FAFC",
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "#1F2937",
                                            fontWeight: 800,
                                        }}
                                    >
                                        {diagnosis.disease
                                            ? getDiseaseLabel(
                                                diagnosis.disease
                                            )
                                            : `Bệnh #${diagnosis.diseaseId}`}
                                    </Typography>

                                    {diagnosis.isPrimary && (
                                        <Chip
                                            size="small"
                                            label="Chính"
                                            sx={{
                                                color: "#005DAC",
                                                bgcolor: "#EFF6FF",
                                                fontWeight: 800,
                                            }}
                                        />
                                    )}
                                </Stack>

                                {diagnosis.note && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: "block",
                                            mt: 0.5,
                                            color: "#6B7280",
                                        }}
                                    >
                                        {diagnosis.note}
                                    </Typography>
                                )}
                            </Box>
                        ))
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{ color: "#6B7280" }}
                        >
                            Chưa chọn chẩn đoán.
                        </Typography>
                    )}
                </Stack>
            </Paper>
        </Stack>
    );
}

export default MedicalRecordStatusPanel;
