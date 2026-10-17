import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
await mkdir(".tmp", { recursive: true });
const host = spawn("dotnet", ["run", "--no-build", "--no-restore", "-c", "Release", "--project", "tests/Week2Verification", "--", "--a6-ui"],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
const finished = new Promise(resolve => host.once("exit", resolve));
let vite, browser, page;
try {
    const fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("A6 migration/API fixture timed out")), 180000);
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
        host.once("exit", code => { clearTimeout(timeout); reject(new Error(`A6 fixture exited: ${code}`)); });
    });
    const api = fixture.baseUrl.replace(/\/$/, "") + "/api";
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5190", "--strictPort"], {
        cwd: "frontend/clinic-management-client", windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, VITE_API_BASE_URL: api, VITE_SIGNALR_HUB_URL: fixture.baseUrl + "hubs/notification" },
    });
    vite.stderr.on("data", chunk => process.stderr.write(chunk));
    for (let i = 0; i < 100; i++) {
        try { if ((await fetch("http://127.0.0.1:5190")).ok) break; } catch {}
        await delay(200);
    }
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(60000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    await page.route("https://fonts.gstatic.com/**", route => route.abort());
    async function login(username, internal = false, profileOnly = false) {
        await page.goto(`http://127.0.0.1:5190/${internal ? "internal/login" : "login"}`, { waitUntil: "domcontentloaded" });
        await page.getByLabel("Tên đăng nhập", { exact: true }).fill(username);
        await page.getByLabel("Mật khẩu", { exact: true }).fill(fixture.password);
        await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
        await page.waitForURL(url => profileOnly ? url.pathname === "/403" : internal ? url.pathname.startsWith("/internal/") && url.pathname !== "/internal/login" : url.pathname === "/booking");
    }
    async function cookie() { return (await context.cookies(api + "/auth/refresh")).find(x => x.name === "clinic_refresh"); }
    async function signOut(internal = false) {
        const response = page.waitForResponse(value => value.url() === api + "/auth/logout" && value.status() === 204);
        if (internal) await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
        else {
            await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
            await page.getByRole("menuitem", { name: "Đăng xuất", exact: true }).click();
        }
        await (await response).finished();
        await page.waitForURL(internal ? "**/internal/login" : "**/login");
    }
    await login("a6patient");
    assert((await cookie()).httpOnly);
    assert(await page.evaluate(() => !document.cookie.includes("clinic_refresh") && !localStorage.getItem("refreshToken") && !sessionStorage.getItem("refreshToken")));
    await page.goto("http://127.0.0.1:5190/profile");
    await page.getByLabel("Họ tên tài khoản").fill("A6 browser patient");
    await page.getByLabel("Email", { exact: true }).fill("a6-browser@example.test");
    await page.getByRole("button", { name: "Lưu tài khoản", exact: true }).click();
    await page.getByText("Đã lưu thông tin tài khoản.").waitFor();
    await page.reload();
    await page.getByLabel("Họ tên tài khoản").waitFor();
    assert.equal(await page.getByLabel("Họ tên tài khoản").inputValue(), "A6 browser patient");
    console.log("PASS account profile saves and reloads through real API; refresh token is only in HttpOnly cookie");
    await page.goto("http://127.0.0.1:5190/my-reviews");
    await page.getByRole("button", { name: "Viết đánh giá", exact: true }).click();
    await page.getByLabel("Nhận xét", { exact: true }).fill("A6 browser review");
    await page.getByRole("button", { name: "Gửi đánh giá", exact: true }).click();
    await page.getByText("Đã gửi đánh giá.").waitFor();
    assert.equal(await page.getByRole("button", { name: "Viết đánh giá", exact: true }).count(), 0);
    await page.screenshot({ path: ".tmp/a6-patient-reviews.png", fullPage: true });
    await signOut();
    assert(!(await cookie()), "Logout removes the refresh cookie");
    assert.equal((await page.request.post(api + "/auth/refresh")).status(), 401);
    await login("testadmin", true);
    await page.goto("http://127.0.0.1:5190/internal/reviews");
    const row = page.locator(".MuiPaper-root").filter({ has: page.getByText("A6 browser review", { exact: true }) }).last();
    await row.getByRole("button", { name: "Ẩn đánh giá", exact: true }).click();
    await page.getByRole("button", { name: "Hiện đánh giá", exact: true }).waitFor();
    let publicRows = (await (await page.request.get(api + "/reviews?doctorId=1")).json()).result;
    assert(!publicRows.items.some(x => x.comment === "A6 browser review"));
    await page.getByRole("button", { name: "Hiện đánh giá", exact: true }).click();
    await page.getByText("A6 browser review", { exact: true }).waitFor();
    await page.waitForFunction(async api => (await (await fetch(api + "/reviews?doctorId=1")).json()).result.items.some(x => x.comment === "A6 browser review"), api);
    await page.screenshot({ path: ".tmp/a6-admin-reviews.png", fullPage: true });
    console.log("PASS patient submits completed appointment review; Admin hides/shows persisted feedback in public API");

    let refreshCount = 0;
    await page.route("**/api/auth/refresh", route => { refreshCount++; return route.continue(); });
    const oldCookie = await cookie();
    const statuses = await page.evaluate(async () => {
        sessionStorage.setItem("accessToken", "expired-a6-access");
        const { default: client } = await import("/src/api/axiosClient.js");
        return Promise.all(["/auth/me", "/users", "/reviews/admin"].map(path => client.get(path).then(response => response.status)));
    });
    assert.deepEqual(statuses, [200, 200, 200]);
    assert.equal(refreshCount, 1);
    assert((await cookie()).value !== oldCookie.value, "Refresh rotates the cookie value");
    await page.unroute("**/api/auth/refresh");
    console.log("PASS simultaneous 401 responses share one real refresh and retry successfully");

    let release, arrived;
    const releasePromise = new Promise(resolve => { release = resolve; });
    const arrivedPromise = new Promise(resolve => { arrived = resolve; });
    await page.route("**/api/auth/refresh", async route => {
        const response = await route.fetch();
        arrived();
        await releasePromise;
        await route.fulfill({ response });
    });
    await page.evaluate(async () => {
        sessionStorage.setItem("accessToken", "expired-a6-logout-race");
        const { default: client } = await import("/src/api/axiosClient.js");
        window.a6Pending = client.get("/auth/me").catch(() => null);
    });
    await Promise.race([arrivedPromise, delay(15000).then(() => { throw new Error("Refresh race did not arrive"); })]);
    const logoutFinished = page.waitForResponse(response => response.url() === api + "/auth/logout" && response.status() === 204);
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    release();
    await (await logoutFinished).finished();
    await page.waitForURL("**/internal/login");
    await page.evaluate(() => window.a6Pending);
    assert(await page.evaluate(() => !localStorage.getItem("accessToken") && !sessionStorage.getItem("accessToken")));
    assert(!(await cookie()), "Logout after rotation removes the replacement cookie");
    assert.equal((await page.request.post(api + "/auth/refresh")).status(), 401);
    await page.unroute("**/api/auth/refresh");
    console.log("PASS logout during refresh waits for rotation, revokes replacement and prevents session restoration");

    for (const username of ["a6cashier", "a6pharmacist", "a6head"]) {
        await login(username, true);
        await page.goto("http://127.0.0.1:5190/internal/profile");
        await page.getByLabel("Họ tên tài khoản").waitFor();
        await page.goto("http://127.0.0.1:5190/internal/reviews");
        await page.waitForURL("**/403");
        await page.goto("http://127.0.0.1:5190/internal/profile");
        await signOut(true);
    }
    await page.goto("http://127.0.0.1:5190/internal/reviews");
    await page.waitForURL("**/internal/login");
    await login("a6profile", false, true);
    await page.goto("http://127.0.0.1:5190/profile");
    await page.getByLabel("Họ tên tài khoản").waitFor();
    await page.getByLabel("Họ tên tài khoản").fill("A6 profile-only account");
    await page.getByRole("button", { name: "Lưu tài khoản", exact: true }).click();
    await page.getByText("Đã lưu thông tin tài khoản.").waitFor();
    await signOut();
    console.log("PASS custom role without module permissions can view and edit its own profile");
    await login("a6patient");
    await page.goto("http://127.0.0.1:5190/profile");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel("Họ tên tài khoản").waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: ".tmp/a6-profile-mobile.png", fullPage: true });
    assert.deepEqual(errors, []);
    console.log("SUCCESS A6 browser E2E: profile/reviews/refresh/logout/role routes/mobile passed on migrated SQL Server DB");
} catch (error) {
    await page?.screenshot({ path: ".tmp/a6-ui-failure.png", fullPage: true }).catch(() => {});
    throw error;
} finally {
    await browser?.close();
    vite?.kill();
    host.stdin.end("\n");
    const code = await Promise.race([finished, delay(15000).then(() => null)]);
    if (code === null) host.kill();
    else if (code !== 0) process.exitCode = 1;
}
