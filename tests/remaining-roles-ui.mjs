import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const host = spawn("dotnet", ["run", "--no-build", "--no-restore", "-c", "Release", "--project", "tests/UiRefreshVerification", "--", "--remaining-roles", "--admin-completion"], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
const finished = new Promise(resolve => host.once("exit", resolve));
let fixture, vite, browser;
let fixtureError = "";
host.stderr.on("data", chunk => { fixtureError = (fixtureError + chunk).slice(-6000); });
const pages = [];
const errors = [];
let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; console.log("PASS " + label); };
try {
    fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("Remaining-role fixture startup timed out")), 240000);
        host.stdout.on("data", chunk => {
            pending += chunk;
            const lines = pending.split(/\r?\n/); pending = lines.pop();
            for (const line of lines) {
                if (line.startsWith("UI_FIXTURE:")) { clearTimeout(timeout); resolve(JSON.parse(line.slice(11))); }
                else if (line.startsWith("PASS ") || line.startsWith("UI_FIXTURE_CLEANUP:")) console.log(line);
            }
        });
        host.once("error", error => { clearTimeout(timeout); reject(error); });
        host.once("exit", code => { clearTimeout(timeout); reject(new Error("Fixture exited: " + code + "\n" + fixtureError)); });
    });
    const apiBase = fixture.baseUrl.replace(/\/$/, "") + "/api";
    const api = async (path, { method = "GET", payload, access, expected = 200 } = {}) => {
        const response = await fetch(apiBase + path, { method, headers: { "Content-Type": "application/json", ...(access ? { Authorization: "Bearer " + access } : {}) }, body: payload ? JSON.stringify(payload) : undefined });
        assert.equal(response.status, expected, method + " " + path);
        const body = await response.json();
        return body && Object.hasOwn(body, "result") && Object.hasOwn(body, "code") ? body.result : body;
    };
    const loginApi = username => api("/auth/login", { method: "POST", payload: { username, password: fixture.password } });
    const admin = await loginApi(fixture.usernames.admin);
    const lab = await loginApi(fixture.usernames.lab);
    const doctorApi = await loginApi(fixture.usernames.doctor);
    const patientApi = await loginApi(fixture.usernames.patient);
    const meta = fixture.remainingRoles;
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5190", "--strictPort"], { cwd: "frontend/clinic-management-client", windowsHide: true, stdio: "ignore", env: { ...process.env, VITE_API_BASE_URL: apiBase, VITE_SIGNALR_HUB_URL: fixture.baseUrl.replace(/\/$/, "") + "/hubs/notification" } });
    const site = "http://127.0.0.1:5190";
    let ready = false;
    for (let i = 0; i < 150; i++) { try { ready = (await fetch(site)).ok; } catch {} if (ready) break; await delay(200); }
    assert.ok(ready, "Vite starts");
    browser = await chromium.launch({ channel: "msedge", headless: true });
    await mkdir(".tmp/remaining-roles", { recursive: true });
    const loginPage = async (username, patient = false) => {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        await context.route("https://fonts.googleapis.com/**", route => route.abort());
        await context.route("https://fonts.gstatic.com/**", route => route.abort());
        const page = await context.newPage(); pages.push(page);
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(site + (patient ? "/login" : "/internal/login"), { waitUntil: "domcontentloaded" });
        await page.getByLabel("Tên đăng nhập", { exact: true }).fill(username);
        await page.getByLabel("Mật khẩu", { exact: true }).fill(fixture.password);
        await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
        await page.waitForURL(url => !["/login", "/internal/login"].includes(url.pathname));
        return page;
    };
    let patientPage = await loginPage(fixture.usernames.patient, true);
    const doctorPage = await loginPage(fixture.usernames.doctor);
    const otherPage = await loginPage(fixture.usernames.other, true);
    const headPage = await loginPage(fixture.usernames.head);
    await patientPage.goto(site + "/lab-results?labTestId=" + meta.PendingLabId);
    await doctorPage.goto(site + "/internal/doctor/lab-orders?labTestId=" + meta.PendingLabId);
    for (const page of [patientPage, doctorPage]) await page.getByRole("dialog", { name: "Chi tiết xét nghiệm" }).getByText("Chưa có kết quả.", { exact: true }).waitFor();
    const resultText = "Kết quả nhận thời gian thực qua giao diện";
    await api("/LabTests/results", { method: "POST", payload: { labTestId: meta.PendingLabId, resultSummary: resultText }, access: lab.accessToken });
    for (const page of [patientPage, doctorPage]) await page.getByRole("dialog").getByText(resultText, { exact: true }).waitFor();
    check(true, "Patient and Doctor open dialogs update from the real lab-result event without reloading");
    await patientPage.getByRole("dialog").getByRole("button", { name: "Đóng", exact: true }).click();
    await patientPage.getByRole("button", { name: "Thông báo", exact: true }).click();
    await patientPage.getByRole("button").filter({ hasText: `Chỉ định xét nghiệm #${meta.PendingLabId} đã có kết quả.` }).click();
    await patientPage.getByRole("dialog").getByText(resultText, { exact: true }).waitFor();
    const history = await api("/notifications?pageSize=100", { access: patientApi.accessToken });
    check(history.items.find(item => item.labTestId === meta.PendingLabId)?.isRead === true,
        "Notification click marks the owned item read and opens the correct Patient result");
    await doctorPage.getByRole("dialog").getByRole("button", { name: "Đóng", exact: true }).click();
    await doctorPage.getByRole("button", { name: "Thông báo", exact: true }).click();
    await doctorPage.getByRole("button").filter({ hasText: `Chỉ định xét nghiệm #${meta.PendingLabId} đã có kết quả.` }).click();
    await doctorPage.getByRole("dialog").getByText(resultText, { exact: true }).waitFor();
    check(true, "Doctor notification links to its protected result detail");
    await headPage.goto(site + "/internal/doctor/lab-orders?labTestId=" + meta.HeadPendingLabId);
    await otherPage.goto(site + "/lab-results?labTestId=" + meta.HeadPendingLabId);
    for (const page of [headPage, otherPage]) await page.getByRole("dialog").getByText("Chưa có kết quả.", { exact: true }).waitFor();
    const headText = "Kết quả của Trưởng khoa và bệnh nhân tương ứng";
    await api("/LabTests/results", { method: "POST", payload: { labTestId: meta.HeadPendingLabId, resultSummary: headText }, access: lab.accessToken });
    for (const page of [headPage, otherPage]) await page.getByRole("dialog").getByText(headText, { exact: true }).waitFor();
    check(true, "DepartmentHead and its Patient receive their own result updates");
    await otherPage.goto(site + "/lab-results?labTestId=" + meta.PendingLabId);
    await otherPage.getByRole("dialog").getByRole("alert").waitFor();
    check(!(await otherPage.getByRole("dialog").getByText(resultText, { exact: true }).isVisible()), "Foreign result deep links show an access error without clinical data");
    await otherPage.getByRole("dialog").getByRole("button", { name: "Đóng", exact: true }).click();

    await patientPage.context().close();
    const offlineText = "Kết quả được lưu khi bệnh nhân ngoại tuyến";
    await api("/LabTests/results", { method: "POST", payload: { labTestId: meta.OfflineLabId, resultSummary: offlineText }, access: lab.accessToken });
    patientPage = await loginPage(fixture.usernames.patient, true);
    await patientPage.getByRole("button", { name: "Thông báo", exact: true }).click();
    await patientPage.getByRole("button").filter({ hasText: `Chỉ định xét nghiệm #${meta.OfflineLabId} đã có kết quả.` }).click();
    await patientPage.getByRole("dialog").getByText(offlineText, { exact: true }).waitFor();
    check(true, "Offline Patient recovers persisted notifications and results after a new login");
    await patientPage.screenshot({ path: ".tmp/remaining-roles/patient-result-desktop.png", fullPage: true });
    await patientPage.getByRole("dialog").getByRole("button", { name: "Đóng", exact: true }).click();
    let failDetail = true;
    await patientPage.route("**/labtests/" + meta.OfflineLabId, route => failDetail ? route.abort() : route.continue());
    await patientPage.goto(site + "/lab-results?labTestId=" + meta.OfflineLabId);
    await patientPage.getByRole("dialog").getByRole("button", { name: "Thử lại", exact: true }).waitFor();
    failDetail = false;
    await patientPage.getByRole("dialog").getByRole("button", { name: "Thử lại", exact: true }).click();
    await patientPage.getByRole("dialog").getByText(offlineText, { exact: true }).waitFor();
    check(true, "Result detail recovers from a network failure through the real retry API");
    await patientPage.unroute("**/labtests/" + meta.OfflineLabId);

    const cashierPage = await loginPage("uicashier");
    await cashierPage.waitForURL(url => url.pathname === "/internal/cashier/billing");
    await cashierPage.getByRole("heading", { name: /Thu Ngân/ }).waitFor();
    await cashierPage.getByRole("button", { name: "Chọn thu tiền", exact: true }).first().waitFor();
    check(true, "Seeded Cashier logs in directly to billing and loads the real pending queue");
    await cashierPage.goto(site + "/internal/users");
    await cashierPage.waitForURL(url => url.pathname === "/403");
    check(true, "Cashier is denied direct navigation to Admin account management");
    const setCashierRights = async permissionCodes => {
        const role = await api("/rbac/roles/" + meta.CashierRoleId, { access: admin.accessToken });
        return api("/rbac/roles/" + meta.CashierRoleId + "/permissions", { method: "PUT", payload: { permissionCodes, version: role.version }, access: admin.accessToken });
    };
    await setCashierRights(["billing.view"]);
    const reader = await loginPage("uicashier");
    await reader.getByRole("button", { name: "Chọn thu tiền", exact: true }).first().click();
    check(await reader.getByRole("button", { name: /Xác Nhận Thu Tiền/ }).isDisabled(), "View-only Cashier cannot confirm collection in the UI");
    await setCashierRights([]);
    const denied = await loginPage("uicashier");
    await denied.waitForURL(url => url.pathname === "/internal/profile");
    await denied.goto(site + "/internal/cashier/billing");
    await denied.waitForURL(url => url.pathname === "/403");
    check(true, "Cashier without billing view rights has no route access");
    await setCashierRights(["billing.view", "billing.create", "billing.recordPayment"]);
    for (const width of [768, 390, 320]) {
        await patientPage.setViewportSize({ width, height: 900 });
        check(await patientPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Patient result dialog bounds at " + width);
        await headPage.setViewportSize({ width, height: 900 });
        check(await headPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "DepartmentHead result bounds at " + width);
        if (width === 390) await patientPage.screenshot({ path: ".tmp/remaining-roles/patient-result-mobile.png", fullPage: true });
    }
    check(errors.length === 0, "No browser runtime errors in remaining-role workflows");
    console.log("REMAINING_ROLES_UI_SUCCESS checks=" + checks);
} catch (error) {
    for (let index = 0; index < pages.length; index++) if (!pages[index].isClosed()) await pages[index].screenshot({ path: `.tmp/remaining-roles/failure-${index}.png`, fullPage: true }).catch(() => {});
    let message = error?.stack || String(error);
    if (fixture?.password) message = message.replaceAll(fixture.password, "[redacted]");
    console.error(message.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted token]"));
    process.exitCode = 1;
} finally {
    await browser?.close(); vite?.kill();
    if (host.exitCode === null) host.stdin.end('{"command":"stop"}\n');
    await Promise.race([finished, delay(15000, undefined, { ref: false }).then(() => host.kill())]);
}
