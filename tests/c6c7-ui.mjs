import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
await mkdir(".tmp", { recursive: true });
const fixturePassword = "Test-" + randomBytes(12).toString("hex");
const host = spawn("dotnet", [process.env.CLINIC_TEST_ASSEMBLY || "tests/Week2Verification/bin/Debug/net8.0/Week2Verification.dll", "--c6c7-ui"],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
const hostFinished = new Promise(resolve => host.once("exit", resolve));
let vite, browser;
const pages = [];
try {
    const seeded = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("C6/C7 fixture startup timed out")), 120000);
        host.stdout.on("data", chunk => {
            pending += chunk;
            for (const line of pending.split(/\r?\n/).slice(0, -1)) {
                const prefix = ["AUTH_UI_SESSION:", "C6C7_UI_SESSION:"].find(value => line.startsWith(value));
                if (prefix) { clearTimeout(timeout); resolve(JSON.parse(line.slice(prefix.length))); }
                else if (line.startsWith("SUCCESS")) console.log(line);
            }
            pending = pending.slice(pending.lastIndexOf("\n") + 1);
        });
        host.stderr.on("data", () => {});
        host.once("error", reject);
        host.once("exit", code => { clearTimeout(timeout); reject(new Error(`C6/C7 fixture exited: ${code}`)); });
        host.stdin.write(fixturePassword + "\n");
    });
    assert(!Object.hasOwn(seeded, "password"), "C6/C7 fixture metadata must not contain a password");
    const fixture = { ...seeded, password: fixturePassword, date: seeded.today, noBookAppointmentId: seeded.newAppointmentId,
        noBookPatientId: seeded.newPatientId, noBookPatientName: seeded.newPatientName,
        pendingBookAppointmentId: seeded.paidAppointmentId, pendingBookPatientId: seeded.paidPatientId,
        pendingBookPatientName: seeded.paidPatientName, pendingBookInvoiceId: seeded.paidInvoiceId };
    const api = fixture.baseUrl.replace(/\/$/, "") + "/api";
    async function send(method, path, token, body) {
        const response = await fetch(api + path, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: body === undefined ? undefined : JSON.stringify(body) });
        const data = await response.json();
        assert.equal(response.status, 200, `${method} ${path}: ${JSON.stringify(data)}`);
        return data.result || data;
    }
    const patientSession = await send("POST", "/auth/login", "", { username: "c6patient", password: fixture.password });
    const otherPatientSession = await send("POST", "/auth/login", "", { username: "c6otherpatient", password: fixture.password });
    const receptionSession = await send("POST", "/auth/login", "", { username: "testreceptionist", password: fixture.password });
    const externalReception = await send("POST", "/auth/login", "", { username: "testreceptionist", password: fixture.password });
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5190", "--strictPort"], {
        cwd: "frontend/clinic-management-client", windowsHide: true, stdio: "ignore",
        env: { ...process.env, VITE_API_BASE_URL: api,
            VITE_SIGNALR_HUB_URL: fixture.baseUrl.replace(/\/$/, "") + "/hubs/notification" },
    });
    let frontendReady = false;
    for (let i = 0; i < 100; i++) {
        try { if ((await fetch("http://127.0.0.1:5190")).ok) { frontendReady = true; break; } } catch {}
        if (vite.exitCode !== null) throw new Error(`Vite exited: ${vite.exitCode}`);
        await delay(200);
    }
    assert.equal(frontendReady, true, "Vite frontend should start");
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const errors = [];
    async function open(session, path) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
        await context.addInitScript(session => {
            const user = { userId: session.userId, username: session.username, fullName: session.fullName, role: session.role, permissions: session.permissions };
            sessionStorage.setItem("accessToken", session.accessToken);
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
    const patient = await open(patientSession, "/my-appointments");
    const otherPatient = await open(otherPatientSession, "/my-appointments");
    const reception = await open(receptionSession, "/internal/appointments");
    const mobileRow = reception.getByRole("row").filter({ hasText: fixture.noBookPatientName });
    await mobileRow.waitFor();
    for (const width of [1280, 360]) {
        await reception.setViewportSize({ width, height: 1050 });
        const filters = reception.locator("form").filter({ has: reception.getByLabel("Tìm lịch hẹn", { exact: true }) });
        await filters.scrollIntoViewIfNeeded();
        const bounds = await filters.boundingBox();
        assert.ok(bounds, "Reception filters should be visible");
        const controls = [reception.getByLabel("Tìm lịch hẹn", { exact: true }),
            reception.getByRole("button", { name: "Tìm kiếm", exact: true }),
            reception.getByRole("combobox", { name: "Trạng thái", exact: true }),
            reception.getByRole("combobox", { name: "Bác sĩ", exact: true }),
            reception.getByLabel("Từ ngày", { exact: true }), reception.getByLabel("Đến ngày", { exact: true }),
            reception.getByRole("button", { name: "Xóa bộ lọc", exact: true })];
        for (const control of controls) {
            const box = await control.boundingBox();
            assert.ok(box && box.x >= bounds.x - 1 && box.x + box.width <= bounds.x + bounds.width + 1,
                `Filter control should stay inside its container at ${width}px`);
        }
        const overflow = await reception.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: window.innerWidth }));
        assert.ok(overflow.page <= overflow.viewport + 1, `Reception page should avoid horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`);
        if (width < 600) {
            await mobileRow.getByText("Đã xác nhận", { exact: true }).waitFor();
            const rowBox = await mobileRow.boundingBox();
            for (const cell of await mobileRow.getByRole("cell").all()) {
                const box = await cell.boundingBox();
                assert(box && box.y >= rowBox.y - 1 && box.y + box.height <= rowBox.y + rowBox.height + 1,
                    "Mobile row height must contain its cells instead of overlapping the next patient");
            }
            for (const name of ["Đổi lịch", "Hủy", "Check-in"]) {
                const button = mobileRow.getByRole("button", { name, exact: true });
                const box = await button.boundingBox();
                assert(box && box.x >= 0 && box.x + box.width <= width, `Mobile ${name} must be accessible without horizontal scrolling`);
            }
            await mobileRow.getByRole("button", { name: "Check-in", exact: true }).click({ trial: true });
        }
    }
    await reception.setViewportSize({ width: 1440, height: 1050 });
    console.log("PASS C7 UI keeps reception filters inside the page and exposes mobile status/actions without horizontal scrolling");
    const ownRow = patient.getByRole("article").filter({ has: patient.getByRole("heading", { name: `Lịch hẹn #${fixture.ownAppointmentId}`, exact: true }) });
    async function showOwnAppointment() {
        await patient.getByLabel("Từ ngày", { exact: true }).fill(fixture.futureDate);
        await patient.getByLabel("Đến ngày", { exact: true }).fill(fixture.futureDate);
    }
    await showOwnAppointment();
    await ownRow.getByText("Chờ xác nhận", { exact: true }).waitFor();
    await otherPatient.getByRole("heading", { name: `Lịch hẹn #${fixture.otherAppointmentId}`, exact: true }).waitFor();
    assert.equal(await patient.getByText(fixture.otherPatientName, { exact: true }).count(), 0);
    assert.equal(await otherPatient.getByText(fixture.ownPatientName, { exact: true }).count(), 0);
    await patient.reload({ waitUntil: "domcontentloaded" });
    await showOwnAppointment();
    await ownRow.getByText("Chờ xác nhận", { exact: true }).waitFor();
    await send("PATCH", `/appointments/${fixture.ownAppointmentId}/confirm`, externalReception.accessToken);
    await ownRow.getByText("Đã xác nhận", { exact: true }).waitFor();
    await patient.reload({ waitUntil: "domcontentloaded" });
    await showOwnAppointment();
    await ownRow.getByText("Đã xác nhận", { exact: true }).waitFor();
    assert.equal(await patient.getByText(fixture.otherPatientName, { exact: true }).count(), 0);
    assert.equal(await patient.getByRole("button", { name: "Thông báo", exact: true }).count(), 0);
    console.log("PASS C6 UI lists only the patient's own appointments after reload and receives external status updates");

    await patient.goto("http://127.0.0.1:5190/booking", { waitUntil: "domcontentloaded" });
    await patient.getByText(/đặt lịch trên web khi chưa có sổ khám/i).first().waitFor();
    console.log("PASS C6 UI explains that booking online does not require a book in advance");

    async function appointmentQuery(action, predicate) {
        const response = reception.waitForResponse(response => response.request().method() === "GET"
            && new URL(response.url()).pathname === "/api/appointments" && predicate(new URL(response.url()).searchParams));
        await action();
        const data = await (await response).json();
        return data.result;
    }
    const yesterday = new Date(fixture.date + "T12:00:00");
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayText = yesterday.toISOString().slice(0, 10);
    await appointmentQuery(() => reception.getByLabel("Từ ngày", { exact: true }).fill(yesterdayText), params => params.get("dateFrom") === yesterdayText);
    await appointmentQuery(() => reception.getByLabel("Từ ngày", { exact: true }).fill(fixture.date), params => params.get("dateFrom") === fixture.date);
    await appointmentQuery(() => reception.getByLabel("Đến ngày", { exact: true }).fill(fixture.date), params => params.get("dateTo") === fixture.date);
    await reception.getByRole("combobox", { name: "Trạng thái", exact: true }).click();
    await appointmentQuery(() => reception.getByRole("option", { name: "Đã xác nhận", exact: true }).click(), params => params.get("status") === "Confirmed");
    await reception.getByRole("combobox", { name: "Bác sĩ", exact: true }).click();
    await appointmentQuery(() => reception.getByRole("option", { name: new RegExp(fixture.doctorName) }).click(), params => params.get("doctorId") === String(fixture.doctorId));
    await reception.getByLabel("Tìm lịch hẹn", { exact: true }).fill(fixture.existingPatientName);
    const filtered = await appointmentQuery(() => reception.getByRole("button", { name: "Tìm kiếm", exact: true }).click(), params =>
        params.get("search") === fixture.existingPatientName && params.get("status") === "Confirmed"
        && params.get("doctorId") === String(fixture.doctorId) && params.get("dateFrom") === fixture.date && params.get("dateTo") === fixture.date);
    assert.equal(filtered.totalItems, 1);
    assert.equal(filtered.items[0].appointmentId, fixture.existingAppointmentId);
    await reception.getByRole("row").filter({ hasText: fixture.existingPatientName }).waitFor();
    assert.equal(await reception.getByRole("row").filter({ hasText: fixture.noBookPatientName }).count(), 0);
    console.log("PASS C7 UI combines date, status, doctor and search filters against the appointment API");

    async function openCheckIn(name) {
        await reception.getByLabel("Tìm lịch hẹn", { exact: true }).fill(name);
        await appointmentQuery(() => reception.getByRole("button", { name: "Tìm kiếm", exact: true }).click(), params => params.get("search") === name);
        const row = reception.getByRole("row").filter({ hasText: name });
        await row.getByRole("button", { name: "Check-in", exact: true }).click();
        const dialog = reception.getByRole("dialog");
        await dialog.getByText(/Hồ sơ bệnh nhân #/).waitFor();
        return { dialog, row };
    }
    const existing = await openCheckIn(fixture.existingPatientName);
    await existing.dialog.getByRole("radio", { name: "Có sổ mang theo", exact: true }).check();
    await existing.dialog.getByRole("combobox", { name: "Sổ khám còn hiệu lực", exact: true }).click();
    await reception.getByRole("option", { name: new RegExp(fixture.existingBookNumber) }).click();
    await existing.dialog.getByRole("checkbox", { name: "Đã kiểm tra sổ bệnh nhân mang theo", exact: true }).check();
    assert.equal(await existing.dialog.getByRole("button", { name: "Check-in", exact: true }).isEnabled(), true);
    for (const branch of ["Mất sổ", "Quên sổ"]) {
        await existing.dialog.getByRole("radio", { name: branch, exact: true }).check();
        assert.equal(await existing.dialog.getByRole("button", { name: "Check-in", exact: true }).isDisabled(), true);
    }
    await existing.dialog.getByRole("radio", { name: "Có sổ mang theo", exact: true }).check();
    await existing.dialog.getByRole("combobox", { name: "Sổ khám còn hiệu lực", exact: true }).click();
    await reception.getByRole("option", { name: new RegExp(fixture.existingBookNumber) }).click();
    assert.equal(await existing.dialog.getByRole("button", { name: "Check-in", exact: true }).isDisabled(), true);
    await existing.dialog.getByRole("checkbox", { name: "Đã kiểm tra sổ bệnh nhân mang theo", exact: true }).check();
    await existing.dialog.getByRole("button", { name: "Check-in", exact: true }).click();
    await existing.dialog.waitFor({ state: "hidden" });
    await existing.row.getByText("Đã check-in", { exact: true }).waitFor();
    console.log("PASS C7 UI blocks lost or forgotten books and checks in an existing book only after physical verification");

    const booksUrl = `**/api/patients/${fixture.noBookPatientId}/books`;
    await reception.route(booksUrl, route => route.fulfill({ status: 500, contentType: "application/json",
        body: JSON.stringify({ code: 9999, message: "Uncategorized error", result: null }) }));
    const withoutBook = await openCheckIn(fixture.noBookPatientName);
    const loadError = withoutBook.dialog.getByRole("alert").filter({ has: reception.getByRole("button", { name: "Tải lại", exact: true }) });
    await loadError.waitFor();
    assert.equal(await withoutBook.dialog.getByRole("status").count(), 0, "A failed book request must stop showing loading");
    assert(await withoutBook.dialog.getByRole("button", { name: "Check-in", exact: true }).isDisabled());
    await reception.unroute(booksUrl);
    await loadError.getByRole("button", { name: "Tải lại", exact: true }).click();
    await loadError.waitFor({ state: "hidden" });
    console.log("PASS C7 UI distinguishes failed book loading from loading and safely retries before check-in");
    await withoutBook.dialog.getByRole("radio", { name: "Chưa có sổ", exact: true }).check();
    await withoutBook.dialog.getByLabel("Phí sổ khám (VNĐ)", { exact: true }).fill("20000");
    const invoiceResponse = reception.waitForResponse(response => response.request().method() === "POST"
        && new URL(response.url()).pathname === `/api/patients/${fixture.noBookPatientId}/book-invoices`);
    await withoutBook.dialog.getByRole("button", { name: "Lập hóa đơn sổ", exact: true }).click();
    const invoice = (await (await invoiceResponse).json()).result;
    assert.equal(invoice.status, "Unpaid");
    await withoutBook.dialog.getByRole("group", { name: `Hóa đơn sổ #${invoice.bookInvoiceId}`, exact: true })
        .getByText("Chưa thanh toán", { exact: true }).waitFor();
    assert.equal(await withoutBook.dialog.getByRole("button", { name: "Check-in", exact: true }).isDisabled(), true);
    assert.equal(await withoutBook.dialog.getByRole("button", { name: "Phát / cấp lại sổ", exact: true }).count(), 0);
    await patient.goto("http://127.0.0.1:5190/my-appointments", { waitUntil: "domcontentloaded" });
    await patient.getByLabel("Từ ngày", { exact: true }).fill(fixture.date);
    await patient.getByLabel("Đến ngày", { exact: true }).fill(fixture.date);
    const newBookPatientCard = patient.getByRole("article").filter({ has: patient.getByRole("heading", { name: `Lịch hẹn #${fixture.noBookAppointmentId}`, exact: true }) });
    await newBookPatientCard.getByText("Chưa check-in", { exact: true }).waitFor();
    await send("PATCH", `/book-invoices/${invoice.bookInvoiceId}/pay`, externalReception.accessToken);
    await withoutBook.dialog.getByText(new RegExp(`Hóa đơn #${invoice.bookInvoiceId} đã thanh toán`)).waitFor();
    await withoutBook.dialog.getByLabel("Số sổ mới", { exact: true }).fill("C6-UI-NEW");
    await withoutBook.dialog.getByRole("button", { name: "Phát / cấp lại sổ", exact: true }).click();
    assert.equal(await withoutBook.dialog.getByRole("button", { name: "Check-in", exact: true }).isDisabled(), true);
    await withoutBook.dialog.getByRole("checkbox", { name: "Đã kiểm tra sổ bệnh nhân mang theo", exact: true }).check();
    await withoutBook.dialog.getByRole("button", { name: "Check-in", exact: true }).click();
    await withoutBook.dialog.waitFor({ state: "hidden" });
    await withoutBook.row.getByText("Đã check-in", { exact: true }).waitFor();
    await newBookPatientCard.getByText("Đã check-in", { exact: true }).waitFor();
    await newBookPatientCard.getByText("Đã xác minh sổ tại quầy", { exact: true }).waitFor();
    console.log("PASS C6/C7 UI blocks Book Unpaid, receives external Paid, issues the book and checks in after verification");

    const pendingBook = await openCheckIn(fixture.pendingBookPatientName);
    await pendingBook.dialog.getByRole("radio", { name: "Mất sổ", exact: true }).check();
    await pendingBook.dialog.getByText(new RegExp(`Hóa đơn #${fixture.pendingBookInvoiceId} đã thanh toán`)).waitFor();
    await pendingBook.dialog.getByLabel("Số sổ mới", { exact: true }).fill("C6-UI-REPLACEMENT");
    const issuedResponse = reception.waitForResponse(response => response.request().method() === "POST"
        && new URL(response.url()).pathname === `/api/book-invoices/${fixture.pendingBookInvoiceId}/issue-book`);
    await pendingBook.dialog.getByRole("button", { name: "Phát / cấp lại sổ", exact: true }).click();
    assert.equal((await issuedResponse).ok(), true);
    const replacementBooks = await send("GET", `/patients/${fixture.pendingBookPatientId}/books`, externalReception.accessToken);
    const replacement = replacementBooks.find(book => book.bookNumber === "C6-UI-REPLACEMENT");
    assert.equal(replacement.status, "Issued");
    assert.equal(replacement.bookInvoiceId, fixture.pendingBookInvoiceId);
    assert.equal(replacementBooks.filter(book => book.status === "Issued").length, 1);
    assert.equal(replacementBooks.find(book => book.bookNumber === fixture.pendingPreviousBookNumber).status, "Replaced");
    await pendingBook.dialog.getByRole("checkbox", { name: "Đã kiểm tra sổ bệnh nhân mang theo", exact: true }).check();
    assert.equal(await pendingBook.dialog.getByRole("button", { name: "Check-in", exact: true }).isEnabled(), true);
    await send("PATCH", `/appointments/${fixture.pendingBookAppointmentId}/cancel`, externalReception.accessToken);
    await pendingBook.dialog.getByText("Trạng thái lịch hẹn hiện tại không cho phép check-in.", { exact: true }).waitFor();
    assert.equal(await pendingBook.dialog.getByRole("button", { name: "Check-in", exact: true }).isDisabled(), true);
    await pendingBook.dialog.getByRole("button", { name: "Đóng", exact: true }).click();
    await pendingBook.dialog.waitFor({ state: "hidden" });
    console.log("PASS C6 UI issues a Paid invoice's Pending book as a replacement and retires the old book");
    console.log("PASS C7 UI disables an open check-in dialog after another session cancels its appointment");
    assert.deepEqual(errors, []);
    await reception.screenshot({ path: ".tmp/c6c7-reception.png", fullPage: true });
    console.log("SUCCESS: 9 focused C6/C7 browser checks passed.");
} catch (error) {
    for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: `.tmp/c6c7-ui-failure-${i}.png`, fullPage: true }).catch(() => {});
    console.error(String(error?.stack || error).replaceAll(fixturePassword, "[redacted]"));
    process.exitCode = 1;
} finally {
    await browser?.close();
    vite?.kill();
    if (host.exitCode === null) host.stdin.end("done\n");
    await hostFinished;
}
