import { useCallback, useEffect, useMemo, useState } from "react";

import {
    createMedicalRecord,
    getExaminationQueue,
    getMedicalRecordByAppointment,
    updateMedicalRecord,
} from "../api/examinationApi";
import {
    createDisease,
    getDiseaseOptions,
} from "../api/diseaseApi";
import { normalizeExaminationStatus } from "../components/internal/examinations/examinationStatus";

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
            item.patientId,
            item.appointmentId
        ),
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
            record.patientId,
            record.appointmentId
        ),
        phone: record.patientPhone,
        reason: "",
    };
}

function mapRecordForm(record) {
    const diagnoses = record.diagnoses?.length
        ? record.diagnoses.map(createDiagnosisRow)
        : [createDiagnosisRow()];

    return {
        symptoms: record.symptoms || "",
        conclusion: record.conclusion || "",
        diagnoses,
    };
}

function mapDiseaseOption(disease) {
    return {
        diseaseId: disease.diseaseId,
        diseaseCode: disease.diseaseCode,
        diseaseName: disease.diseaseName,
    };
}

function isNotFound(error) {
    return error?.response?.status === 404;
}

function getErrorMessage(error, fallback) {
    const message = error?.response?.data?.message ||
        error?.message ||
        fallback;

    if (message === "Appointment not found") {
        return "Không tìm thấy lượt khám trong database. Vui lòng mở hồ sơ từ một lượt khám thật đã tải từ backend.";
    }

    return message;
}

function normalizePayloadDiagnoses(diagnoses) {
    const selectedDiagnoses = diagnoses
        .filter((diagnosis) => diagnosis.diseaseId)
        .map((diagnosis) => ({
            diseaseId: Number(diagnosis.diseaseId),
            isPrimary: diagnosis.isPrimary,
            note: diagnosis.note?.trim() || null,
        }));

    const hasPrimary = selectedDiagnoses.some(
        (diagnosis) => diagnosis.isPrimary
    );

    if (selectedDiagnoses.length > 0 && !hasPrimary) {
        selectedDiagnoses[0].isPrimary = true;
    }

    return selectedDiagnoses;
}

function useMedicalRecordForm({
    appointmentId,
    initialAppointment,
}) {
    const [appointment, setAppointment] = useState(
        initialAppointment || null
    );
    const [diseases, setDiseases] = useState([]);
    const [medicalRecord, setMedicalRecord] = useState(null);
    const [form, setForm] = useState(createEmptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [diseaseSaving, setDiseaseSaving] = useState(false);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const selectedDiagnoses = useMemo(
        () => normalizePayloadDiagnoses(form.diagnoses),
        [form.diagnoses]
    );

    const completionReady = Boolean(
        form.symptoms.trim() &&
        form.conclusion.trim() &&
        selectedDiagnoses.length > 0
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
            setForm(mapRecordForm(loadedRecord));
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
            if (!isNotFound(recordError) && !initialAppointment) {
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

        setLoading(false);
    }, [appointmentId, initialAppointment]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const addDiagnosisRow = () => {
        setForm((current) => ({
            ...current,
            diagnoses: [
                ...current.diagnoses,
                createDiagnosisRow(),
            ],
        }));
    };

    const updateDiagnosisRow = (localId, field, value) => {
        setForm((current) => ({
            ...current,
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
        setForm((current) => ({
            ...current,
            diagnoses: current.diagnoses.map((diagnosis) => ({
                ...diagnosis,
                isPrimary: diagnosis.localId === localId,
            })),
        }));
    };

    const removeDiagnosisRow = (localId) => {
        setForm((current) => {
            if (current.diagnoses.length === 1) {
                return {
                    ...current,
                    diagnoses: [createDiagnosisRow()],
                };
            }

            const diagnoses = current.diagnoses.filter(
                (diagnosis) => diagnosis.localId !== localId
            );

            if (
                diagnoses.length > 0 &&
                !diagnoses.some((diagnosis) => diagnosis.isPrimary)
            ) {
                diagnoses[0].isPrimary = true;
            }

            return {
                ...current,
                diagnoses,
            };
        });
    };

    const createDiseaseOption = async (payload) => {
        setDiseaseSaving(true);

        try {
            const createdDisease = await createDisease(payload);
            const createdOption = mapDiseaseOption(createdDisease);
            const reloadedOptions =
                await getDiseaseOptions().catch(() => null);
            const selectedOption =
                reloadedOptions?.find(
                    (option) =>
                        Number(option.diseaseId) ===
                        Number(createdOption.diseaseId)
                ) || createdOption;

            setDiseases((current) => {
                const nextOptions = reloadedOptions || current;
                const exists = nextOptions.some(
                    (option) =>
                        Number(option.diseaseId) ===
                        Number(selectedOption.diseaseId)
                );

                return exists
                    ? nextOptions
                    : [
                        ...nextOptions,
                        selectedOption,
                    ];
            });

            setForm((current) => {
                const diagnoses = current.diagnoses.length
                    ? [...current.diagnoses]
                    : [createDiagnosisRow()];
                let targetIndex = diagnoses.findIndex(
                    (diagnosis) => !diagnosis.diseaseId
                );

                if (targetIndex < 0) {
                    diagnoses.push(createDiagnosisRow());
                    targetIndex = diagnoses.length - 1;
                }

                const hasPrimaryDiagnosis = diagnoses.some(
                    (diagnosis, index) =>
                        index !== targetIndex && diagnosis.isPrimary
                );

                diagnoses[targetIndex] = {
                    ...diagnoses[targetIndex],
                    diseaseId: selectedOption.diseaseId,
                    isPrimary:
                        diagnoses[targetIndex].isPrimary ||
                        !hasPrimaryDiagnosis,
                };

                return {
                    ...current,
                    diagnoses,
                };
            });

            return selectedOption;
        } catch (createError) {
            throw new Error(
                getErrorMessage(
                    createError,
                    "Không thể thêm bệnh mới."
                ),
                { cause: createError }
            );
        } finally {
            setDiseaseSaving(false);
        }
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

        return "";
    };

    const submitRecord = async (markCompleted) => {
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
            markCompleted,
            diagnoses: selectedDiagnoses,
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
        diseaseSaving,
        error,
        actionError,
        successMessage,
        selectedDiagnoses,
        completionReady,
        updateField,
        addDiagnosisRow,
        updateDiagnosisRow,
        setPrimaryDiagnosis,
        removeDiagnosisRow,
        createDiseaseOption,
        submitRecord,
        reload: loadData,
        clearActionError: () => setActionError(""),
        clearSuccessMessage: () => setSuccessMessage(""),
    };
}

export default useMedicalRecordForm;
