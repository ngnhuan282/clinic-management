import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
    createMedicalRecord,
    getExaminationQueue,
    getMedicalRecordByAppointment,
    updateMedicalRecord,
} from "../api/examinationApi";
import { getDiseaseOptions } from "../api/diseaseApi";
import { normalizeExaminationStatus } from "../components/internal/examinations/examinationStatus";
import getApiErrorMessage from "../utils/errorHandler";
import useAuth from "./useAuth";
import { readClinicalDraft, writeClinicalDraft, clearClinicalDraft } from "../utils/clinicalDrafts";
import {
    getMedicalRecordContentKey,
    normalizePayloadDiagnoses,
    restoreMedicalRecordDraft,
    updateMedicalRecordForm,
} from "../utils/medicalRecordConfirmation";

let diagnosisRowSeed = 1;

function createDiagnosisRow(diagnosis = {}) {
    return {
        localId: `diagnosis-${diagnosis.recordDiagnosisId || diagnosis.diseaseId || diagnosisRowSeed++}`,
        diseaseId: diagnosis.diseaseId || "",
        isPrimary: Boolean(diagnosis.isPrimary),
        note: diagnosis.note || "",
    };
}

function createEmptyForm() {
    return {
        symptoms: "",
        conclusion: "",
        paperBookConfirmed: false,
        paperBookConfirmationPending: false,
        diagnoses: [createDiagnosisRow()],
    };
}

function formatTime(value) {
    if (!value) {
        return "--:--";
    }

    if (typeof value === "string") {
        return value.slice(0, 5);
    }

    return String(value).slice(0, 5);
}

function getShiftFromTime(value) {
    const hour = Number(formatTime(value).split(":")[0]);

    if (Number.isNaN(hour)) {
        return "morning";
    }

    return hour < 12 ? "morning" : "afternoon";
}

