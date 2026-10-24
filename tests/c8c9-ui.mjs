import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
await mkdir(".tmp/c8c9", { recursive: true });
const fixturePassword = "Test-" + randomBytes(12).toString("hex");
const host = spawn("dotnet", [process.env.CLINIC_TEST_ASSEMBLY || ".tmp/c8c9-build/Week2Verification.dll", "--c8c9-ui"],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
const hostFinished = new Promise(resolve => host.once("exit", resolve));
let fixture, vite, browser;
let fixtureOutput = "";
const pages = [], runtimeErrors = [];
const signalRSockets = new WeakMap();
let passed = 0;
const pass = label => { passed++; console.log("PASS C8/C9 UI " + label); };
try {
    fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const sessionPrefix = "C8C9_UI_SESSION:";
        const timeout = setTimeout(() => reject(new Error("C8/C9 fixture startup timed out")), 180000);
        host.stdout.on("data", chunk => {
            fixtureOutput += chunk;
            pending += chunk;
            const lines = pending.split(/\r?\n/);
            pending = lines.pop();
            for (const line of lines) {
                if (line.startsWith(sessionPrefix)) { clearTimeout(timeout); resolve(JSON.parse(line.slice(sessionPrefix.length))); }
                else if (line.startsWith("SUCCESS:")) console.log(line);
            }
        });
        host.once("error", error => { clearTimeout(timeout); reject(error); });
        host.once("exit", code => { clearTimeout(timeout); reject(new Error(`C8/C9 fixture exited before readiness (${code}); run --c8c9 for the API failure.`)); });
        // Fixture metadata and server diagnostics stay out of browser-test output.
        host.stderr.on("data", chunk => { fixtureOutput += chunk; });
        host.stdin.write(fixturePassword + "\n");
    });
    assert(!Object.hasOwn(fixture, "password"), "C8/C9 fixture metadata must not contain a password");
    assert(!fixtureOutput.includes(fixturePassword), "C8/C9 fixture must not print its password to stdout or stderr");
    pass("the generated fixture password stays in the private stdin pipe and out of fixture output");
    const api = fixture.baseUrl.replace(/\/$/, "") + "/api";
    async function send(method, path, token = "", body, expected = 200) {
        const response = await fetch(api + path, { method,
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: body === undefined ? undefined : JSON.stringify(body) });
        assert.equal(response.status, expected, `${method} ${path} expected ${expected}, got ${response.status}`);
        const data = await response.json();
        return data.result ?? data;
    }
    const login = username => send("POST", "/auth/login", "", { username, password: fixturePassword });
    const patientSession = await login(fixture.patientUsername);
    const receptionSession = await login(fixture.receptionUsername);
    const doctorSession = await login(fixture.doctorUsername);
    const cashierSession = await login(fixture.cashierUsername);
    const otherPatient = await login("c8other");
    let portBusy = false;
    try {
        await fetch("http://127.0.0.1:5190", { signal: AbortSignal.timeout(1000) });
        portBusy = true;
    } catch { /* No server is listening on the test port. */ }
    assert(!portBusy, "C8/C9 port 5190 is already used; the test will not use or stop that server");
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5190", "--strictPort"],
        { cwd: "frontend/clinic-management-client", windowsHide: true, stdio: "ignore",
            env: { ...process.env, VITE_API_BASE_URL: api, VITE_SIGNALR_HUB_URL: fixture.baseUrl.replace(/\/$/, "") + "/hubs/notification" } });
    let listening = false;
    for (let attempt = 0; attempt < 150; attempt++) {
        if (vite.exitCode !== null) throw new Error("C8/C9 Vite could not start; port 5190 must be unused");
        try { listening = (await fetch("http://127.0.0.1:5190")).ok; } catch { /* Wait for this test's Vite. */ }
        if (listening) break;
        await delay(200);
    }
    assert(listening, "C8/C9 Vite startup timed out");
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    async function open(session, path) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, timezoneId: "Asia/Bangkok" });
        await context.addInitScript(session => {
            sessionStorage.setItem("accessToken", session.accessToken);
            sessionStorage.setItem("user", JSON.stringify({ userId: session.userId, username: session.username,
                fullName: session.fullName, role: session.role, permissions: session.permissions }));
            // Test-only handles let the outage test explicitly close the real transport.
            const NativeWebSocket = window.WebSocket;
            window.__c8c9SignalRSockets = [];
            window.WebSocket = class extends NativeWebSocket {
                constructor(...args) {
                    super(...args);
                    if (new URL(args[0]).pathname === "/hubs/notification")
                        window.__c8c9SignalRSockets.push(this);
                }
            };
        }, session);
        const page = await context.newPage();
        pages.push(page);
        const sockets = [];
        signalRSockets.set(page, sockets);
        page.on("websocket", socket => {
            if (new URL(socket.url()).pathname !== "/hubs/notification") return;
            const state = { socket, closed: false, handshaken: false };
            sockets.push(state);
            socket.on("close", () => { state.closed = true; });
            socket.on("framereceived", frame => {
                if (frame.payload.toString().split("\u001e").includes("{}")) state.handshaken = true;
            });
        });
        page.setDefaultTimeout(25000);
        page.setDefaultNavigationTimeout(60000);
        page.on("pageerror", error => runtimeErrors.push(error.message));
        await page.route("https://fonts.googleapis.com/**", route => route.abort());
        await page.route("https://fonts.gstatic.com/**", route => route.abort());
        await page.goto("http://127.0.0.1:5190" + path, { waitUntil: "domcontentloaded" });
        return page;
    }
    async function waitForCondition(predicate, message) {
        const deadline = Date.now() + 45000;
        while (!predicate() && Date.now() < deadline) await delay(50);
        assert(predicate(), message);
    }
    const patient = await open(patientSession, "/my-appointments");
    const reception = await open(receptionSession, "/internal/appointments");
    const doctor = await open(doctorSession, "/internal/examinations");
    await doctor.getByPlaceholder(/Tìm theo tên bệnh nhân/).fill(fixture.UiPatientName);
    await patient.getByLabel("Từ ngày", { exact: true }).fill(fixture.Today);
    await patient.getByLabel("Đến ngày", { exact: true }).fill(fixture.Today);
    const article = patient.getByRole("article", { name: `Lịch hẹn #${fixture.UiAppointmentId}`, exact: true });
    await article.getByText("Chưa check-in", { exact: true }).waitFor();
    await reception.getByRole("textbox", { name: "Tìm lịch hẹn", exact: true }).fill(fixture.UiPatientName);
    await reception.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
    const row = reception.getByRole("row").filter({ hasText: fixture.UiPatientName });
    await row.getByRole("button", { name: "Check-in", exact: true }).click();
    const dialog = reception.getByRole("dialog");
    const checkIn = dialog.getByRole("button", { name: "Check-in", exact: true });
    await dialog.getByRole("radio", { name: "Chưa có sổ", exact: true }).waitFor();
    assert(await checkIn.isDisabled());
    pass("new web arrival is blocked until a real paid and verified book exists");

    await dialog.getByLabel("Phí sổ khám (VNĐ)").fill("20000");
    const createdInvoice = reception.waitForResponse(response => response.request().method() === "POST"
        && new URL(response.url()).pathname.endsWith(`/patients/${fixture.UiPatientId}/book-invoices`));
    await dialog.getByRole("button", { name: "Lập hóa đơn sổ", exact: true }).click();
    const invoiceResponse = await createdInvoice;
    assert.equal(invoiceResponse.status(), 200);
    const invoice = (await invoiceResponse.json()).result;
    await dialog.getByText(new RegExp(`#${invoice.bookInvoiceId}.*Unpaid`)).waitFor();
    assert.equal(await dialog.getByRole("button", { name: "Phát / cấp lại sổ", exact: true }).count(), 0);
    assert(await checkIn.isDisabled());
    pass("Unpaid invoice exposes no issue-book action and cannot check in");

    await send("POST", "/invoices", cashierSession.accessToken, { patientId: fixture.UiPatientId,
        appointmentId: fixture.UiAppointmentId, billingStage: "Book", paymentMethod: "Cash",
        items: [{ sourceType: "Book", sourceId: invoice.bookInvoiceId, itemName: "C9 UI book fee", unitPrice: 20000, quantity: 1 }] });
    await dialog.getByRole("alert").filter({ hasText: "Nhập số sổ để phát" }).waitFor();
    await dialog.getByLabel("Số sổ mới").fill("C9-UI-BOOK");
    const issuedResponse = reception.waitForResponse(response => response.request().method() === "POST"
        && new URL(response.url()).pathname.endsWith(`/book-invoices/${invoice.bookInvoiceId}/issue-book`));
    await dialog.getByRole("button", { name: "Phát / cấp lại sổ", exact: true }).click();
    assert.equal((await issuedResponse).status(), 200);
    const issuedBook = (await (await issuedResponse).json()).result;
    await dialog.getByRole("combobox", { name: "Sổ khám còn hiệu lực", exact: true }).waitFor();
    assert(await checkIn.isDisabled());
    pass("Cashier Paid reaches the open reception dialog through SignalR; issue still requires physical verification");

    for (const label of ["Mất sổ", "Quên sổ"]) {
        await dialog.getByRole("radio", { name: label, exact: true }).check();
        assert(await checkIn.isDisabled());
    }
    await dialog.getByRole("radio", { name: "Có sổ mang theo", exact: true }).check();
    await dialog.getByRole("combobox", { name: "Sổ khám còn hiệu lực", exact: true }).click();
    await reception.getByRole("option", { name: /C9-UI-BOOK/ }).click();
    await dialog.getByRole("checkbox", { name: "Đã kiểm tra sổ bệnh nhân mang theo", exact: true }).check();
    assert(await checkIn.isEnabled());
    await reception.setViewportSize({ width: 390, height: 844 });
    assert(await reception.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await reception.screenshot({ path: ".tmp/c8c9/reception-mobile.png", fullPage: true });
    await reception.setViewportSize({ width: 1440, height: 1050 });
    pass("lost/forgotten branches block check-in and the arrival dialog fits mobile");

    const checked = reception.waitForResponse(response => response.request().method() === "PATCH"
        && new URL(response.url()).pathname.endsWith(`/appointments/${fixture.UiAppointmentId}/check-in`));
    await checkIn.click();
    assert.equal((await checked).status(), 200);
    await dialog.waitFor({ state: "hidden" });
    await article.getByText("Đã check-in", { exact: true }).waitFor();
    await article.getByText("Đã xác minh sổ tại quầy", { exact: true }).waitFor();
    const doctorRow = doctor.getByRole("row").filter({ hasText: fixture.UiPatientName });
    const start = doctorRow.getByRole("button", { name: "Bắt đầu khám", exact: true });
    await start.waitFor();
    await start.click();
    await doctor.getByLabel("Triệu chứng ghi nhận *", { exact: true }).fill("C9 browser verification symptoms");
    const recordResponse = doctor.waitForResponse(response => response.request().method() === "POST"
        && new URL(response.url()).pathname.endsWith("/medical-records"));
    await doctor.getByRole("button", { name: "Lưu tạm", exact: true }).click();
    const createdRecord = await recordResponse;
    assert.equal(createdRecord.status(), 201);
    const record = (await createdRecord.json()).result;
    assert.equal(record.appointmentId, fixture.UiAppointmentId);
    assert.equal(record.patientBookId, issuedBook.patientBookId);
    assert.equal(record.patientProfileId, fixture.UiPatientId);
    await article.getByText("Đang khám", { exact: true }).waitFor();
    pass("reception check-in updates patient and doctor in real time; the doctor saves the correctly linked MedicalRecord");

    const booking = await open(patientSession, "/booking");
    await booking.getByRole("combobox", { name: "Chuyên khoa", exact: true }).click();
    await booking.getByRole("option", { name: fixture.DepartmentName, exact: true }).click();
    await booking.getByRole("button", { name: new RegExp(fixture.DoctorName) }).click();
    const [, month, day] = fixture.FutureDate.split("-");
    await booking.getByRole("button", { name: new RegExp(`${day}/${month}`) }).click();
    await booking.getByRole("button", { name: "11:00 Còn chỗ", exact: true }).click();
    await send("POST", "/appointments", otherPatient.accessToken, { doctorId: fixture.DoctorId,
        appointmentDate: fixture.FutureDate, startTime: "11:00:00", patientName: "C9 UI concurrent patient",
        patientPhone: "0909000988", reason: "C9 UI slot race" });
    await booking.getByRole("button", { name: "11:00 Đã kín chỗ", exact: true }).waitFor();
    assert(await booking.getByRole("button", { name: "11:00 Đã kín chỗ", exact: true }).isDisabled());
    pass("a competing booking invalidates the patient's selected slot through SignalR");

    await booking.getByRole("button", { name: "11:30 Còn chỗ", exact: true }).click();
    const sockets = signalRSockets.get(booking);
    await waitForCondition(() => sockets.some(socket => socket.handshaken && !socket.closed),
        "Booking must have a real SignalR WebSocket handshake before testing the outage");
    const originalSocket = sockets.findLast(socket => socket.handshaken && !socket.closed);
    await booking.context().setOffline(true);
    await booking.evaluate(() => {
        const active = window.__c8c9SignalRSockets.filter(socket => socket.readyState === WebSocket.OPEN);
        for (const socket of active) socket.close(1000, "C8/C9 simulated outage");
    });
    await waitForCondition(() => originalSocket.closed, "The original SignalR WebSocket must actually close");
    await send("POST", "/appointments", otherPatient.accessToken, { doctorId: fixture.DoctorId,
        appointmentDate: fixture.FutureDate, startTime: "11:30:00", patientName: "C9 UI missed event",
        patientPhone: "0909000987", reason: "C9 UI reconnect" });
    assert(await booking.getByRole("button", { name: "11:30 Đang chọn", exact: true }).isEnabled(),
        "The disconnected booking page must miss the competing slot event");
    const slotReload = booking.waitForResponse(response => {
        const url = new URL(response.url());
        return url.pathname.endsWith("/appointments/available-slots") && url.searchParams.get("date") === fixture.FutureDate
            && url.searchParams.get("doctorId") === String(fixture.DoctorId) && response.status() === 200;
    }, { timeout: 45000 });
    await booking.context().setOffline(false);
    await waitForCondition(() => sockets.some(socket => socket !== originalSocket && socket.handshaken && !socket.closed),
        "SignalR must establish and handshake a new WebSocket after the outage");
    await slotReload;
    await booking.getByRole("button", { name: "11:30 Đã kín chỗ", exact: true }).waitFor();
    assert(await booking.getByRole("button", { name: "11:30 Đã kín chỗ", exact: true }).isDisabled());
    assert.deepEqual(runtimeErrors, []);
    assert(!fixtureOutput.includes(fixturePassword), "C8/C9 fixture must keep its password out of all test output");
    pass("a closed SignalR WebSocket reconnects, completes a new handshake and reloads the missed slot through the API");
    console.log(`SUCCESS: ${passed} C8/C9 browser checks passed.`);
} catch (error) {
    for (let index = 0; index < pages.length; index++)
        await pages[index].screenshot({ path: `.tmp/c8c9/failure-${index}.png`, fullPage: true }).catch(() => {});
    const message = String(error?.stack || error).replaceAll(fixturePassword, "[redacted]");
    console.error(message);
    process.exitCode = 1;
} finally {
    await browser?.close();
    if (vite && vite.exitCode === null) { vite.kill(); await new Promise(resolve => vite.once("exit", resolve)); }
    if (host.exitCode === null) host.stdin.end("\n");
    await hostFinished;
}
