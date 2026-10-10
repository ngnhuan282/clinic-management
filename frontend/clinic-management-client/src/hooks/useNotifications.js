import { useContext } from "react";
import NotificationContext from "../store/NotificationContext";

export default function useNotifications() {
    return useContext(NotificationContext);
}
