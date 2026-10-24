import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const host = spawn("dotnet", ["run", "--no-build", "--no-restore", "--project", "tests/Week2Verification", "--", "--a7-ui",
    ...(process.argv.includes("--model") ? ["--model-schema"] : [])],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
const finished = new Promise(resolve => host.once("exit", resolve));
let vite, browser, page;
try {
    const fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("A7 SQL Server fixture timed out")), 180000);
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
        host.once("exit", code => { clearTimeout(timeout); reject(new Error(`A7 fixture exited: ${code}`)); });
    });
    const api = fixture.baseUrl.replace(/\/$/, "") + "/api";
    const viteEnvironment = { ...process.env, VITE_API_BASE_URL: api, VITE_SIGNALR_HUB_URL: fixture.baseUrl + "hubs/notification" };
    const production = process.argv.includes("--production");
    if (production) {
        const build = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "build"], {
            cwd: "frontend/clinic-management-client", windowsHide: true, stdio: ["ignore", "ignore", "pipe"], env: viteEnvironment,
        });
        build.stderr.on("data", chunk => process.stderr.write(chunk));
        await new Promise((resolve, reject) => {
            build.once("error", reject);
            build.once("exit", code => code === 0 ? resolve() : reject(new Error(`Production build exited: ${code}`)));
        });
        console.log("PASS production build prepared for browser verification");
    }
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", ...(production ? ["preview"] : []), "--host", "127.0.0.1", "--port", "5190", "--strictPort"], {
        cwd: "frontend/clinic-management-client", windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
        env: viteEnvironment,
    });
    vite.stderr.on("data", chunk => process.stderr.write(chunk));
    for (let i = 0; i < 100; i++) {
        try { if ((await fetch("http://127.0.0.1:5190")).ok) break; } catch { /* Wait for Vite. */ }
        if (vite.exitCode != null) throw new Error("A7 Vite exited before startup");
        await delay(200);
    }
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(60000);
    const errors = [];
    page.on("pageerror", error => { errors.push(error.message); console.error("Browser error:", error.message); });
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    await page.route("https://fonts.gstatic.com/**", route => route.abort());
    async function login(username) {
        const response = await fetch(api + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password: fixture.password }) });
        assert.equal(response.status, 200);
        const { result } = await response.json();
        await page.goto("http://127.0.0.1:5190/internal/login");
        await page.evaluate(({ accessToken, user }) => {
            localStorage.clear(); sessionStorage.clear();
            sessionStorage.setItem("accessToken", accessToken);
            sessionStorage.setItem("user", JSON.stringify(user));
        }, { accessToken: result.accessToken, user: { userId: result.userId, username: result.username,
            fullName: result.fullName, role: result.role, permissions: result.permissions } });
        await page.goto("http://127.0.0.1:5190/internal/department-statistics");
        return result;
    }
    async function setPeriod(fromDate, toDate) {
        await page.getByLabel("Từ ngày", { exact: true }).fill(fromDate);
        await page.getByLabel("Đến ngày", { exact: true }).fill(toDate);
        await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
    }
    async function counts(visits, pending, approved) {
        for (const [key, value] of Object.entries({ visitCount: visits, pendingScheduleRequestCount: pending, approvedScheduleRequestCount: approved }))
            await page.waitForFunction(({ key, value }) => document.querySelector(`[data-testid="${key}"]`)?.textContent.trim() === String(value), { key, value });
    }
    await login(fixture.username);
    await page.getByRole("link", { name: "Thống kê khoa", exact: true }).waitFor();
    await setPeriod(fixture.fromDate, fixture.toDate);
    await counts(3, 2, 2);
    console.log("PASS A7 portal renders real scoped SQL Server aggregates 3/2/2");
    await setPeriod("2031-06-02", "2031-06-01");
    await page.getByText("Ngày kết thúc phải từ ngày bắt đầu trở đi.").waitFor();
    await counts(3, 2, 2);
    await setPeriod("2032-01-01", "2032-01-31");
    await counts(0, 0, 0);
    await page.getByText("Khoa chưa có lượt khám hoặc yêu cầu ca trong kỳ đã chọn.").waitFor();
    console.log("PASS A7 invalid dates stay local; successful empty periods show explicit zeroes");

    const pattern = "**/api/department-head/statistics?*";
    await page.route(pattern, async route => { await delay(700); await route.continue(); });
    await page.getByRole("button", { name: "Làm mới", exact: true }).click();
    await page.getByRole("status", { name: "Đang tải thống kê", exact: true }).waitFor();
    assert.equal(await page.getByTestId("visitCount").count(), 0);
    await counts(0, 0, 0);
    await page.unroute(pattern);
    await page.route(pattern, route => route.fulfill({ status: 500, contentType: "application/json",
        body: JSON.stringify({ code: 9999, message: "Uncategorized error", result: null }) }));
    await page.getByRole("button", { name: "Làm mới", exact: true }).click();
    await page.getByRole("button", { name: "Thử lại", exact: true }).waitFor();
    assert.equal(await page.getByTestId("visitCount").count(), 0);
    await page.unroute(pattern);
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await counts(0, 0, 0);
    console.log("PASS A7 loading clears prior figures; source error never becomes zero; retry recovers");

    let releaseOld;
    const oldGate = new Promise(resolve => { releaseOld = resolve; });
    let oldStarted;
    const oldRequest = new Promise(resolve => { oldStarted = resolve; });
    await page.route(pattern, async route => {
        if (new URL(route.request().url()).searchParams.get("fromDate") === fixture.fromDate) {
            oldStarted();
            await oldGate;
            try { await route.continue(); } catch { /* Browser may have cancelled the superseded request. */ }
        } else await route.continue();
    });
    await setPeriod(fixture.fromDate, fixture.toDate);
    await oldRequest;
    await setPeriod("2032-01-01", "2032-01-31");
    await counts(0, 0, 0);
    releaseOld();
    await delay(700);
    await counts(0, 0, 0);
    await page.unroute(pattern);
    console.log("PASS A7 an older delayed request cannot overwrite the newer period");

    await login(fixture.otherUsername);
    await setPeriod(fixture.fromDate, fixture.toDate);
    await counts(1, 1, 1);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log("PASS A7 account switch loads department B independently; mobile layout fits");
    await page.route(pattern, route => route.fulfill({ status: 403, contentType: "application/json",
        body: JSON.stringify({ code: 1003, message: "You do not have permission", result: null }) }));
    await page.getByRole("button", { name: "Làm mới", exact: true }).click();
    await page.waitForURL("**/403");
    await page.unroute(pattern);
    await login("testdoctor");
    await page.waitForURL("**/403");
    assert.equal(await page.getByRole("link", { name: "Thống kê khoa", exact: true }).count(), 0);
    await page.goto("http://127.0.0.1:5190/profile");
    await page.getByLabel("Họ tên tài khoản").waitFor();
    console.log("PASS staff can open its own profile through the shared /profile route");

    await page.setViewportSize({ width: 1440, height: 1000 });
    await login("testadmin");
    const summaryReady = page.waitForResponse(response => response.url().includes("/api/admin-dashboard/summary") && response.status() === 200);
    await page.goto("http://127.0.0.1:5190/internal/dashboard");
    await summaryReady;
    const refreshed = page.waitForResponse(response => response.url().includes("/api/admin-dashboard/summary") && response.status() === 200);
    await page.getByRole("button", { name: "Làm mới", exact: true }).click();
    await refreshed;
    console.log("PASS Admin dashboard loads and refreshes through the live API");

    await page.goto("http://127.0.0.1:5190/internal/cashier/billing");
    const selectButtons = page.getByRole("button", { name: "Chọn thu tiền", exact: true });
    await selectButtons.first().waitFor();
    assert.ok(await selectButtons.count() > 1);
    await selectButtons.nth(0).click();
    await page.getByRole("button", { name: "80%", exact: true }).click();
    assert.equal(await page.getByRole("spinbutton").inputValue(), "80%");
    await selectButtons.nth(1).click();
    assert.equal(await page.getByRole("spinbutton").inputValue(), "0%");
    await page.getByRole("combobox").first().click();
    await page.getByText("2. Sổ LabAndConsultation (Xét nghiệm)", { exact: true }).click();
    await page.getByText("Vui lòng chọn một bản ghi từ danh sách bên trái để xem chi tiết và lập hóa đơn.").waitFor();
    await page.getByRole("tab", { name: /Lịch Sử & Điều Chỉnh Hóa Đơn/ }).click();
    await page.getByPlaceholder("Nhập Mã hóa đơn / Mã bệnh nhân").fill("A & B");
    const [searched] = await Promise.all([
        page.waitForResponse(response => /\/api\/invoices\/history$/i.test(new URL(response.url()).pathname)
            && new URL(response.url()).searchParams.get("search") === "A & B"),
        page.getByRole("button", { name: /Tìm kiếm/ }).click(),
    ]);
    assert.equal(searched.status(), 200, await searched.text());
    console.log("PASS billing selection works, resets insurance per patient/stage, and history preserves encoded search text");
    await context.clearCookies();
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto("http://127.0.0.1:5190/internal/department-statistics");
    await page.waitForURL("**/internal/login");
    assert.deepEqual(errors, []);
    console.log("SUCCESS browser E2E passed: A7, own profile, Admin dashboard, billing selection/insurance/history and authentication");
} catch (error) {
    if (page) {
        console.error("Browser URL:", page.url());
        console.error((await page.locator("body").innerText().catch(() => "")).slice(0, 1200));
        await page.screenshot({ path: "tests/Week2Verification/bin/a7-ui-failure.png", fullPage: true }).catch(() => {});
    }
    throw error;
} finally {
    await browser?.close();
    vite?.kill();
    host.stdin.end("\n");
    const code = await Promise.race([finished, delay(15000).then(() => null)]);
    if (code === null) host.kill();
    else if (code !== 0) process.exitCode = 1;
}
