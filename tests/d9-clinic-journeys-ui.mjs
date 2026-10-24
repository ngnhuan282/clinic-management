import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

let playwright;
try { playwright = await import(process.env.PLAYWRIGHT_MODULE || "playwright"); }
catch (error) {
    if (process.env.PLAYWRIGHT_MODULE) throw error;
    playwright = await import(new URL("../tmp/medical-history-browser/node_modules/playwright/index.mjs", import.meta.url));
}

const output = "tmp/d9-clinic-journeys";
const clinicalOnly = process.argv.includes("--clinical-only");
const host = spawn("dotnet", [process.env.CLINIC_TEST_ASSEMBLY || "tmp/d9-verification/Week2Verification.dll", clinicalOnly ? "--d9-clinical-ui" : "--d9-ui"], {
    windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
});
const finished = new Promise(resolve => host.once("exit", resolve));
let browser, vite, diagnosticPage;
try {
    await mkdir(output, { recursive: true });
    const fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("D9 temporary API journeys timed out")), 300000);
        host.stdout.on("data", chunk => {
            pending += chunk;
            const lines = pending.split(/\r?\n/);
            pending = lines.pop();
            for (const line of lines) {
                if (line.startsWith("AUTH_UI_SESSION:")) {
                    clearTimeout(timeout);
                    resolve(JSON.parse(line.slice(16)));
                } else if (line.startsWith("SUCCESS") || line.startsWith("BLOCKED")) console.log(line);
            }
        });
        host.stderr.on("data", chunk => process.stderr.write(chunk));
        host.once("error", reject);
        host.once("exit", code => { clearTimeout(timeout); reject(new Error(`D9 verification host exited: ${code}`)); });
    });
    const api = fixture.baseUrl.replace(/\/$/, "") + "/api";
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5190", "--strictPort"], {
        cwd: "frontend/clinic-management-client", windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, VITE_API_BASE_URL: api, VITE_SIGNALR_HUB_URL: fixture.baseUrl + "hubs/notification" },
    });
    vite.stdout.on("data", chunk => process.stdout.write(chunk));
    vite.stderr.on("data", chunk => process.stderr.write(chunk));
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
        try { if ((await fetch("http://127.0.0.1:5190")).ok) { ready = true; break; } } catch { /* Wait for Vite. */ }
        if (vite.exitCode != null) throw new Error("D9 Vite exited before startup");
        await delay(200);
    }
    assert.ok(ready, "D9 Vite must be ready");
    browser = await playwright.chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const errors = [];
    async function login(username, timezoneId = "Asia/Ho_Chi_Minh") {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId });
        const response = await context.request.post(api + "/auth/login", { data: { username, password: fixture.password } });
        assert.equal(response.status(), 200);
        const session = (await response.json()).result;
        await context.addInitScript(auth => {
            sessionStorage.setItem("accessToken", auth.accessToken);
            sessionStorage.setItem("user", JSON.stringify({ userId: auth.userId, username: auth.username,
                fullName: auth.fullName, role: auth.role, permissions: auth.permissions }));
        }, session);
        const page = await context.newPage();
        page.setDefaultTimeout(30000);
        page.setDefaultNavigationTimeout(180000);
        page.on("pageerror", error => errors.push(error.message));
        await page.route("https://fonts.googleapis.com/**", route => route.abort());
        await page.route("https://fonts.gstatic.com/**", route => route.abort());
        return page;
    }
    async function visit(page, path) {
        diagnosticPage = page;
        await page.goto("http://127.0.0.1:5190" + path);
    }
    async function capture(page, label) {
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 1000 });
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2),
                `${label} must fit the ${width}px viewport`);
            await page.screenshot({ path: `${output}/${label}-${width}.png`, fullPage: true });
        }
        await page.setViewportSize({ width: 1440, height: 1000 });
    }

    const pharmacy = await login("d9pharmacist");
    if (!clinicalOnly) {
        const doctor = await login("testdoctor");
        for (const journey of fixture.journeys) {
            await visit(doctor, `/internal/examinations/${journey.appointmentId}/record`);
            await doctor.getByText(journey.bookNumber, { exact: true }).first().waitFor();
            await doctor.getByText(`D9 ${journey.branch} symptoms`, { exact: true }).waitFor();
            await doctor.getByText(`D9 ${journey.branch} conclusion`, { exact: true }).waitFor();
            await doctor.getByText(`RX-${String(journey.prescriptionId).padStart(5, "0")}`, { exact: true }).waitFor();
            await capture(doctor, `${journey.branch}-doctor-record`);

            await visit(pharmacy, `/internal/pharmacy/dispensing/${journey.prescriptionId}`);
            await pharmacy.getByText("Đơn thuốc đã được giao và trừ kho.", { exact: false }).waitFor();
            await pharmacy.getByText(`HD-${String(journey.invoiceId).padStart(5, "0")}`, { exact: true }).waitFor();
            assert.equal(await pharmacy.getByRole("button", { name: "Xác nhận giao thuốc", exact: true }).count(), 0);
            await pharmacy.getByText("Lô đã xuất", { exact: true }).waitFor();
            await capture(pharmacy, `${journey.branch}-pharmacy-trace`);
        }
        const patient = await login("d9patient");
        const web = fixture.journeys.find(journey => journey.branch === "web");
        await visit(patient, `/medical-records/${web.medicalRecordId}`);
        await patient.getByText(web.bookNumber, { exact: true }).first().waitFor();
        await patient.getByText("D9 web symptoms", { exact: true }).waitFor();
        await patient.getByText("D9 journey medicine", { exact: false }).first().waitFor();
        await capture(patient, "web-patient-history");
        await visit(patient, "/lab-results");
        await patient.getByRole("button", { name: `Xem chi tiết xét nghiệm #${web.labTestId}`, exact: true }).click();
        await patient.getByRole("dialog").getByText("D9 verified lab result", { exact: true }).waitFor();
        await capture(patient, "web-patient-lab-result");

        const cashier = await login("d9cashier");
        await visit(cashier, "/internal/cashier/billing");
        await cashier.getByRole("combobox").first().waitFor();
    }

    async function until(predicate, message) {
        const deadline = Date.now() + 30000;
        while (!await predicate()) {
            if (Date.now() > deadline) throw new Error(message);
            await delay(100);
        }
    }
    async function responseBody(response) {
        const value = await response.json();
        return value && Object.hasOwn(value, "code") && Object.hasOwn(value, "result") ? value.result : value;
    }
    async function read(page, path) {
        const access = await page.evaluate(() => sessionStorage.getItem("accessToken"));
        const response = await page.request.get(api + path, { headers: { Authorization: "Bearer " + access } });
        assert.equal(response.status(), 200, `Authorized read ${path}`);
        return responseBody(response);
    }
    async function writeUsingUi(page, method, path, action) {
        const [response] = await Promise.all([
            page.waitForResponse(response => response.request().method() === method && response.url() === api + path),
            action(),
        ]);
        assert.ok([200, 201].includes(response.status()), `${method} ${path}: ${await response.text()}`);
        return responseBody(response);
    }
    async function addMedicine(page, name, quantity) {
        await page.getByRole("combobox", { name: "Chọn thuốc", exact: true }).fill(name);
        await page.getByRole("option").filter({ hasText: name }).click();
        await page.getByRole("button", { name: "Thêm thuốc", exact: true }).click();
        const row = page.getByRole("row").filter({ has: page.getByText(name, { exact: true }) });
        await row.getByRole("spinbutton", { name: "Số lượng kê đơn", exact: true }).fill(String(quantity));
        await row.getByRole("textbox", { name: `Liều dùng ${name}`, exact: true }).fill("D9 UI twice daily");
        await row.getByRole("textbox", { name: `Hướng dẫn ${name}`, exact: true }).fill("D9 UI after meals");
    }
    const clinicalUiResults = [];
    assert.equal(fixture.clinicalUiCases.length, 2, "Both web and walk-in need fresh clinical UI cases");
    for (const item of fixture.clinicalUiCases) {
        const width = item.branch === "web" ? 1440 : 390;
        const timezoneId = item.branch === "web" ? "UTC" : "America/New_York";
        const editor = await login("testdoctor", timezoneId);
        await editor.setViewportSize({ width, height: 1000 });
        await visit(editor, `/internal/examinations/${item.appointmentId}`);
        const complete = () => editor.getByRole("button", { name: "Hoàn tất khám", exact: true }).first();
        const bookSection = () => editor.getByRole("region", { name: "5. Sổ khám giấy", exact: true });
        const saveDraft = () => editor.getByRole("button", { name: "Lưu tạm", exact: true });
        const symptoms = `D9 UI ${item.branch} symptoms`;
        const conclusion = `D9 UI ${item.branch} conclusion`;
        const notes = `D9 UI ${item.branch} initial advice`;
        let currentSymptoms = symptoms;
        let currentNotes = notes;

        const unconfirmed = bookSection().getByRole("alert").filter({ hasText: "Chưa xác nhận cập nhật sổ giấy." });
        await unconfirmed.waitFor();
        assert.ok((await unconfirmed.getAttribute("class")).includes("MuiAlert-colorInfo"));
        assert.equal(await unconfirmed.locator(".MuiAlert-icon svg").isVisible(), true);
        await bookSection().screenshot({ path: `${output}/${item.branch}-clinical-paper-unconfirmed-${width}.png` });
        await editor.getByRole("textbox", { name: "Triệu chứng ghi nhận *", exact: true }).fill(symptoms);
        await editor.getByRole("combobox", { name: "Chẩn đoán 1", exact: true }).fill(item.diseaseLabel);
        await editor.getByRole("option", { name: item.diseaseLabel, exact: true }).click();
        await editor.getByRole("radio", { name: "Chính", exact: true }).check();
        await editor.getByRole("textbox", { name: "Ghi chú", exact: true }).fill("D9 UI primary diagnosis");
        await editor.getByRole("textbox", { name: "Kết luận", exact: true }).fill(conclusion);
        assert.equal(await complete().isDisabled(), true, "Clinical content alone cannot bypass paper reconciliation");
        let record = await writeUsingUi(editor, "POST", "/medical-records", () => saveDraft().click());
        assert.equal(record.paperBookUpdatedAt, null);
        assert.equal(record.patientBookId, item.patientBookId);
        const recordId = record.medicalRecordId;
        await until(() => editor.getByRole("button", { name: "Kê đơn thuốc", exact: true }).first().isEnabled(), "Saved record must enable prescribing");
        await editor.getByRole("button", { name: "Kê đơn thuốc", exact: true }).first().click();
        await editor.waitForURL(`**/examinations/${item.appointmentId}/prescription`);
        await addMedicine(editor, item.medicineName, 6);
        await editor.getByRole("textbox", { name: "Lời dặn bác sĩ", exact: true }).fill(notes);
        let rx = await writeUsingUi(editor, "POST", "/prescriptions", () => editor.getByRole("button", { name: "Lưu đơn thuốc", exact: true }).click());
        const prescriptionId = rx.prescriptionId;
        assert.equal(rx.details[0].quantity, 6);
        await editor.getByRole("button", { name: "Quay lại hồ sơ", exact: true }).click();
        await editor.waitForURL(`**/examinations/${item.appointmentId}`);

        async function confirmPaper(editedPrescription = false, phase = editedPrescription ? "prescription-revised" : "initial") {
            await bookSection().getByRole("button", { name: "Xác nhận cập nhật sổ giấy", exact: true }).click();
            const dialog = editor.getByRole("dialog", { name: "Xác nhận cập nhật sổ khám giấy", exact: true });
            await dialog.getByText(item.bookNumber, { exact: true }).first().waitFor();
            await dialog.getByText(item.patientName, { exact: true }).waitFor();
            await dialog.getByText(currentSymptoms, { exact: true }).waitFor();
            await dialog.getByText(conclusion, { exact: true }).waitFor();
            await dialog.getByText(item.diseaseLabel, { exact: true }).waitFor();
            await dialog.getByText(currentNotes, { exact: true }).waitFor();
            await dialog.getByText(editedPrescription ? "5 viên" : "6 viên", { exact: true }).waitFor();
            if (editedPrescription) {
                await dialog.getByText(item.secondaryMedicineName, { exact: false }).waitFor();
                await dialog.getByText("2 viên", { exact: true }).waitFor();
            }
            await dialog.getByText("Liều dùng: D9 UI twice daily", { exact: true }).first().waitFor();
            await dialog.getByText("Cách dùng: D9 UI after meals", { exact: true }).first().waitFor();
            const confirm = dialog.getByRole("button", { name: "Xác nhận", exact: true });
            assert.equal(await confirm.isDisabled(), true, "Paper declaration requires an explicit checkbox");
            await dialog.getByRole("checkbox").check();
            await dialog.screenshot({ path: `${output}/${item.branch}-clinical-paper-${phase}-${width}.png` });
            await confirm.click();
            await until(() => complete().isEnabled(), "Paper confirmation must enable completion");
        }

        await confirmPaper();
        record = await writeUsingUi(editor, "PUT", `/medical-records/${recordId}`, () => saveDraft().click());
        assert.ok(record.paperBookUpdatedAt, "The first paper declaration is persisted by UI save");
        currentSymptoms = symptoms + " revised";
        await editor.getByRole("textbox", { name: "Triệu chứng ghi nhận *", exact: true }).fill(currentSymptoms);
        assert.equal(await complete().isDisabled(), true, "Editing clinical content invalidates the local declaration immediately");
        const changed = bookSection().getByRole("alert").filter({ hasText: "Nội dung khám đã thay đổi. Vui lòng cập nhật sổ giấy và xác nhận lại." });
        await changed.waitFor();
        assert.ok((await changed.getAttribute("class")).includes("MuiAlert-colorWarning"));
        assert.equal(await changed.locator(".MuiAlert-icon svg").isVisible(), true);
        await bookSection().screenshot({ path: `${output}/${item.branch}-clinical-paper-changed-${width}.png` });
        record = await writeUsingUi(editor, "PUT", `/medical-records/${recordId}`, () => saveDraft().click());
        assert.equal(record.paperBookUpdatedAt, null, "Saving changed clinical content clears the stored declaration");
        await confirmPaper(false, "clinical-revised");
        record = await writeUsingUi(editor, "PUT", `/medical-records/${recordId}`, () => saveDraft().click());
        assert.ok(record.paperBookUpdatedAt);

        await editor.getByRole("button", { name: "Kê đơn thuốc", exact: true }).first().click();
        await editor.waitForURL(`**/examinations/${item.appointmentId}/prescription`);
        const primaryRow = editor.getByRole("row").filter({ has: editor.getByText(item.medicineName, { exact: true }) });
        await primaryRow.getByRole("spinbutton", { name: "Số lượng kê đơn", exact: true }).fill("5");
        await addMedicine(editor, item.secondaryMedicineName, 2);
        currentNotes = `D9 UI ${item.branch} revised advice`;
        await editor.getByRole("textbox", { name: "Lời dặn bác sĩ", exact: true }).fill(currentNotes);
        assert.ok(await editor.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2),
            "The prescription editor must not overflow the page; the medicine table may scroll internally");
        await editor.screenshot({ path: `${output}/${item.branch}-clinical-prescription-${width}.png`, fullPage: true });
        rx = await writeUsingUi(editor, "PUT", `/prescriptions/${prescriptionId}`, () => editor.getByRole("button", { name: "Lưu đơn thuốc", exact: true }).click());
        assert.equal(rx.details.length, 2);
        assert.equal(rx.details.find(medicine => medicine.medicineId === item.medicineId).quantity, 5);
        record = await read(editor, `/medical-records/${recordId}`);
        assert.equal(record.paperBookUpdatedAt, null, "Prescription edits invalidate stored paper confirmation");
        await editor.getByRole("button", { name: "Quay lại hồ sơ", exact: true }).click();
        await editor.waitForURL(`**/examinations/${item.appointmentId}`);
        await bookSection().getByRole("button", { name: "Xác nhận cập nhật sổ giấy", exact: true }).waitFor();
        assert.equal(await complete().isDisabled(), true, "Returning from prescription editing must not restore the old declaration");
        assert.equal(await editor.getByRole("textbox", { name: "Triệu chứng ghi nhận *", exact: true }).inputValue(), currentSymptoms);
        await confirmPaper(true);
        record = await writeUsingUi(editor, "PUT", `/medical-records/${recordId}`, () => complete().click());
        assert.equal(record.status, "Completed");
        assert.ok(record.paperBookUpdatedAt);
        await editor.waitForURL(`**/examinations/${item.appointmentId}/record`);

        const expectedTime = (value, fallback) => new Intl.DateTimeFormat("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        }).format(new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : value + fallback));
        for (const [label, value, fallback] of [["Tạo hồ sơ", record.createdAt, "Z"],
            ["Cập nhật gần nhất", record.updatedAt, "Z"], ["Ghi sổ giấy", record.paperBookUpdatedAt, "+07:00"]])
            await editor.getByText(label, { exact: true }).locator("..").getByText(expectedTime(value, fallback), { exact: true }).waitFor();
        await capture(editor, `${item.branch}-clinical-final-record`);
        await editor.reload();
        await editor.getByText(item.bookNumber, { exact: true }).first().waitFor();
        const persisted = await read(editor, `/medical-records/${recordId}`);
        assert.equal(persisted.paperBookUpdatedAt, record.paperBookUpdatedAt);
        assert.equal(persisted.status, "Completed");

        await visit(pharmacy, `/internal/pharmacy/dispensing/${prescriptionId}`);
        const waiting = pharmacy.getByRole("button", { name: "Chờ thanh toán", exact: true });
        await waiting.waitFor();
        assert.equal(await waiting.isDisabled(), true);
        const detail = await read(pharmacy, `/dispensing/${prescriptionId}`);
        assert.equal(detail.canDispense, false);
        assert.equal(detail.prescriptionStatus, "Issued");
        assert.equal(detail.invoiceId, null);
        for (const [id, quantity] of [[item.medicineId, item.availableQuantity], [item.secondaryMedicineId, item.secondaryAvailableQuantity]])
            assert.equal(detail.medicines.find(medicine => medicine.medicineId === id).quantityAvailable, quantity,
                "Clinical UI saves, prescription edits, paper confirmation and completion must not deduct inventory");
        await capture(pharmacy, `${item.branch}-clinical-unpaid`);
        clinicalUiResults.push({ branch: item.branch, appointmentId: item.appointmentId, medicalRecordId: recordId,
            prescriptionId, width, timezoneId, clinicalEditsInvalidatePaper: true, prescriptionEditsInvalidatePaper: true,
            finalDeclarationPersisted: true, unpaidHandoverBlocked: true });
        console.log(`PASS D9 ${item.branch} clinical UI: real form writes, revised paper confirmation, clinic audit time and unpaid pharmacy guard (${width}px, ${timezoneId})`);
    }
    assert.deepEqual(errors, [], "D9 available-path screens must not have uncaught JavaScript errors");
    // Never persist passwords/tokens with evidence. These are API journeys plus browser read-back, not all-UI E2E.
    await writeFile(`${output}/report.json`, JSON.stringify({
        generatedAt: new Date().toISOString(), mode: clinicalOnly ? "owned-clinical-ui-only" : "real-api-journeys-and-clinical-ui",
        fullD9Accepted: false, journeys: fixture.journeys, gaps: fixture.gaps, clinicalUiResults,
        dependencyAuditPerformed: !clinicalOnly,
        clinicalReceptionSetup: "prechecked-in appointments in temporary DB; not receptionist UI acceptance",
        manualPaperBookComparison: "required; software cannot verify a physical paper book",
    }, null, 2) + "\n");
    console.log(`SUCCESS: D9 owned clinical form journeys passed. ${clinicalOnly ? "Lab/Billing dependencies were not re-audited." : `${fixture.gaps.length} integration dependencies remain.`} Not full cashier/Lab UI E2E acceptance.`);
} catch (error) {
    if (diagnosticPage) {
        await diagnosticPage.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {});
        console.error((await diagnosticPage.locator("body").innerText().catch(() => "")).slice(0, 4000));
    }
    throw error;
} finally {
    await browser?.close();
    if (vite && vite.exitCode == null) {
        const stopped = new Promise(resolve => vite.once("exit", resolve));
        vite.kill();
        await stopped;
    }
    if (host.exitCode == null && !host.stdin.destroyed) host.stdin.end("\n");
    await finished;
}
