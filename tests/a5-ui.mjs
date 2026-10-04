import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
await mkdir(".tmp", { recursive: true });
const host = spawn("dotnet", ["run", "--no-restore", "--project", "tests/Week2Verification", "--", "--a5-ui"],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
const hostFinished = new Promise(resolve => host.once("exit", resolve));
let vite, browser, page;
try {
    const fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("A5 API fixture startup timed out")), 180000);
        host.stdout.on("data", chunk => {
            pending += chunk;
            for (const line of pending.split(/\r?\n/).slice(0, -1)) {
                if (line.startsWith("AUTH_UI_SESSION:")) { clearTimeout(timeout); resolve(JSON.parse(line.slice(16))); }
                else if (line.startsWith("PASS") || line.startsWith("SUCCESS")) console.log(line);
            }
            pending = pending.slice(pending.lastIndexOf("\n") + 1);
        });
        host.stderr.on("data", chunk => process.stderr.write(chunk));
        host.once("error", reject);
        host.once("exit", code => { clearTimeout(timeout); reject(new Error(`A5 fixture exited: ${code}`)); });
    });
    const api = fixture.baseUrl.replace(/\/$/, "") + "/api";
    async function login(username) {
        const response = await fetch(api + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password: fixture.password }) });
        assert.equal(response.status, 200);
        return (await response.json()).result;
    }
    const head = await login("a5head");
    const doctor = await login("testdoctor");
    const user = { userId: head.userId, username: head.username, fullName: head.fullName, role: head.role, permissions: head.permissions };
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5190", "--strictPort"], {
        cwd: "frontend/clinic-management-client", windowsHide: true, stdio: "ignore",
        env: { ...process.env, VITE_API_BASE_URL: api },
    });
    for (let i = 0; i < 100; i++) { try { if ((await fetch("http://127.0.0.1:5190")).ok) break; } catch {} await delay(200); }
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
    await context.addInitScript(({ accessToken, refreshToken, user }) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
    }, { accessToken: head.accessToken, refreshToken: head.refreshToken, user });
    page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    await page.route("https://fonts.gstatic.com/**", route => route.abort());
    await page.goto("http://127.0.0.1:5190/internal/department-schedules", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Chọn ngày").fill(fixture.date);
    await page.getByRole("button", { name: /^Ca / }).first().waitFor();
    await page.getByRole("combobox", { name: "Lọc theo bác sĩ" }).click();
    await page.getByRole("option", { name: fixture.doctorName, exact: true }).click();
    await page.getByRole("combobox", { name: "Lọc theo phòng khám" }).click();
    const roomOptions = page.getByRole("option");
    assert.equal(await roomOptions.count(), 2, "Only own department room is selectable");
    await roomOptions.nth(1).click();
    await page.waitForFunction(() => document.querySelectorAll('button[aria-label^="Ca "]').length === 2);
    await page.getByRole("button", { name: /^Ca .*10:00$/ }).click();
    assert.match(await page.getByLabel("Chi tiết ca khám đã duyệt").innerText(), /10:00 – 11:00/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: ".tmp/a5-week.png", fullPage: true });
    await page.getByRole("button", { name: "Tuần sau", exact: true }).click();
    await page.getByText("Không có ca đã duyệt trong khoảng thời gian và bộ lọc đã chọn.").waitFor();
    await page.getByRole("button", { name: "Tuần trước", exact: true }).click();
    await page.getByRole("button", { name: /^Ca / }).first().waitFor();
    await page.getByRole("button", { name: "Xem theo ngày", exact: true }).click();
    await page.getByText(/Lịch theo ngày & sơ đồ phòng khám/).waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: ".tmp/a5-day.png", fullPage: true });
    await page.getByLabel("Tìm bác sĩ, phòng").fill("absent-doctor");
    await page.getByText("Không có ca đã duyệt trong khoảng thời gian và bộ lọc đã chọn.").waitFor();
    await page.getByLabel("Tìm bác sĩ, phòng").fill("");

    await page.route("**/api/doctor-schedules/department?*", async route => { await delay(600); await route.continue(); });
    await page.getByRole("button", { name: "Tải lại", exact: true }).click();
    await page.getByText("Đang tải lịch khoa…").waitFor();
    await page.getByRole("button", { name: /^Ca / }).first().waitFor();
    await page.unroute("**/api/doctor-schedules/department?*");
    await page.route("**/api/doctor-schedules/department?*", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ code: 9999, message: "Uncategorized error" }) }));
    await page.getByRole("button", { name: "Tải lại", exact: true }).click();
    await page.getByRole("button", { name: "Thử lại", exact: true }).waitFor();
    await page.unroute("**/api/doctor-schedules/department?*");
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await page.getByRole("button", { name: /^Ca / }).first().waitFor();
    console.log("PASS UI day/week navigation, scoped filters, multiple shifts, details, empty/error/retry");

    const requestDate = new Date(`${fixture.date}T12:00:00Z`);
    requestDate.setUTCDate(requestDate.getUTCDate() + 4);
    await delay(500);
    const submitted = await fetch(api + "/doctor-schedules/request", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${doctor.accessToken}` },
        body: JSON.stringify({ roomId: 1, workDate: requestDate.toISOString().slice(0, 10), startTime: "11:00", endTime: "12:00" }) });
    assert.equal(submitted.status, 200);
    const requestId = (await submitted.json()).result.requestId;
    await page.getByRole("alert").filter({ hasText: `#${requestId} ` }).waitFor();
    await page.getByRole("button", { name: "Thông báo", exact: true }).click();
    const notification = page.getByRole("button").filter({ hasText: `Yêu cầu ca #${requestId} ` });
    await notification.waitFor();
    const readResponse = page.waitForResponse(response => /\/notifications\/\d+\/read$/.test(new URL(response.url()).pathname));
    await notification.click();
    assert.equal((await readResponse).status(), 200);
    await page.keyboard.press("Escape");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Thông báo", exact: true }).click();
    await page.getByRole("button").filter({ hasText: `Yêu cầu ca #${requestId} ` }).waitFor();
    const historyResponse = await fetch(api + "/notifications?pageSize=100", { headers: { Authorization: `Bearer ${head.accessToken}` } });
    const history = (await historyResponse.json()).result.items;
    assert.equal(history.filter(item => item.message.includes(`Yêu cầu ca #${requestId} `)).length, 1);
    assert.equal(history.find(item => item.message.includes(`Yêu cầu ca #${requestId} `)).isRead, true);
    console.log("PASS UI receives live NotificationReceived and reloads persisted notification/read state");
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel("Chọn ngày").fill(fixture.date);
    await page.getByRole("button", { name: /^Ca / }).first().waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: ".tmp/a5-mobile.png", fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Mobile shell has no horizontal overflow");
    assert.deepEqual(errors, []);
    console.log("PASS UI mobile layout and no browser runtime errors");
} catch (error) {
    if (page) await page.screenshot({ path: ".tmp/a5-ui-failure.png", fullPage: true }).catch(() => {});
    throw error;
} finally {
    await browser?.close();
    vite?.kill();
    if (host.exitCode === null) host.stdin.end("done\n");
    await hostFinished;
}
