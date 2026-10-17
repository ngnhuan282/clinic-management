import useAuth from "../hooks/useAuth";
import PatientProfilePage from "./patient/PatientProfilePage";
import AccountProfilePage from "./internal/AccountProfilePage";

export default function ProfilePage() {
    const { role } = useAuth();
    return role === "Patient" ? <PatientProfilePage /> : <AccountProfilePage />;
}
