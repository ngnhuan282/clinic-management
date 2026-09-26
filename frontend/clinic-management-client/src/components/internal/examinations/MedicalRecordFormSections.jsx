import {
    Autocomplete,
    Alert,
    Box,
    Button,
    FormControlLabel,
    IconButton,
    Paper,
    Radio,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import MedicalInformationOutlinedIcon from "@mui/icons-material/MedicalInformationOutlined";
import { useState } from "react";

import DiseaseFormDialog from "../diseases/DiseaseFormDialog";

export function getDiseaseLabel(option) {
    if (!option) {
        return "";
    }

    return `${option.diseaseCode} - ${option.diseaseName}`;
}

function SectionHeader({ icon, title, subtitle, sx = {} }) {
    const Icon = icon;

    return (
        <Stack
            direction="row"
            spacing={1.25}
            alignItems="flex-start"
            sx={{ mb: 2, ...sx }}
        >
            <Box
                sx={{
                    width: 34,
                    height: 34,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 1.5,
                    color: "#005DAC",
                    bgcolor: "#EFF6FF",
                }}
            >
                <Icon fontSize="small" />
            </Box>

            <Box sx={{ minWidth: 0 }}>
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: "#1F2937",
                        fontWeight: 800,
                        lineHeight: 1.25,
                    }}
                >
                    {title}
                </Typography>

                {subtitle && (
                    <Typography
                        variant="body2"
                        sx={{ mt: 0.25, color: "#6B7280" }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Stack>
    );
}

function MedicalRecordFormSections({
    appointment,
    form,
    diseases,
    updateField,
    addDiagnosisRow,
    updateDiagnosisRow,
    setPrimaryDiagnosis,
    removeDiagnosisRow,
    savingDisease = false,
    onCreateDisease,
}) {
    const [diseaseDialogOpen, setDiseaseDialogOpen] = useState(false);
    const [diseaseSuccess, setDiseaseSuccess] = useState("");

    const handleCreateDisease = async (payload) => {
        await onCreateDisease(payload);
        setDiseaseSuccess("Đã thêm bệnh mới vào danh mục chẩn đoán.");
    };

    return (
        <>
        <Stack spacing={3}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 2.5 },
                    border: "1px solid #E5E9F0",
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                }}
            >
                <SectionHeader
                    icon={AssignmentOutlinedIcon}
                    title="1. Thông tin lượt khám"
                    subtitle="Dữ liệu tiếp nhận từ lịch hẹn"
                />

                <TextField
                    label="Lý do khám"
                    value={appointment?.reason || ""}
                    fullWidth
                    multiline
                    minRows={2}
                    InputProps={{ readOnly: true }}
                />
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 2.5 },
                    border: "1px solid #E5E9F0",
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                }}
            >
                <SectionHeader
                    icon={FactCheckOutlinedIcon}
                    title="2. Khám lâm sàng"
                    subtitle="Triệu chứng và ghi nhận ban đầu"
                />

                <TextField
                    label="Triệu chứng ghi nhận *"
                    value={form.symptoms}
                    onChange={(event) =>
                        updateField("symptoms", event.target.value)
                    }
                    fullWidth
                    multiline
                    minRows={5}
                    placeholder="Nhập triệu chứng, diễn tiến, dấu hiệu lâm sàng..."
                />
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 2.5 },
                    border: "1px solid #E5E9F0",
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "minmax(0, 1fr) auto",
                        },
                        gap: 1.5,
                        alignItems: "start",
                        width: "100%",
                        mb: 2,
                    }}
                >
                    <SectionHeader
                        icon={FactCheckOutlinedIcon}
                        title="3. Chẩn đoán"
                        subtitle="Chọn bệnh từ danh mục và đánh dấu chẩn đoán chính"
                        sx={{ mb: 0 }}
                    />

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{
                            flexShrink: 0,
                            justifySelf: { xs: "stretch", sm: "end" },
                        }}
                    >
                        {onCreateDisease && (
                            <Button
                                variant="outlined"
                                startIcon={<MedicalInformationOutlinedIcon />}
                                disabled={savingDisease}
                                onClick={() => setDiseaseDialogOpen(true)}
                                sx={{ whiteSpace: "nowrap" }}
                            >
                                Thêm bệnh mới
                            </Button>
                        )}

                        <Button
                            variant="outlined"
                            startIcon={<AddCircleOutlineOutlinedIcon />}
                            onClick={addDiagnosisRow}
                            sx={{ whiteSpace: "nowrap" }}
                        >
                            Thêm chẩn đoán
                        </Button>
                    </Stack>
                </Box>

                <Stack spacing={1.5}>
                    {form.diagnoses.map((diagnosis, index) => {
                        const selectedDisease =
                            diseases.find(
                                (disease) =>
                                    Number(disease.diseaseId) ===
                                    Number(diagnosis.diseaseId)
                            ) || null;

                        return (
                            <Box
                                key={diagnosis.localId}
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        md: "minmax(220px, 1fr) minmax(180px, 0.8fr) 112px 42px",
                                    },
                                    gap: 1.25,
                                    alignItems: "center",
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    border: "1px solid #E5E9F0",
                                    bgcolor: "#F8FAFC",
                                }}
                            >
                                <Autocomplete
                                    options={diseases}
                                    value={selectedDisease}
                                    getOptionLabel={getDiseaseLabel}
                                    isOptionEqualToValue={(option, value) =>
                                        option.diseaseId === value.diseaseId
                                    }
                                    onChange={(_, value) =>
                                        updateDiagnosisRow(
                                            diagnosis.localId,
                                            "diseaseId",
                                            value?.diseaseId || ""
                                        )
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={`Chẩn đoán ${index + 1}`}
                                            size="small"
                                        />
                                    )}
                                />

                                <TextField
                                    label="Ghi chú"
                                    size="small"
                                    value={diagnosis.note}
                                    onChange={(event) =>
                                        updateDiagnosisRow(
                                            diagnosis.localId,
                                            "note",
                                            event.target.value
                                        )
                                    }
                                />

                                <FormControlLabel
                                    control={
                                        <Radio
                                            checked={diagnosis.isPrimary}
                                            onChange={() =>
                                                setPrimaryDiagnosis(
                                                    diagnosis.localId
                                                )
                                            }
                                            size="small"
                                        />
                                    }
                                    label="Chính"
                                    sx={{
                                        m: 0,
                                        color: "#374151",
                                        "& .MuiFormControlLabel-label": {
                                            fontWeight: 700,
                                            fontSize: 14,
                                        },
                                    }}
                                />

                                <IconButton
                                    aria-label="Xóa chẩn đoán"
                                    onClick={() =>
                                        removeDiagnosisRow(
                                            diagnosis.localId
                                        )
                                    }
                                    sx={{
                                        justifySelf: {
                                            xs: "flex-start",
                                            md: "center",
                                        },
                                        color: "#DC2626",
                                        bgcolor: "#FEF2F2",
                                        "&:hover": {
                                            bgcolor: "#FEE2E2",
                                        },
                                    }}
                                >
                                    <DeleteOutlineOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        );
                    })}
                </Stack>
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 2.5 },
                    border: "1px solid #E5E9F0",
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                }}
            >
                <SectionHeader
                    icon={CheckCircleOutlineOutlinedIcon}
                    title="4. Kết luận"
                    subtitle="Tóm tắt hướng xử trí sau khám"
                />

                <TextField
                    label="Kết luận"
                    value={form.conclusion}
                    onChange={(event) =>
                        updateField("conclusion", event.target.value)
                    }
                    fullWidth
                    multiline
                    minRows={4}
                    placeholder="Nhập kết luận khám bệnh..."
                />
            </Paper>
        </Stack>
        <DiseaseFormDialog
            open={diseaseDialogOpen}
            disease={null}
            saving={savingDisease}
            onClose={() => setDiseaseDialogOpen(false)}
            onSubmit={handleCreateDisease}
        />

        <Snackbar
            open={Boolean(diseaseSuccess)}
            autoHideDuration={3000}
            onClose={() => setDiseaseSuccess("")}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
            <Alert
                severity="success"
                variant="filled"
                onClose={() => setDiseaseSuccess("")}
                sx={{ width: "100%" }}
            >
                {diseaseSuccess}
            </Alert>
        </Snackbar>
        </>
    );
}

export default MedicalRecordFormSections;
