import { useRef, useState } from "react";
import { createDoctor, updateDoctor, updateDoctorStatus } from "../api/doctorApi";
import { clinicToast } from "../components/common/clinicUi";
import { getApiErrorMessage } from "../utils/errorHandler";
import { validateDoctorForm } from "../utils/doctorManagement";

const emptyForm = () => ({
    fullName: "",
    title: "",
    experienceYears: "",
    biography: "",
    departmentId: "",
    specializationId: "",
    isActive: true,
});

export default function useDoctorActions({ reload }) {
    const [action, setAction] = useState(null);
    const [values, setValues] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const pending = useRef(false);

    const open = (type, doctor = null) => {
        setAction({ type, doctor });
        setValues(
            doctor
                ? {
                      fullName: doctor.fullName,
                      title: doctor.title,
                      experienceYears: String(doctor.experienceYears),
                      biography: doctor.biography || "",
                      departmentId: String(doctor.departmentId),
                      specializationId: String(doctor.specializationId),
                      isActive: doctor.isActive,
                  }
                : emptyForm()
        );
        setErrors({});
        setError("");
    };

    const close = () => {
        if (pending.current) return;
        setAction(null);
        setValues(emptyForm());
        setErrors({});
        setError("");
    };

    const change = (name, value) => {
        setValues(current => ({
            ...current,
            [name]: value,
            ...(name === "departmentId" ? { specializationId: "" } : {}),
        }));
        setErrors(current => ({ ...current, [name]: undefined }));
        setError("");
    };

    const submit = async event => {
        event?.preventDefault();
        if (pending.current || !action) return;
        const validation = action.type === "status" ? {} : validateDoctorForm(values);
        setErrors(validation);
        if (Object.keys(validation).length) return;

        pending.current = true;
        setBusy(true);
        setError("");
        try {
            let successMsg;
            if (action.type === "status") {
                await updateDoctorStatus(action.doctor.doctorId, !action.doctor.isActive);
                successMsg = action.doctor.isActive ? "Đã khóa hồ sơ bác sĩ." : "Đã mở khóa hồ sơ bác sĩ.";
            } else {
                const payload = {
                    fullName: values.fullName.trim(),
                    title: values.title.trim(),
                    experienceYears: Number(values.experienceYears),
                    biography: values.biography.trim() || null,
                    departmentId: Number(values.departmentId),
                    specializationId: Number(values.specializationId),
                };
                if (action.type === "create") {
                    await createDoctor(payload);
                    successMsg = "Đã tạo hồ sơ bác sĩ.";
                } else {
                    await updateDoctor(action.doctor.doctorId, { ...payload, isActive: values.isActive });
                    successMsg = "Đã lưu hồ sơ bác sĩ.";
                }
            }
            clinicToast.success(successMsg);
            setAction(null);
            setValues(emptyForm());
            reload();
        } catch (requestError) {
            const msg = getApiErrorMessage(requestError);
            setError(msg);
            clinicToast.error(msg);
        } finally {
            pending.current = false;
            setBusy(false);
        }
    };

    return { action, values, errors, error, busy, open, close, change, submit };
}
