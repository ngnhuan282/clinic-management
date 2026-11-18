import { useEffect, useState } from "react";
import axiosClient from "./axiosClient";
import { CLINIC, normalizeClinicInfo } from "../data/publicContent";

let cachedPublicSettings = null;
let pendingPublicSettings = null;
const SETTINGS_EVENT = "clinic-settings-updated";

export async function getPublicServices() {
    const { data } = await axiosClient.get("/public/services");
    return data.result;
}

export async function getPublicSpecializations(departmentId) {
    const { data } = await axiosClient.get(
        "/specializations/public",
        departmentId ? { params: { departmentId } } : undefined
    );
    return data.result;
}

export async function getPublicClinicSettings() {
    if (cachedPublicSettings) return cachedPublicSettings;
    if (!pendingPublicSettings) {
        pendingPublicSettings = axiosClient
            .get("/public/clinic-settings")
            .then(({ data }) => {
                cachedPublicSettings = data.result;
                return cachedPublicSettings;
            })
            .finally(() => {
                pendingPublicSettings = null;
            });
    }
    return pendingPublicSettings;
}

export function invalidatePublicClinicSettingsCache() {
    cachedPublicSettings = null;
    pendingPublicSettings = null;
}

export async function getClinicSettings() {
    const { data } = await axiosClient.get("/clinic-settings");
    return data.result;
}

export async function updateClinicSettings(payload) {
    const { data } = await axiosClient.put("/clinic-settings", payload);
    invalidatePublicClinicSettingsCache();
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: data.result }));
    }
    return data.result;
}

export function useClinicInfo() {
    const [info, setInfo] = useState(() => normalizeClinicInfo(cachedPublicSettings) || CLINIC);

    useEffect(() => {
        let active = true;
        getPublicClinicSettings()
            .then(result => {
                if (active && result) setInfo(normalizeClinicInfo(result));
            })
            .catch(() => {});

        const handleUpdated = event => {
            if (active && event?.detail) {
                setInfo(normalizeClinicInfo(event.detail));
            }
        };
        window.addEventListener(SETTINGS_EVENT, handleUpdated);
        return () => {
            active = false;
            window.removeEventListener(SETTINGS_EVENT, handleUpdated);
        };
    }, []);

    return info;
}

export async function getPublicDoctor(doctorId) {
    const { data } = await axiosClient.get(`/doctors/public/${doctorId}`);
    return data.result;
}

export async function createGuestAppointment(payload) {
    const { data } = await axiosClient.post("/appointments/guest", payload);
    return data.result;
}
