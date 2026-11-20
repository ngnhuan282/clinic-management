import { useRef, useState } from "react";
import { createStaff, updateStaff, updateStaffStatus } from "../api/staffApi";
import { clinicToast } from "../components/common/clinicUi";
import { getApiErrorMessage } from "../utils/errorHandler";
import { validateStaffForm } from "../utils/staffManagement";

const emptyForm = () => ({ fullName: "", jobPositionId: "", isActive: true });

export default function useStaffActions({ reload }) {
    const [action, setAction] = useState(null);
    const [values, setValues] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const pending = useRef(false);

    const open = (type, staff = null) => {
        setAction({ type, staff });
        setValues(
            staff
                ? { fullName: staff.fullName, jobPositionId: String(staff.jobPositionId), isActive: staff.isActive }
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
        setValues(current => ({ ...current, [name]: value }));
        setErrors(current => ({ ...current, [name]: undefined }));
        setError("");
    };

    const submit = async event => {
        event?.preventDefault();
        if (pending.current || !action) return;
        const validation = action.type === "status" ? {} : validateStaffForm(values);
        setErrors(validation);
        if (Object.keys(validation).length) return;

        pending.current = true;
        setBusy(true);
        setError("");
        try {
            let successMsg;
            if (action.type === "status") {
                await updateStaffStatus(action.staff.staffId, !action.staff.isActive);
                successMsg = action.staff.isActive ? "Đã khóa hồ sơ nhân viên." : "Đã mở khóa hồ sơ nhân viên.";
            } else {
                const payload = { fullName: values.fullName.trim(), jobPositionId: Number(values.jobPositionId) };
                if (action.type === "create") {
                    await createStaff(payload);
                    successMsg = "Đã tạo hồ sơ nhân viên.";
                } else {
                    await updateStaff(action.staff.staffId, { ...payload, isActive: values.isActive });
                    successMsg = "Đã lưu hồ sơ nhân viên.";
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
