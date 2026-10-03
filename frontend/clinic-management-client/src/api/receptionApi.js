import axiosClient from "./axiosClient";

/** @typedef {{ patientId: number, fullName: string, phone: string, birthDate: string | null, identityNumber: string | null }} PatientMatch */
/** @typedef {{ patientBookId: number, patientId: number, bookInvoiceId: number | null, bookNumber: string, status: string }} PatientBook */
/** @typedef {{ bookInvoiceId: number, patientId: number, amount: number, status: "Unpaid" | "Paid", paidAt: string | null }} BookInvoice */

const result = response => response.data.result;

export async function findPatientMatches(search) {
    return result(await axiosClient.get("/patients/matches", { params: { search } }));
}

export async function matchAppointmentPatient(appointmentId, patientProfileId) {
    return result(await axiosClient.patch(`/appointments/${appointmentId}/patient-profile`, { patientProfileId }));
}

export async function getPatientBooks(patientId) {
    return result(await axiosClient.get(`/patients/${patientId}/books`));
}

export async function registerExistingBook(patientId, bookNumber) {
    return result(await axiosClient.post(`/patients/${patientId}/books/existing`, {
        bookNumber, bookPresented: true,
    }));
}

export async function getBookInvoices(patientId) {
    return result(await axiosClient.get(`/patients/${patientId}/book-invoices`));
}

export async function createBookInvoice(patientId, amount) {
    return result(await axiosClient.post(`/patients/${patientId}/book-invoices`, { amount }));
}

export async function markBookInvoicePaid(invoiceId) {
    return result(await axiosClient.patch(`/book-invoices/${invoiceId}/pay`));
}

export async function issueBook(invoiceId, bookNumber) {
    return result(await axiosClient.post(`/book-invoices/${invoiceId}/issue-book`, { bookNumber }));
}

export async function checkInAppointment(appointmentId, payload) {
    return result(await axiosClient.patch(`/appointments/${appointmentId}/check-in`, payload));
}
