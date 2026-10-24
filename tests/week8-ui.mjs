import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const host = spawn("dotnet", ["run", "--no-build", "--no-restore", "--configuration", process.env.TEST_CONFIGURATION || "Debug", "--project", "tests/Week2Verification", "--", "--week8-ui"],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
const finished = new Promise(resolve => host.once("exit", resolve));
let vite, browser, diagnosticPage;
try {
    const fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("Week8 SQL Server fixture timed out")), 180000);
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
        host.once("exit", code => { clearTimeout(timeout); reject(new Error(`Week8 fixture exited: ${code}`)); });
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
    }
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", ...(production ? ["preview"] : []), "--host", "127.0.0.1", "--port", "5190", "--strictPort"], {
        cwd: "frontend/clinic-management-client", windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: viteEnvironment,
    });
    vite.stderr.on("data", chunk => process.stderr.write(chunk));
    for (let i = 0; i < 100; i++) {
        try { if ((await fetch("http://127.0.0.1:5190")).ok) break; } catch { /* Wait for Vite. */ }
        if (vite.exitCode != null) throw new Error("Week8 Vite exited before startup");
        await delay(200);
    }
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const errors = [];
    const pages = [];
    async function login(username, path) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        const page = await context.newPage();
        const live = { connections: 0, blocked: false, transport: null };
        await page.routeWebSocket(/\/hubs\/notification/, socket => {
            if (live.blocked) { void socket.close({ code: 4001, reason: "Week8 test outage" }); return; }
            live.connections++;
            live.transport = { client: socket, server: socket.connectToServer() };
        });
        diagnosticPage = page;
        pages.push(page);
        page.setDefaultTimeout(20000);
        page.setDefaultNavigationTimeout(60000);
        page.on("pageerror", error => errors.push(error.message));
        await page.route("https://fonts.googleapis.com/**", route => route.abort());
        await page.route("https://fonts.gstatic.com/**", route => route.abort());
        const response = await context.request.post(api + "/auth/login", { data: { username, password: fixture.password } });
        assert.equal(response.status(), 200);
        const { result } = await response.json();
        await page.goto("http://127.0.0.1:5190/internal/login");
        await page.evaluate(({ accessToken, user }) => {
            localStorage.clear(); sessionStorage.clear();
            sessionStorage.setItem("accessToken", accessToken);
            sessionStorage.setItem("user", JSON.stringify(user));
        }, { accessToken: result.accessToken, user: { userId: result.userId, username: result.username,
            fullName: result.fullName, role: result.role, permissions: result.permissions } });
        await page.goto("http://127.0.0.1:5190" + path);
        return { page, context, session: result, live };
    }
    async function period(page) {
        await page.getByLabel("Từ ngày", { exact: true }).fill(fixture.date);
        await page.getByLabel("Đến ngày", { exact: true }).fill(fixture.date);
        await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
    }
    async function counts(page, visits, pending, approved) {
        for (const [key, value] of Object.entries({ visitCount: visits, pendingScheduleRequestCount: pending, approvedScheduleRequestCount: approved }))
            await page.waitForFunction(({ key, value }) => document.querySelector(`[data-testid="${key}"]`)?.textContent.trim() === String(value), { key, value });
    }
    const statistics = await login(fixture.username, "/internal/department-statistics");
    await period(statistics.page);
    await counts(statistics.page, 1, 1, 1);
    const calendar = await login(fixture.username, "/internal/department-schedules");
    await calendar.page.getByRole("button", { name: "Xem theo ngày", exact: true }).click();
    await calendar.page.getByLabel("Chọn ngày", { exact: true }).fill(fixture.date);
    await calendar.page.getByText(/^1 ca •/).waitFor();
    const unrelated = await login(fixture.otherUsername, "/internal/department-statistics");
    await period(unrelated.page);
    await counts(unrelated.page, 0, 0, 0);
    await delay(300);
    let unrelatedReads = 0;
    unrelated.page.on("request", request => { if (request.url().includes("/department-head/statistics")) unrelatedReads++; });
    const reviewer = await login(fixture.peerUsername, "/internal/schedule-requests");
    diagnosticPage = reviewer.page;
    const row = reviewer.page.getByRole("row").filter({ has: reviewer.page.getByText(`#${fixture.requestId}`, { exact: true }) });
    await row.getByRole("button", { name: "Duyệt", exact: true }).click();
    await reviewer.page.getByRole("button", { name: "Xác nhận phê duyệt", exact: true }).click();
    await reviewer.page.getByText(`Đã phê duyệt yêu cầu #${fixture.requestId}.`, { exact: true }).waitFor();
    await counts(statistics.page, 1, 0, 2);
    await calendar.page.getByText(/^2 ca •/).waitFor();
    await counts(unrelated.page, 0, 0, 0);
    assert.equal(unrelatedReads, 0);
    console.log("PASS real UI approval refreshes another session's calendar and statistics; the other department receives no refresh");

    const doctorLogin = await fetch(api + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "testdoctor", password: fixture.password }) });
    const { result: doctor } = await doctorLogin.json();
    async function mutate(path, token, body, status = 200) {
        const response = await fetch(api + path, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            ...(body ? { body: JSON.stringify(body) } : {}) });
        assert.equal(response.status, status);
        return response.json();
    }
    const submitted = await mutate("/doctor-schedules/request", doctor.accessToken,
        { roomId: 1, workDate: fixture.date, startTime: "11:00", endTime: "12:00" });
    await counts(statistics.page, 1, 1, 2);
    await mutate(`/schedule-requests/${submitted.result.requestId}/reject`, reviewer.session.accessToken, { rejectReason: "Week8 browser verification" });
    await counts(statistics.page, 1, 0, 2);
    console.log("PASS doctor submission and rejection refresh department statistics through SignalR");

    // Miss an event while the browser is offline, then recover by reading the authorized API on reconnect.
    diagnosticPage = statistics.page;
    const connectionsBefore = statistics.live.connections;
    statistics.live.blocked = true;
    await statistics.context.setOffline(true);
    assert.ok(statistics.live.transport, "Reconnect test requires an established hub transport");
    // Chromium offline mode alone does not close established WebSockets. Close both forwarded sides explicitly.
    await Promise.all([statistics.live.transport.client.close({ code: 4001, reason: "Week8 test outage" }),
        statistics.live.transport.server.close({ code: 4001, reason: "Week8 test outage" })]);
    const missed = await mutate("/doctor-schedules/request", doctor.accessToken,
        { roomId: 1, workDate: fixture.date, startTime: "12:00", endTime: "13:00" });
    statistics.live.blocked = false;
    await statistics.context.setOffline(false);
    await counts(statistics.page, 1, 1, 2);
    assert.ok(statistics.live.connections > connectionsBefore, "Recovery must establish a new hub transport");
    await mutate(`/schedule-requests/${missed.result.requestId}/reject`, reviewer.session.accessToken, { rejectReason: "Reconnect cleanup" });
    await counts(statistics.page, 1, 0, 2);
    console.log("PASS reconnect recovers missed department changes using the active date range");

    // A valid refresh cookie must recover an expired access token for HTTP and the hub.
    await statistics.page.evaluate(() => {
        const parts = sessionStorage.getItem("accessToken").split(".");
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        payload.exp = 1;
        parts[1] = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        sessionStorage.setItem("accessToken", parts.join("."));
    });
    await statistics.page.reload();
    await period(statistics.page);
    await counts(statistics.page, 1, 0, 2);
    assert.equal(await statistics.page.evaluate(() => JSON.parse(atob(sessionStorage.getItem("accessToken").split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).exp > Date.now() / 1000), true);
    console.log("PASS frontend refresh rotates the HTTP-only cookie and restores a usable JWT");

    await statistics.page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    await statistics.page.waitForURL("**/internal/login");
    assert.equal(await statistics.page.getByTestId("visitCount").count(), 0);
    assert.equal(await statistics.page.evaluate(() => sessionStorage.getItem("accessToken")), null);
    const doctorPortal = await login("testdoctor", "/internal/department-schedules");
    await doctorPortal.page.waitForURL("**/403");
    assert.equal(await doctorPortal.page.getByRole("link", { name: "Lịch làm việc của khoa", exact: true }).count(), 0);
    assert.equal(await doctorPortal.page.getByRole("link", { name: "Thống kê khoa", exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log("SUCCESS Week8 browser integration passed: production UI, scoped SignalR, reconnect, JWT refresh, logout and route permissions");
} catch (error) {
    if (diagnosticPage) {
        console.error("Browser URL:", diagnosticPage.url());
        console.error((await diagnosticPage.locator("body").innerText().catch(() => "")).slice(0, 1600));
        await diagnosticPage.screenshot({ path: "tests/Week2Verification/bin/week8-ui-failure.png", fullPage: true }).catch(() => {});
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
