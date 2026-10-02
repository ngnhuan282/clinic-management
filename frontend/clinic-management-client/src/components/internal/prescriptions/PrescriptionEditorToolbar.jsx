import { useMemo, useState } from "react";
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import LocalPharmacyOutlinedIcon from "@mui/icons-material/LocalPharmacyOutlined";

import { getPrescriptionStockStatusConfig } from "./prescriptionStockStatus";

function getMedicineLabel(option) {
    if (!option) {
        return "";
    }

    return `${option.medicineName} (${option.medicineCode})`;
}

function PrescriptionEditorToolbar({
    medicineOptions,
    selectedMedicineIds,
    onAddMedicine,
    disabled = false,
}) {
    const [selectedMedicine, setSelectedMedicine] = useState(null);

    const selectedIds = useMemo(
        () => new Set(selectedMedicineIds.map(Number)),
        [selectedMedicineIds]
    );

    const handleAdd = () => {
        const added = onAddMedicine(selectedMedicine);

        if (added) {
            setSelectedMedicine(null);
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: 2,
                border: "1px solid #E5E9F0",
                bgcolor: "#FFFFFF",
            }}
        >
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "minmax(260px, 1fr) auto",
                    },
                    gap: 1.5,
                    alignItems: "center",
                }}
            >
                <Autocomplete
                    options={medicineOptions}
                    value={selectedMedicine}
                    disabled={disabled}
                    getOptionLabel={getMedicineLabel}
                    isOptionEqualToValue={(option, value) =>
                        option.medicineId === value.medicineId
                    }
                    getOptionDisabled={(option) =>
                        selectedIds.has(Number(option.medicineId))
                    }
                    onChange={(_, value) => setSelectedMedicine(value)}
                    renderOption={(props, option) => {
                        const status =
                            getPrescriptionStockStatusConfig(
                                option.stockStatus
                            );

                        return (
                            <Box component="li" {...props}>
                                <Stack
                                    direction="row"
                                    spacing={1.25}
                                    alignItems="center"
                                    sx={{ width: "100%" }}
                                >
                                    <LocalPharmacyOutlinedIcon
                                        fontSize="small"
                                        sx={{ color: "#005DAC" }}
                                    />

                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "#1F2937",
                                                fontWeight: 800,
                                            }}
                                        >
                                            {option.medicineName}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {option.medicineCode} ·{" "}
                                            {option.categoryName}
                                        </Typography>
                                    </Box>

                                    <Chip
                                        size="small"
                                        label={`${option.availableQuantity} ${option.unit}`}
                                        sx={{
                                            color: status.color,
                                            bgcolor: status.backgroundColor,
                                            border:
                                                `1px solid ${status.borderColor}`,
                                            fontWeight: 800,
                                        }}
                                    />
                                </Stack>
                            </Box>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Chọn thuốc"
                            placeholder="Nhập tên hoặc mã thuốc"
                        />
                    )}
                />

                <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineOutlinedIcon />}
                    disabled={!selectedMedicine || disabled}
                    onClick={handleAdd}
                    sx={{
                        minHeight: 42,
                        px: 2.5,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                        boxShadow:
                            "0 8px 18px rgba(25, 118, 210, 0.18)",
                    }}
                >
                    Thêm thuốc
                </Button>
            </Box>
        </Paper>
    );
}

export default PrescriptionEditorToolbar;
