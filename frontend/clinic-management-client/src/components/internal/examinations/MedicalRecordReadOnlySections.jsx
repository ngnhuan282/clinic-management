import {
    Box,
    Chip,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

function SectionHeader({ icon, title }) {
    const Icon = icon;

    return (
        <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{ mb: 2 }}
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

            <Typography
                variant="subtitle1"
                sx={{
                    color: "#1F2937",
                    fontWeight: 900,
                }}
            >
                {title}
            </Typography>
        </Stack>
    );
}

function ReadOnlyText({ children, muted = false }) {
    return (
        <Box
            sx={{
                minHeight: 74,
                px: 1.75,
                py: 1.5,
                borderRadius: 1.5,
                border: "1px solid #E5E9F0",
                bgcolor: "#F8FAFC",
            }}
        >
            <Typography
                variant="body2"
                sx={{
                    color: muted ? "#6B7280" : "#1F2937",
                    fontWeight: muted ? 500 : 600,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                }}
            >
                {children}
            </Typography>
        </Box>
    );
}

function MedicalRecordReadOnlySections({ record }) {
    const diagnoses = record?.diagnoses || [];

    return (
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
                    icon={AssignmentTurnedInOutlinedIcon}
                    title="Triệu chứng ghi nhận"
                />

                <ReadOnlyText muted={!record?.symptoms}>
                    {record?.symptoms || "Chưa ghi nhận triệu chứng."}
                </ReadOnlyText>
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
                    title="Chẩn đoán"
                />

                <Stack spacing={1.25}>
                    {diagnoses.length ? (
                        diagnoses.map((diagnosis) => (
                            <Box
                                key={diagnosis.recordDiagnosisId}
                                sx={{
                                    px: 1.5,
                                    py: 1.25,
                                    borderRadius: 1.5,
                                    border: "1px solid #E5E9F0",
                                    bgcolor: diagnosis.isPrimary
                                        ? "#EFF6FF"
                                        : "#F8FAFC",
                                }}
                            >
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1}
                                    alignItems={{
                                        xs: "flex-start",
                                        sm: "center",
                                    }}
                                    justifyContent="space-between"
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "#111827",
                                            fontWeight: 900,
                                        }}
                                    >
                                        {diagnosis.diseaseCode} -{" "}
                                        {diagnosis.diseaseName}
                                    </Typography>

                                    {diagnosis.isPrimary && (
                                        <Chip
                                            size="small"
                                            label="Chẩn đoán chính"
                                            sx={{
                                                color: "#005DAC",
                                                bgcolor: "#DBEAFE",
                                                fontWeight: 900,
                                            }}
                                        />
                                    )}
                                </Stack>

                                {diagnosis.note && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            mt: 0.75,
                                            color: "#6B7280",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {diagnosis.note}
                                    </Typography>
                                )}
                            </Box>
                        ))
                    ) : (
                        <ReadOnlyText muted>
                            Chưa có chẩn đoán trong hồ sơ này.
                        </ReadOnlyText>
                    )}
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
                    title="Kết luận"
                />

                <ReadOnlyText muted={!record?.conclusion}>
                    {record?.conclusion || "Chưa có kết luận."}
                </ReadOnlyText>
            </Paper>
        </Stack>
    );
}

export default MedicalRecordReadOnlySections;
