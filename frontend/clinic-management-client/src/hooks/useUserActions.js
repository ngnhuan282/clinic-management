import { useRef, useState } from "react";
import { useDispatch, useStore } from "react-redux";
import { createStaffUser, updateUserProfile, updateUserRole, updateUserStatus } from "../api/userApi";
import { sessionVerified } from "../store/authSlice";
import { getApiErrorMessage } from "../utils/errorHandler";
import { validateStaffUser, validateUserProfile } from "../utils/userManagement";

const emptyForm = () => ({ username: "", password: "", fullName: "", email: "", phone: "", roleId: "", doctorId: "" });

export default function useUserActions({ roles, reload }) {
    const [action, setAction] = useState(null);
    const [values, setValues] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [busy, setBusy] = useState(false);
    const pending = useRef(false);
    const dispatch = useDispatch();
    const store = useStore();

    const open = (type, user = null) => {
        setAction({ type, user });
        setValues(user ? { ...emptyForm(), fullName: user.fullName, email: user.email || "", phone: user.phone || "", roleId: String(user.roleId) } : emptyForm());
        setErrors({}); setError(""); setSuccess("");
    };
    const close = () => {
        if (pending.current) return;
        setAction(null); setValues(emptyForm()); setErrors({}); setError("");
    };
    const change = (name, value) => {
        setValues(current => ({ ...current, [name]: value, ...(name === "roleId" ? { doctorId: "" } : {}) }));
        setErrors(current => ({ ...current, [name]: undefined })); setError("");
    };
    const submit = async event => {
        event?.preventDefault();
        if (pending.current || !action) return;
        const role = roles.find(item => item.roleId === Number(values.roleId));
        const validation = action.type === "create" ? validateStaffUser(values, role?.roleName)
            : action.type === "edit" ? validateUserProfile(values) : {};
        if (action.type === "role" && !role) validation.roleId = "Vui lòng chọn vai trò.";
        setErrors(validation);
        if (Object.keys(validation).length) return;
        pending.current = true; setBusy(true); setError("");
        try {
            const profile = { fullName: values.fullName.trim(), email: values.email.trim() || null, phone: values.phone.trim() || null };
            let result;
            if (action.type === "create") {
                result = await createStaffUser({ ...profile, username: values.username.trim(), password: values.password,
                    roleId: Number(values.roleId), doctorId: values.doctorId ? Number(values.doctorId) : null });
                setSuccess(`Đã tạo tài khoản nhân viên ${result.username}.`);
            } else if (action.type === "edit") {
                result = await updateUserProfile(action.user.userId, profile);
                const currentUser = store.getState().auth.user;
                if (currentUser?.userId === result.userId) dispatch(sessionVerified({ ...currentUser,
                    fullName: result.fullName, email: result.email, phone: result.phone }));
                setSuccess("Đã lưu thông tin tài khoản.");
            } else if (action.type === "role") {
                await updateUserRole(action.user.userId, Number(values.roleId));
                setSuccess("Đã cập nhật vai trò tài khoản.");
            } else {
                await updateUserStatus(action.user.userId, !action.user.status);
                setSuccess(action.user.status ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.");
            }
            setAction(null); setValues(emptyForm()); reload();
        } catch (requestError) { setError(getApiErrorMessage(requestError)); }
        finally { pending.current = false; setBusy(false); }
    };
    return { action, values, errors, error, success, busy, open, close, change, submit, clearSuccess: () => setSuccess("") };
}
