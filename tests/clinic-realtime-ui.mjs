import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
await mkdir(".tmp", { recursive: true });
const host = spawn("dotnet", [process.env.CLINIC_TEST_ASSEMBLY || "tests/Week2Verification/bin/Debug/net8.0/Week2Verification.dll", "--clinic-realtime-ui"],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
const hostFinished = new Promise(resolve => host.once("exit", resolve));
let vite, browser;
const pages = [];
try {
    const fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("Realtime fixture startup timed out")), 120000);
        host.stdout.on("data", chunk => {
            pending += chunk;
            for (const line of pending.split(/\r?\n/).slice(0, -1)) {
                if (line.startsWith("AUTH_UI_SESSION:")) { clearTimeout(timeout); resolve(JSON.parse(line.slice(16))); }
                else if (line.startsWith("SUCCESS")) console.log(line);
            }
            pending = pending.slice(pending.lastIndexOf("\n") + 1);
        });
        host.stderr.on("data", chunk => process.stderr.write(chunk));
        host.once("error", reject);
        host.once("exit", code => { clearTimeout(timeout); reject(new Error(`Realtime fixture exited: ${code}`)); });
    });
    const api = fixture.baseUrl.replace(/\/$/, "") + "/api";
    async function send(method, path, token, body) {
        const response = await fetch(api + path, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: body === undefined ? undefined : JSON.stringify(body) });
        const data = await response.json();
        assert.equal(response.status, 200, JSON.stringify(data));
        return data.result || data;
    }
    const patientSession = await send("POST", "/auth/login", "", { username: "livepatient", password: fixture.password });
    const receptionSession = await send("POST", "/auth/login", "", { username: "testreceptionist", password: fixture.password });
    const doctorSession = await send("POST", "/auth/login", "", { username: "testdoctor", password: fixture.password });
    const otherPatient = await send("POST", "/auth/login", "", { username: "otherpatient", password: fixture.password });
    const otherReception = await send("POST", "/auth/login", "", { username: "otherreception", password: fixture.password });
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5190", "--strictPort"], {
        cwd: "frontend/clinic-management-client", windowsHide: true, stdio: "ignore",
        env: { ...process.env, VITE_API_BASE_URL: api,
            VITE_SIGNALR_HUB_URL: fixture.baseUrl.replace(/\/$/, "") + "/hubs/notification" },
    });
    for (let i = 0; i < 100; i++) { try { if ((await fetch("http://127.0.0.1:5190")).ok) break; } catch {} await delay(200); }
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const errors = [];
    async function open(session, path) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
        await context.addInitScript(session => {
            const user = { userId: session.userId, username: session.username, fullName: session.fullName, role: session.role, permissions: session.permissions };
            sessionStorage.setItem("accessToken", session.accessToken);
            sessionStorage.setItem("refreshToken", session.refreshToken);
            sessionStorage.setItem("user", JSON.stringify(user));
        }, session);
        const page = await context.newPage();
        pages.push(page);
        page.setDefaultTimeout(20000);
        page.setDefaultNavigationTimeout(60000);
        page.on("pageerror", error => errors.push(error.message));
        await page.route("https://fonts.googleapis.com/**", route => route.abort());
        await page.route("https://fonts.gstatic.com/**", route => route.abort());
        await page.goto("http://127.0.0.1:5190" + path, { waitUntil: "domcontentloaded" });
        return page;
    }
    const patient = await open(patientSession, "/booking");
    assert.equal(await patient.getByRole("button", { name: "Thông báo", exact: true }).count(), 0);
    const reception = await open(receptionSession, "/internal/appointments");
    const doctor = await open(doctorSession, "/internal/examinations");
    await patient.getByRole("combobox", { name: "Chuyên khoa" }).click();
    await patient.getByRole("option", { name: fixture.departmentName, exact: true }).click();
    await patient.getByRole("button", { name: new RegExp(fixture.doctorName) }).click();
    const [, month, day] = fixture.date.split("-");
    await patient.getByRole("button", { name: new RegExp(`${day}/${month}`) }).click();
    await patient.getByRole("button", { name: "11:00 Còn chỗ", exact: true }).click();
    await send("POST", "/appointments", otherPatient.accessToken, { doctorId: 2, appointmentDate: fixture.otherDate,
        startTime: "11:00:00", patientName: "Unrelated slot", patientPhone: "0900999999", reason: "UI verification" });
    await delay(300);
    assert.equal(await patient.getByRole("button", { name: "11:00 Đang chọn", exact: true }).count(), 1);
    const occupied = await send("POST", "/appointments", otherPatient.accessToken, { doctorId: 1, appointmentDate: fixture.date,
        startTime: "11:00:00", patientName: "Concurrent slot", patientPhone: "0900999999", reason: "UI verification" });
    await patient.getByRole("button", { name: "11:00 Đã kín chỗ", exact: true }).waitFor();
    assert.equal(await patient.getByRole("button", { name: "11:00 Đã kín chỗ", exact: true }).isDisabled(), true);
    console.log("PASS UI preserves a valid selection for unrelated slot events and clears a newly occupied slot");

    await patient.getByRole("button", { name: "11:30 Còn chỗ", exact: true }).click();
    await patient.context().setOffline(true);
    await send("POST", "/appointments", otherPatient.accessToken, { doctorId: 1, appointmentDate: fixture.date,
        startTime: "11:30:00", patientName: "Offline slot", patientPhone: "0900999999", reason: "UI verification" });
    await patient.context().setOffline(false);
    await patient.getByRole("button", { name: "11:30 Đã kín chỗ", exact: true }).waitFor();
    console.log("PASS UI reloads availability after reconnect and removes a stale selected slot");

    await send("PATCH", `/appointments/${occupied.appointmentId}/cancel`, otherReception.accessToken);
    await patient.getByRole("button", { name: "11:00 Còn chỗ", exact: true }).click();
    await patient.getByLabel("Họ và tên bệnh nhân").fill("UI booking patient");
    await patient.getByLabel("Số điện thoại liên hệ").fill("0900123999");
    await patient.getByLabel(/Mô tả lý do khám/).fill("UI realtime status verification");
    const bookedResponse = patient.waitForResponse(response => response.request().method() === "POST"
        && new URL(response.url()).pathname === "/api/appointments");
    await patient.getByRole("button", { name: "Xác Nhận Đặt Lịch Khám", exact: true }).click();
    const booked = (await (await bookedResponse).json()).result;
    const patientDialog = patient.getByRole("dialog");
    await patientDialog.getByText("Pending", { exact: true }).waitFor();
    await send("PATCH", `/appointments/${booked.appointmentId}/confirm`, otherReception.accessToken);
    await patientDialog.getByText("Confirmed", { exact: true }).waitFor();
    await patientDialog.getByRole("button", { name: "Đã hiểu", exact: true }).click();
    console.log("PASS UI updates the patient's existing booking status through SignalR without a notification bell or history");

    const receptionRow = reception.getByRole("row").filter({ hasText: fixture.patientName });
    await receptionRow.waitFor();
    assert.equal(await receptionRow.getByRole("button", { name: "Check-in", exact: true }).isDisabled(), true);
    await send("PATCH", `/appointments/${fixture.appointmentId}/confirm`, otherReception.accessToken);
    await receptionRow.getByRole("button", { name: "Check-in", exact: true }).waitFor({ state: "visible" });
    await reception.waitForFunction(name => [...document.querySelectorAll("tr")].some(row => row.textContent.includes(name)
        && [...row.querySelectorAll("button")].some(button => button.textContent === "Check-in" && !button.disabled)), fixture.patientName);
    await receptionRow.getByRole("button", { name: "Check-in", exact: true }).click();
    const dialog = reception.getByRole("dialog");
    const invoice = await send("POST", `/patients/${fixture.patientId}/book-invoices`, otherReception.accessToken, { amount: 20000 });
    await dialog.getByText(new RegExp(`#${invoice.bookInvoiceId} .*Unpaid`)).waitFor();
    await send("PATCH", `/book-invoices/${invoice.bookInvoiceId}/pay`, otherReception.accessToken);
    await dialog.getByText(new RegExp(`Hóa đơn #${invoice.bookInvoiceId} đã thanh toán`)).waitFor();
    await dialog.getByLabel("Số sổ mới").fill("UI-BOOK");
    await dialog.getByRole("button", { name: "Phát / cấp lại sổ", exact: true }).click();
    await dialog.getByRole("button", { name: "Check-in", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    console.log("PASS UI receives external confirmation and Paid, enables book issuing and completes check-in");

    const doctorRow = doctor.getByRole("row").filter({ hasText: fixture.patientName });
    await doctorRow.waitFor();
    await doctorRow.getByRole("button", { name: "Bắt đầu khám", exact: true }).click();
    await doctor.waitForURL(new RegExp(`/internal/examinations/${fixture.appointmentId}$`));
    await receptionRow.getByText("Đang khám", { exact: true }).waitFor();
    assert.equal(await patient.getByRole("button", { name: "Thông báo", exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    await reception.screenshot({ path: ".tmp/clinic-realtime-reception.png", fullPage: true });
    console.log("PASS UI doctor queue updates after check-in and reception sees InProgress");
} catch (error) {
    for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: `.tmp/clinic-realtime-ui-failure-${i}.png`, fullPage: true }).catch(() => {});
    throw error;
} finally {
    await browser?.close();
    vite?.kill();
    if (host.exitCode === null) host.stdin.end("done\n");
    await hostFinished;
}
