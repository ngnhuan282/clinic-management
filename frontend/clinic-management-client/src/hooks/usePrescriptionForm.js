import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getMedicalRecordByAppointment } from "../api/examinationApi";
import {
    cancelPrescription,
    createPrescription,
    getPrescriptionByMedicalRecord,
    getPrescriptionMedicineOptions,
    updatePrescription,
} from "../api/prescriptionApi";
import getApiErrorMessage from "../utils/errorHandler";
import { getPrescriptionTextError } from "../validators/prescriptionValidator";
import useAuth from "./useAuth";
import { readClinicalDraft, writeClinicalDraft, clearClinicalDraft, getPrescriptionFormKey } from "../utils/clinicalDrafts";

function createLocalId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toLocalDetails(details = []) {
    return details.map((detail) => ({
        localId: createLocalId(),
        prescriptionDetailId: detail.prescriptionDetailId || null,
        medicineId: detail.medicineId || "",
        dosage: detail.dosage || "",
        quantity: detail.quantity || 1,
        instructions: detail.instructions || "",
    }));
}

function toPayloadDetails(details) {
    return details.map((detail) => ({
        medicineId: Number(detail.medicineId),
        dosage: detail.dosage.trim(),
        quantity: Number(detail.quantity),
        instructions: detail.instructions.trim(),
    }));
}

function buildStockStatus(medicine, quantity) {
    const availableQuantity = Number(medicine?.availableQuantity || 0);
    const requestedQuantity = Number(quantity || 0);

    if (!medicine || availableQuantity <= 0) {
        return "OutOfStock";
    }

    if (availableQuantity < requestedQuantity) {
        return "Insufficient";
    }

    return "Available";
}

