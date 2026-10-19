import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const configuration = process.env.TEST_CONFIGURATION || "Debug";
const host = spawn("dotnet", ["run", "--no-build", "--no-restore", "--configuration", configuration,
    "--project", "tests/Week2Verification", "--", "--week10-ui"], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
const finished = new Promise(resolve => host.once("exit", resolve));
let vite, browser, diagnosticPage;
try {
    const fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("Week10 fixture timed out")), 180000);
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
        host.once("exit", code => { clearTimeout(timeout); reject(new Error(`Week10 fixture exited: ${code}`)); });
    });
    const api = fixture.baseUrl.replace(/\/$/, "") + "/api";
    const run = (command, args, options = {}) => new Promise((resolve, reject) => {
        const child = spawn(command, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"], ...options });
        child.stderr.on("data", chunk => process.stderr.write(chunk));
        child.once("error", reject);
        child.once("exit", code => code === 0 ? resolve() : reject(new Error(`UI build exited: ${code}`)));
    });
    const frontend = resolve("frontend/clinic-management-client");
    const environment = { ...process.env, VITE_API_BASE_URL: "/api", VITE_SIGNALR_HUB_URL: "/hubs/notification" };
    await run(process.execPath, ["node_modules/vite/bin/vite.js", "build"], { cwd: frontend, env: environment });
    const configPath = resolve("tests/Week2Verification/bin/week10-vite.config.mjs");
    await mkdir(resolve("tests/Week2Verification/bin"), { recursive: true });
    await writeFile(configPath, `import base from ${JSON.stringify(pathToFileURL(resolve(frontend, "vite.config.js")).href)};
export default { ...base, preview: { proxy: { "/api": { target: ${JSON.stringify(fixture.baseUrl)} },
"/hubs": { target: ${JSON.stringify(fixture.baseUrl)}, ws: true } } } };\n`);
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--config", configPath,
        "--host", "127.0.0.1", "--port", "5190", "--strictPort"], { cwd: frontend, windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: environment });
    vite.stderr.on("data", chunk => process.stderr.write(chunk));
    for (let i = 0; i < 100; i++) {
        try { if ((await fetch("http://127.0.0.1:5190")).ok) break; } catch { /* Wait for preview. */ }
        if (vite.exitCode != null) throw new Error("Week10 preview exited");
        await delay(200);
    }
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const errors = [];
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    diagnosticPage = page;
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(60000);
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    await page.route("https://fonts.gstatic.com/**", route => route.abort());
    async function login(username) {
        if (!page.url().includes("/internal/login")) await page.goto("http://127.0.0.1:5190/internal/login");
        await page.getByLabel("Tên đăng nhập").fill(username);
        await page.getByLabel("Mật khẩu", { exact: true }).fill(fixture.password);
        await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
        await page.waitForURL(url => !url.pathname.endsWith("/internal/login"));
    }
    async function logout() {
        await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
        await page.waitForURL("**/internal/login");
    }
    async function revokedSession() {
        if (!page.url().includes("/internal/login")) {
            try { await page.getByRole("button", { name: "Làm mới", exact: true }).click({ timeout: 3000 }); }
            catch (error) {
                // The hub/auth interceptor can finish logout before the manual refresh click.
                if (!page.url().includes("/internal/login")) throw error;
            }
        }
        await page.waitForURL("**/internal/login");
        assert.equal(await page.getByTestId("visitCount").count(), 0);
    }
    async function counts(visits, pending, approved) {
        for (const [key, value] of Object.entries({ visitCount: visits, pendingScheduleRequestCount: pending, approvedScheduleRequestCount: approved }))
            await page.waitForFunction(({ key, value }) => document.querySelector(`[data-testid="${key}"]`)?.textContent.trim() === String(value), { key, value });
    }
    async function statistics(visits, pending = visits) {
        await page.getByRole("link", { name: "Thống kê khoa", exact: true }).click();
        await page.getByLabel("Từ ngày", { exact: true }).fill(fixture.date);
        await page.getByLabel("Đến ngày", { exact: true }).fill(fixture.date);
        await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
        await counts(visits, pending, 1);
    }
    async function calendar(count) {
        await page.getByRole("link", { name: "Lịch làm việc của khoa", exact: true }).click();
        await page.getByRole("button", { name: "Xem theo ngày", exact: true }).click();
        await page.getByLabel("Chọn ngày", { exact: true }).fill(fixture.date);
        await page.getByText(new RegExp(`^${count} ca •`)).waitFor();
    }
    await login(fixture.username);
    await page.evaluate(() => { localStorage.setItem("DepartmentId", "2"); sessionStorage.setItem("DepartmentId", "2"); });
    const tamper = async route => {
        const url = new URL(route.request().url()); url.searchParams.set("DepartmentId", "2");
        await route.continue({ url: url.href, headers: { ...route.request().headers(), "X-Department-Id": "2" } });
    };
    await page.route("**/api/department-head/statistics?*", tamper);
    await page.route("**/api/doctor-schedules/department?*", tamper);
    await statistics(1);
    await page.getByRole("heading", { name: fixture.departmentA, exact: true }).waitFor();
    await calendar(1);
    assert.equal(await page.getByText("RC10 Doctor B", { exact: true }).count(), 0);
    await page.unroute("**/api/department-head/statistics?*", tamper);
    await page.unroute("**/api/doctor-schedules/department?*", tamper);
    console.log("PASS production UI and same-origin proxy ignore forged DepartmentId in storage, headers and query");

    let releaseOld;
    const oldGate = new Promise(resolve => { releaseOld = resolve; });
    let oldStarted;
    const oldRequest = new Promise(resolve => { oldStarted = resolve; });
    const pattern = "**/api/doctor-schedules/department?*";
    await page.route(pattern, async route => {
        const response = await route.fetch();
        oldStarted(); await oldGate;
        try { await route.fulfill({ response }); } catch { /* Superseded scope is cancelled. */ }
    });
    await page.getByRole("button", { name: "Tải lại", exact: true }).click();
    await oldRequest;
    assert.equal(await page.getByText("Chi tiết ca khám đã duyệt", { exact: true }).count(), 0);
    await logout();
    await login(fixture.otherUsername);
    // Preserve the same SPA while the previous account's authorized response is still delayed.
    await page.unroute(pattern);
    await calendar(2);
    releaseOld(); await delay(200);
    await page.getByText(/^2 ca •/).waitFor();
    assert.equal(await page.getByText("RC10 Doctor A", { exact: true }).count(), 0);
    await statistics(2);
    console.log("PASS delayed calendar responses cannot cross accounts; both department views use fresh server scope");

    await page.route("**/api/department-head/statistics?*", route => route.fulfill({ status: 500, contentType: "application/json",
        body: JSON.stringify({ code: 9999, message: "Source unavailable", result: null }) }));
    await page.getByRole("button", { name: "Làm mới", exact: true }).click();
    await page.getByRole("button", { name: "Thử lại", exact: true }).waitFor();
    assert.equal(await page.getByTestId("visitCount").count(), 0);
    await page.unroute("**/api/department-head/statistics?*");
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await counts(2, 2, 1);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.setViewportSize({ width: 1440, height: 1000 });
    console.log("PASS statistics errors clear cached figures, retry recovers, and mobile layout fits");

    async function apiLogin(username) {
        const response = await fetch(api + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password: fixture.password }) });
        assert.equal(response.status, 200); return (await response.json()).result;
    }
    const admin = await apiLogin("testadmin");
    async function adminRequest(path, method = "GET", body) {
        const response = await fetch(api + path, { method, headers: { Authorization: "Bearer " + admin.accessToken, "Content-Type": "application/json" },
            ...(body ? { body: JSON.stringify(body) } : {}) });
        assert.equal(response.status, 200); return (await response.json()).result;
    }
    // Removing the current account's doctor profile revokes its session on the server.
    await adminRequest(`/doctors/${fixture.headDoctorBId}/account`, "PATCH", { userId: fixture.missingUserId });
    await revokedSession();
    await login(fixture.otherUsername);
    await page.getByRole("link", { name: "Thống kê khoa", exact: true }).click();
    await page.getByText("Tài khoản cần hồ sơ bác sĩ và khoa đang hoạt động. Vui lòng liên hệ quản trị viên.").waitFor();
    assert.equal(await page.getByTestId("visitCount").count(), 0);
    await logout();
    await login(fixture.missingUsername);
    await statistics(2);
    console.log("PASS account relinking logs out the old session; missing scope never displays stale or whole-clinic figures");

    const roles = await adminRequest("/rbac/roles?pageSize=100");
    const headRole = roles.items.find(role => role.name === "DepartmentHead" || role.roleName === "DepartmentHead");
    assert.ok(headRole);
    const role = await adminRequest(`/rbac/roles/${headRole.roleId}`);
    const permissions = role.permissionCodes || role.permissions.map(item => typeof item === "string" ? item : item.code);
    await adminRequest(`/rbac/roles/${headRole.roleId}/permissions`, "PUT", {
        version: role.version, permissionCodes: permissions.filter(code => code !== "reports.departmentStatistics"),
    });
    await revokedSession();
    await login(fixture.missingUsername);
    assert.equal(await page.getByRole("link", { name: "Thống kê khoa", exact: true }).count(), 0);
    await calendar(2);
    await page.goto("http://127.0.0.1:5190/internal/department-statistics");
    await page.waitForURL("**/403");
    const latestRole = await adminRequest(`/rbac/roles/${headRole.roleId}`);
    await adminRequest(`/rbac/roles/${headRole.roleId}/permissions`, "PUT", { version: latestRole.version, permissionCodes: permissions });
    assert.deepEqual(errors, []);
    console.log("SUCCESS Week10 production UI passed: department isolation, request cancellation, source errors, account relinking, revoked permissions and same-origin deployment");
} catch (error) {
    if (diagnosticPage) {
        console.error("Browser URL:", diagnosticPage.url());
        console.error((await diagnosticPage.locator("body").innerText().catch(() => "")).slice(0, 1700));
        await diagnosticPage.screenshot({ path: "tests/Week2Verification/bin/week10-ui-failure.png", fullPage: true }).catch(() => {});
    }
    throw error;
} finally {
    await browser?.close(); vite?.kill(); host.stdin.end("\n");
    const code = await Promise.race([finished, delay(15000).then(() => null)]);
    if (code === null) host.kill(); else if (code !== 0) process.exitCode = 1;
}