function getInitials(fullName) {
    const parts = String(fullName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return "BN";
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toLocaleUpperCase("vi-VN");
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`
        .toLocaleUpperCase("vi-VN");
}

function buildPatientCode(patientId, appointmentId) {
    if (patientId) {
        return `BN-${String(patientId).padStart(5, "0")}`;
    }

    return `LH-${String(appointmentId).padStart(5, "0")}`;
}

function mapQueueAppointment(item) {
    return {
        appointmentId: item.appointmentId,
        queueNumber: item.queueNumber || item.appointmentId,
        time: formatTime(item.startTime),
        shift: getShiftFromTime(item.startTime),
        status: normalizeExaminationStatus(item.status),
        patientName: item.patientName,
        initials: getInitials(item.patientName),
        avatarColor: "#005DAC",
        patientCode: buildPatientCode(
            item.patientProfileId,
            item.appointmentId
        ),
        patientBookId: item.patientBookId || null,
        patientBookNumber: item.patientBookNumber || "",
        bookVerifiedAt: item.bookVerifiedAt || null,
        phone: item.patientPhone,
        reason: item.reason,
    };
}

function mapRecordAppointment(record) {
    return {
        appointmentId: record.appointmentId,
        queueNumber: record.appointmentId,
        time: formatTime(record.startTime),
        shift: getShiftFromTime(record.startTime),
        status: normalizeExaminationStatus(record.status),
        patientName: record.patientName,
        initials: getInitials(record.patientName),
        avatarColor: "#005DAC",
        patientCode: buildPatientCode(
            record.patientProfileId,
            record.appointmentId
        ),
        patientBookId: record.patientBookId || null,
        patientBookNumber: record.patientBookNumber || "",
        bookVerifiedAt: record.bookVerifiedAt || null,
        phone: record.patientPhone,
        reason: record.reason || "",
    };
}

function mapRecordForm(record) {
    const diagnoses = record.diagnoses?.length
        ? record.diagnoses.map(createDiagnosisRow)
        : [createDiagnosisRow()];

    return {
        symptoms: record.symptoms || "",
        conclusion: record.conclusion || "",
        paperBookConfirmed: Boolean(record.paperBookUpdatedAt),
        paperBookConfirmationPending: false,
        diagnoses,
    };
}

function isNotFound(error) {
    return error?.response?.status === 404;
}

function getErrorMessage(error, fallback) {
    if (error?.response?.data?.code === 7107) return getApiErrorMessage(error, fallback);
    const message = error?.response?.data?.message ||
        error?.message ||
        fallback;

    if (message === "Appointment not found") {
        return "Không tìm thấy lượt khám trong database. Vui lòng mở hồ sơ từ một lượt khám thật đã tải từ backend.";
    }

    return message;
}

function useMedicalRecordForm({
    appointmentId,
    initialAppointment,
    initialDraft,
}) {
    const { userId, sessionRevision } = useAuth();
    const draftSession = JSON.stringify([userId, sessionRevision]);
    const draftKey = `record:${appointmentId}`;
    const memoryDraft = readClinicalDraft(draftSession, draftKey);
    const [cachedDraft] = useState(() => initialDraft || memoryDraft);
    const [appointment, setAppointment] = useState(
        initialAppointment || null
    );
    const [diseases, setDiseases] = useState([]);
    const [medicalRecord, setMedicalRecord] = useState(null);
    const [form, setForm] = useState(() => cachedDraft?.form || createEmptyForm());
    const restoredDraft = useRef(cachedDraft);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [recordConflict, setRecordConflict] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const selectedDiagnoses = useMemo(
        () => normalizePayloadDiagnoses(form.diagnoses),
        [form.diagnoses]
    );

    const hasUnsavedChanges = !loading && (getMedicalRecordContentKey(form) !== getMedicalRecordContentKey(medicalRecord || {})
        || form.paperBookConfirmed !== Boolean(medicalRecord?.paperBookUpdatedAt) || form.paperBookConfirmationPending);
    const discardDraft = useCallback(() => clearClinicalDraft(draftSession, draftKey), [draftSession, draftKey]);
    useEffect(() => {
        if (loading || error) return;
        if (!hasUnsavedChanges) { clearClinicalDraft(draftSession, draftKey); return; }
        writeClinicalDraft(draftSession, draftKey, { form, updatedAt: medicalRecord?.updatedAt,
            patientBookId: medicalRecord?.patientBookId,
            recordContentKey: medicalRecord ? getMedicalRecordContentKey(medicalRecord) : null });
    }, [draftSession, draftKey, form, medicalRecord, loading, error, hasUnsavedChanges]);

    const completionReady = Boolean(
        !recordConflict && !loading &&
        form.symptoms.trim() &&
        form.conclusion.trim() &&
        selectedDiagnoses.length > 0 &&
        form.paperBookConfirmed &&
        (medicalRecord?.patientBookId || appointment?.patientBookId)
    );

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        if (initialAppointment) {
            setAppointment(initialAppointment);
        }

        try {
            const diseaseOptions = await getDiseaseOptions();
            setDiseases(diseaseOptions);
        } catch {
            setDiseases([]);
            setError("Không thể tải danh mục bệnh.");
        }

        let loadedRecord = null;

        try {
            loadedRecord =
                await getMedicalRecordByAppointment(appointmentId);
            setMedicalRecord(loadedRecord);
            setRecordConflict(false);
            setActionError("");
            const draft = restoredDraft.current;
            setForm(restoreMedicalRecordDraft(draft, loadedRecord) || mapRecordForm(loadedRecord));
            setAppointment((current) => {
                const apiAppointment =
                    mapRecordAppointment(loadedRecord);

                return {
                    ...current,
                    ...apiAppointment,
                    reason: current?.reason || apiAppointment.reason,
                    status: normalizeExaminationStatus(
                        loadedRecord.status
                    ),
                };
            });
        } catch (recordError) {
            if (!isNotFound(recordError)) {
                setError(
                    getErrorMessage(
                        recordError,
                        "Không thể tải hồ sơ bệnh án."
                    )
                );
            }
        }

        if (!loadedRecord && !initialAppointment) {
            try {
                const queueResult = await getExaminationQueue({
                    pageNumber: 1,
                    pageSize: 100,
                });
                const queueAppointment = queueResult.items
                    ?.map(mapQueueAppointment)
                    .find((item) =>
                        String(item.appointmentId) ===
                        String(appointmentId)
                    );

                if (queueAppointment) {
                    setAppointment(queueAppointment);
                } else {
                    setError("Không tìm thấy lượt khám này.");
                }
            } catch (queueError) {
                setError(
                    getErrorMessage(
                        queueError,
                        "Không thể tải thông tin lượt khám."
                    )
                );
            }
        }

        restoredDraft.current = null;
        setLoading(false);
    }, [appointmentId, initialAppointment]);

    useEffect(() => {
        const timer = setTimeout(() => { void loadData(); }, 0);
        return () => clearTimeout(timer);
    }, [loadData]);

    const updateField = (field, value) => {
        setForm((current) => updateMedicalRecordForm(current, {
            [field]: value,
        }));
    };

    const addDiagnosisRow = () => {
        setForm((current) => updateMedicalRecordForm(current, {
            diagnoses: [
                ...current.diagnoses,
                createDiagnosisRow(),
            ],
        }));
    };

    const updateDiagnosisRow = (localId, field, value) => {
        setForm((current) => updateMedicalRecordForm(current, {
            diagnoses: current.diagnoses.map((diagnosis) =>
                diagnosis.localId === localId
                    ? {
                        ...diagnosis,
                        [field]: value,
                    }
                    : diagnosis
            ),
        }));
    };

    const setPrimaryDiagnosis = (localId) => {
        setForm((current) => updateMedicalRecordForm(current, {
            diagnoses: current.diagnoses.map((diagnosis) => ({
                ...diagnosis,
                isPrimary: diagnosis.localId === localId,
            })),
        }));
    };

    const removeDiagnosisRow = (localId) => {
        setForm((current) => {
            if (current.diagnoses.length === 1) {
                return updateMedicalRecordForm(current, {
                    diagnoses: [createDiagnosisRow()],
                });
            }

            const diagnoses = current.diagnoses.filter(
                (diagnosis) => diagnosis.localId !== localId
            ).map((diagnosis) => ({ ...diagnosis }));

            if (
                diagnoses.length > 0 &&
                !diagnoses.some((diagnosis) => diagnosis.isPrimary)
            ) {
                diagnoses[0].isPrimary = true;
            }

            return updateMedicalRecordForm(current, {
                diagnoses,
            });
        });
    };

    const validateBeforeSubmit = (markCompleted) => {
        if (!form.symptoms.trim()) {
            return "Vui lòng nhập triệu chứng trước khi lưu hồ sơ.";
        }

        const selectedDiseaseIds = selectedDiagnoses.map(
            (diagnosis) => diagnosis.diseaseId
        );
        const hasDuplicate = new Set(selectedDiseaseIds).size !==
            selectedDiseaseIds.length;

        if (hasDuplicate) {
            return "Một chẩn đoán không nên được chọn nhiều lần.";
        }

        if (markCompleted && selectedDiagnoses.length === 0) {
            return "Vui lòng chọn ít nhất một chẩn đoán trước khi hoàn tất khám.";
        }

        if (markCompleted && !form.conclusion.trim()) {
            return "Vui lòng nhập kết luận trước khi hoàn tất khám.";
        }

        if (
            markCompleted &&
            !(medicalRecord?.patientBookId || appointment?.patientBookId)
        ) {
            return "Lượt khám chưa có sổ khám giấy được đối chiếu.";
        }

        if (markCompleted && !form.paperBookConfirmed) {
            return "Vui lòng xác nhận đã ghi lượt khám vào sổ giấy.";
        }

        return "";
    };

    const submitRecord = async (markCompleted) => {
        if (recordConflict || loading) return null;
        const validationMessage =
            validateBeforeSubmit(markCompleted);

        if (validationMessage) {
            setActionError(validationMessage);
            return null;
        }

        const payload = {
            appointmentId: Number(appointmentId),
            symptoms: form.symptoms.trim(),
            conclusion: form.conclusion.trim() || null,
            patientBookId:
                medicalRecord?.patientBookId ||
                appointment?.patientBookId ||
                null,
            paperBookConfirmed: form.paperBookConfirmed,
            markCompleted,
            diagnoses: selectedDiagnoses,
            expectedUpdatedAt: medicalRecord?.updatedAt,
        };

        setSaving(true);
        setActionError("");
        setSuccessMessage("");

        try {
            const savedRecord = medicalRecord?.medicalRecordId
                ? await updateMedicalRecord(
                    medicalRecord.medicalRecordId,
                    payload
                )
                : await createMedicalRecord(payload);

            setMedicalRecord(savedRecord);
            discardDraft();
            setForm(mapRecordForm(savedRecord));
            setAppointment((current) => ({
                ...current,
                ...mapRecordAppointment(savedRecord),
                reason: current?.reason || "",
            }));
            setSuccessMessage(
                markCompleted
                    ? "Đã hoàn tất hồ sơ khám."
                    : "Đã lưu tạm hồ sơ khám."
            );

            return savedRecord;
        } catch (submitError) {
            if (submitError?.response?.data?.code === 7107) {
                setRecordConflict(true);
                setForm((current) => updateMedicalRecordForm(current, { paperBookConfirmed: false }));
            }
            setActionError(
                getErrorMessage(
                    submitError,
                    "Không thể lưu hồ sơ khám."
                )
            );
            return null;
        } finally {
            setSaving(false);
        }
    };

    return {
        appointment,
        diseases,
        medicalRecord,
        form,
        loading,
        saving,
        error,
        actionError,
        recordConflict,
        successMessage,
        selectedDiagnoses,
        completionReady,
        hasUnsavedChanges,
        discardDraft,
        createDraft: () => ({
            form,
            updatedAt: medicalRecord?.updatedAt,
            patientBookId: medicalRecord?.patientBookId,
            recordContentKey: medicalRecord ? getMedicalRecordContentKey(medicalRecord) : null,
        }),
        updateField,
        addDiagnosisRow,
        updateDiagnosisRow,
        setPrimaryDiagnosis,
        removeDiagnosisRow,
        submitRecord,
        reload: loadData,
        clearActionError: () => setActionError(""),
        clearSuccessMessage: () => setSuccessMessage(""),
    };
}

export default useMedicalRecordForm;