function usePrescriptionForm({ appointmentId }) {
    const { userId, sessionRevision } = useAuth();
    const draftSession = JSON.stringify([userId, sessionRevision]);
    const draftKey = `prescription:${appointmentId}`;
    const cachedDraft = useRef(readClinicalDraft(draftSession, draftKey));
    const [medicalRecord, setMedicalRecord] = useState(null);
    const [prescription, setPrescription] = useState(null);
    const [medicineOptions, setMedicineOptions] = useState([]);
    const [form, setForm] = useState({
        notes: "",
        details: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const hasUnsavedChanges = !loading && getPrescriptionFormKey(form) !== getPrescriptionFormKey(prescription || {});
    const discardDraft = useCallback(() => clearClinicalDraft(draftSession, draftKey), [draftSession, draftKey]);
    useEffect(() => {
        if (loading || !medicalRecord) return;
        if (!hasUnsavedChanges) { clearClinicalDraft(draftSession, draftKey); return; }
        writeClinicalDraft(draftSession, draftKey, { form, medicalRecordId: medicalRecord?.medicalRecordId,
            recordVersion: medicalRecord?.updatedAt, prescriptionId: prescription?.prescriptionId,
            prescriptionVersion: prescription?.updatedAt });
    }, [draftSession, draftKey, loading, hasUnsavedChanges, form, medicalRecord, prescription]);

    const medicineById = useMemo(() => {
        return new Map(
            medicineOptions.map((medicine) => [
                Number(medicine.medicineId),
                medicine,
            ])
        );
    }, [medicineOptions]);

    const detailSummaries = useMemo(() => {
        return form.details.map((detail) => {
            const medicine = medicineById.get(
                Number(detail.medicineId)
            );
            const quantity = Number(detail.quantity || 0);
            const stockStatus = buildStockStatus(medicine, quantity);
            const lineAmount =
                quantity * Number(medicine?.unitPrice || 0);

            return {
                ...detail,
                medicine,
                stockStatus,
                availableQuantity: Number(
                    medicine?.availableQuantity || 0
                ),
                lineAmount,
            };
        });
    }, [form.details, medicineById]);

    const totals = useMemo(() => {
        return {
            totalItems: detailSummaries.length,
            totalQuantity: detailSummaries.reduce(
                (sum, detail) => sum + Number(detail.quantity || 0),
                0
            ),
            estimatedTotalAmount: detailSummaries.reduce(
                (sum, detail) => sum + detail.lineAmount,
                0
            ),
            stockWarningCount: detailSummaries.filter((detail) =>
                ["Insufficient", "OutOfStock"].includes(
                    detail.stockStatus
                )
            ).length,
        };
    }, [detailSummaries]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const record =
                await getMedicalRecordByAppointment(appointmentId);
            const [medicines, existingPrescription] =
                await Promise.all([
                    getPrescriptionMedicineOptions(),
                    getPrescriptionByMedicalRecord(
                        record.medicalRecordId
                    ),
                ]);

            setMedicalRecord(record);
            setMedicineOptions(medicines || []);
            setPrescription(existingPrescription || null);
            const draft = cachedDraft.current;
            cachedDraft.current = null;
            const canRestore = draft?.medicalRecordId === record.medicalRecordId && draft.recordVersion === record.updatedAt
                && draft.prescriptionId === existingPrescription?.prescriptionId && draft.prescriptionVersion === existingPrescription?.updatedAt;
            setForm(canRestore ? draft.form : {
                notes: existingPrescription?.notes || "",
                details: toLocalDetails(
                    existingPrescription?.details || []
                ),
            });
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Không thể tải dữ liệu kê đơn."
                )
            );
        } finally {
            setLoading(false);
        }
    }, [appointmentId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void loadData();
        }, 0);

        return () => clearTimeout(timer);
    }, [loadData]);

    const updateNotes = useCallback((notes) => {
        setActionError("");
        setForm((current) => ({
            ...current,
            notes,
        }));
    }, []);

    const addMedicine = useCallback((medicine) => {
        if (!medicine) {
            return false;
        }

        const medicineId = Number(medicine.medicineId);
        let added = false;

        setForm((current) => {
            if (
                current.details.some(
                    (detail) =>
                        Number(detail.medicineId) === medicineId
                )
            ) {
                return current;
            }

            added = true;

            return {
                ...current,
                details: [
                    ...current.details,
                    {
                        localId: createLocalId(),
                        prescriptionDetailId: null,
                        medicineId,
                        dosage: "",
                        quantity: 1,
                        instructions: "",
                    },
                ],
            };
        });

        return added;
    }, []);

    const updateDetail = useCallback((localId, field, value) => {
        setActionError("");
        setForm((current) => ({
            ...current,
            details: current.details.map((detail) =>
                detail.localId === localId
                    ? { ...detail, [field]: value }
                    : detail
            ),
        }));
    }, []);

    const removeDetail = useCallback((localId) => {
        setForm((current) => ({
            ...current,
            details: current.details.filter(
                (detail) => detail.localId !== localId
            ),
        }));
    }, []);

    const validateForm = useCallback(() => {
        if (!medicalRecord?.medicalRecordId) {
            return "Cần có hồ sơ bệnh án trước khi kê đơn.";
        }

        if (form.details.length === 0) {
            return "Vui lòng chọn ít nhất một thuốc.";
        }

        const hasInvalidDetail = form.details.some((detail) =>
            !detail.medicineId ||
            Number(detail.quantity) <= 0 ||
            !detail.dosage.trim() ||
            !detail.instructions.trim()
        );

        if (hasInvalidDetail) {
            return "Vui lòng nhập đủ thuốc, số lượng, liều dùng và hướng dẫn.";
        }

        const notesError = getPrescriptionTextError("notes", form.notes);
        if (notesError) return notesError;

        for (const [index, detail] of form.details.entries()) {
            const textError = getPrescriptionTextError("dosage", detail.dosage)
                || getPrescriptionTextError("instructions", detail.instructions);
            if (textError) return `Thuốc ${index + 1}: ${textError}`;
        }

        const hasDuplicateMedicine =
            new Set(form.details.map((detail) => Number(detail.medicineId)))
                .size !== form.details.length;

        if (hasDuplicateMedicine) {
            return "Một thuốc chỉ nên xuất hiện một lần trong đơn.";
        }

        return "";
    }, [form.details, form.notes, medicalRecord]);

    const refreshMedicalRecord = useCallback(async () => {
        try {
            setMedicalRecord(await getMedicalRecordByAppointment(appointmentId));
        } catch {
            setMedicalRecord(null);
            setError("Đơn thuốc đã được cập nhật nhưng chưa tải được hồ sơ mới. Vui lòng thử lại.");
        }
    }, [appointmentId]);

    const savePrescription = useCallback(async () => {
        const validationMessage = validateForm();

        if (validationMessage) {
            setActionError(validationMessage);
            return null;
        }

        setSaving(true);
        setActionError("");
        setSuccessMessage("");

        try {
            const payload = {
                medicalRecordId: medicalRecord.medicalRecordId,
                notes: form.notes,
                details: toPayloadDetails(form.details),
            };

            const saved = prescription?.prescriptionId
                ? await updatePrescription(
                    prescription.prescriptionId,
                    {
                        notes: payload.notes,
                        details: payload.details,
                    }
                )
                : await createPrescription(payload);

            setPrescription(saved);
            discardDraft();
            setForm({
                notes: saved.notes || "",
                details: toLocalDetails(saved.details || []),
            });
            setSuccessMessage("Đã lưu đơn thuốc.");
            await refreshMedicalRecord();

            return saved;
        } catch (err) {
            setActionError(
                getApiErrorMessage(
                    err,
                    "Không thể lưu đơn thuốc."
                )
            );

            return null;
        } finally {
            setSaving(false);
        }
    }, [
        form.details,
        form.notes,
        medicalRecord,
        prescription,
        refreshMedicalRecord,
        validateForm,
        discardDraft,
    ]);

    const cancelPrescriptionOrder = useCallback(async () => {
        if (!prescription?.prescriptionId) {
            return null;
        }

        setSaving(true);
        setActionError("");
        setSuccessMessage("");

        try {
            const cancelled = await cancelPrescription(
                prescription.prescriptionId
            );

            setPrescription(null);
            discardDraft();
            setForm({
                notes: "",
                details: [],
            });
            setSuccessMessage("Đã hủy đơn thuốc.");
            await refreshMedicalRecord();

            return cancelled;
        } catch (err) {
            setActionError(
                getApiErrorMessage(
                    err,
                    "Không thể hủy đơn thuốc."
                )
            );

            return null;
        } finally {
            setSaving(false);
        }
    }, [prescription, refreshMedicalRecord, discardDraft]);

    return {
        medicalRecord,
        prescription,
        medicineOptions,
        form,
        detailSummaries,
        totals,
        hasUnsavedChanges,
        discardDraft,
        loading,
        saving,
        error,
        actionError,
        successMessage,
        loadData,
        updateNotes,
        addMedicine,
        updateDetail,
        removeDetail,
        savePrescription,
        cancelPrescriptionOrder,
        clearActionError: () => setActionError(""),
        clearSuccessMessage: () => setSuccessMessage(""),
    };
}

export default usePrescriptionForm;
