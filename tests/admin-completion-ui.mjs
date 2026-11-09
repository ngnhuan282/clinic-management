import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const host = spawn("dotnet", ["run", "--no-build", "--no-restore", "-c", "Release", "--project", "tests/UiRefreshVerification", "--", "--admin-completion"], {
    windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
});
const finished = new Promise(resolve => host.once("exit", resolve));
const site = "http://127.0.0.1:5190";
let fixture, vite, browser, page;
let fixtureError = "";
host.stderr.on("data", chunk => { fixtureError = (fixtureError + chunk).slice(-6000); });
let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; console.log("PASS " + label); };
try {
    fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("Admin fixture startup timed out")), 240000);
        host.stdout.on("data", chunk => {
            pending += chunk;
            const lines = pending.split(/\r?\n/); pending = lines.pop();
            for (const line of lines) {
                if (line.startsWith("UI_FIXTURE:")) { clearTimeout(timeout); resolve(JSON.parse(line.slice(11))); }
                else if (line.startsWith("PASS ") || line.startsWith("UI_FIXTURE_CLEANUP:")) console.log(line);
            }
        });
        host.once("error", error => { clearTimeout(timeout); reject(error); });
        host.once("exit", code => { clearTimeout(timeout); reject(new Error("Admin fixture exited: " + code + "\n" + fixtureError)); });
    });
    const apiBase = fixture.baseUrl.replace(/\/$/, "") + "/api";
    const api = async (path, { method = "GET", payload, access } = {}) => {
        const response = await fetch(apiBase + path, { method, headers: { "Content-Type": "application/json", ...(access ? { Authorization: "Bearer " + access } : {}) }, body: payload ? JSON.stringify(payload) : undefined });
        assert.ok(response.ok, method + " " + path + " returned " + response.status);
        return (await response.json()).result;
    };
    const admin = await api("/auth/login", { method: "POST", payload: { username: fixture.usernames.admin, password: fixture.password } });
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5190", "--strictPort"], {
        cwd: "frontend/clinic-management-client", windowsHide: true, stdio: "ignore",
        env: { ...process.env, VITE_API_BASE_URL: apiBase, VITE_SIGNALR_HUB_URL: fixture.baseUrl.replace(/\/$/, "") + "/hubs/notification" },
    });
    let ready = false;
    for (let i = 0; i < 150; i++) { try { ready = (await fetch(site)).ok; } catch {} if (ready) break; await delay(200); }
    assert.ok(ready, "Vite starts");
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    await page.route("https://fonts.gstatic.com/**", route => route.abort());
    await mkdir(".tmp/admin-completion", { recursive: true });
    const usersUrl = response => new URL(response.url()).pathname === "/api/users";
    const filterUser = async username => {
        await page.getByLabel("Tìm tài khoản theo tên, email hoặc số điện thoại").fill(username);
        const result = page.waitForResponse(response => usersUrl(response) && response.request().method() === "GET" && new URL(response.url()).searchParams.get("search") === username);
        await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
        await result;
        await page.getByRole("table", { name: "Danh sách tài khoản" }).waitFor();
    };
    const selectOption = async (label, option, scope = page) => {
        await scope.getByRole("combobox", { name: label, exact: false }).click();
        await page.getByRole("option", { name: option, exact: typeof option === "string" }).click();
    };
    await page.goto(site + "/internal/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Tên đăng nhập", { exact: true }).fill(fixture.usernames.admin);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(fixture.password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL(url => url.pathname.startsWith("/internal/") && url.pathname !== "/internal/login");
    await page.goto(site + "/internal/users", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Quản lý tài khoản & người dùng" }).waitFor();
    await page.getByRole("table", { name: "Danh sách tài khoản" }).waitFor();
    const summary = await api("/users/summary", { access: admin.accessToken });
    const totalCard = page.getByText("Tổng tài khoản theo bộ lọc", { exact: true }).locator("..");
    check(await totalCard.getByText(String(summary.total), { exact: true }).isVisible(), "Account summary renders actual totals across pages");
    const staffUsername = fixture.adminCompletion.StaffUsername;
    await filterUser(staffUsername);
    await page.getByRole("button", { name: "Sửa thông tin " + staffUsername, exact: true }).click();
    const edit = page.getByRole("dialog", { name: "Sửa thông tin tài khoản" });
    await edit.getByLabel("Họ và tên", { exact: false }).fill("Nhân viên kiểm thử qua giao diện");
    await edit.getByLabel("Email", { exact: true }).fill("browser.staff@example.test");
    await edit.getByLabel("Số điện thoại", { exact: true }).fill("0902111222");
    const editResult = page.waitForResponse(response => response.request().method() === "PUT" && new URL(response.url()).pathname === "/api/users/" + fixture.adminCompletion.StaffUserId);
    await edit.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    assert.equal((await editResult).status(), 200);
    await edit.waitFor({ state: "hidden" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await filterUser(staffUsername);
    check(await page.getByRole("table").getByText("Nhân viên kiểm thử qua giao diện", { exact: true }).isVisible(), "Edited profile survives a full browser reload");

    await page.getByRole("button", { name: "Thêm nhân viên", exact: true }).click();
    const create = page.getByRole("dialog", { name: "Tạo tài khoản nhân viên" });
    await create.getByRole("button", { name: "Tạo tài khoản", exact: true }).click();
    check(await create.getByText("Nhập họ tên, tối đa 100 ký tự.", { exact: true }).isVisible(), "Staff form validates required fields before posting");
    await create.getByLabel("Tên đăng nhập", { exact: false }).fill("ui_browser_staff");
    await create.getByLabel("Họ và tên", { exact: false }).fill("Nhân viên được tạo qua giao diện");
    await create.getByLabel("Email", { exact: true }).fill("new.browser.staff@example.test");
    await create.getByLabel("Mật khẩu ban đầu", { exact: false }).fill(fixture.password);
    await selectOption("Vai trò nhân viên", "Lễ tân", create);
    const createdResponse = page.waitForResponse(response => usersUrl(response) && response.request().method() === "POST");
    await create.getByRole("button", { name: "Tạo tài khoản", exact: true }).click();
    assert.equal((await createdResponse).status(), 201);
    await create.waitFor({ state: "hidden" });
    await filterUser("ui_browser_staff");
    check(await page.getByRole("table").getByText("Lễ tân", { exact: true }).isVisible(), "Admin creates a staff account with the selected role through the UI");
    const refreshed = await page.evaluate(async apiBase => {
        const response = await fetch(apiBase + "/auth/refresh", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" });
        const body = await response.json();
        return { status: response.status, userId: body.result?.userId, role: body.result?.role };
    }, apiBase);
    check(refreshed.status === 200 && refreshed.userId === admin.userId && refreshed.role === "Admin", "Creating staff preserves the browser's Admin refresh session");

    await page.getByRole("button", { name: "Thêm nhân viên", exact: true }).click();
    await create.getByLabel("Tên đăng nhập", { exact: false }).fill("ui_browser_doctor");
    await create.getByLabel("Họ và tên", { exact: false }).fill("Bác sĩ được tạo qua giao diện");
    await create.getByLabel("Mật khẩu ban đầu", { exact: false }).fill(fixture.password);
    await selectOption("Vai trò nhân viên", "Bác sĩ", create);
    await create.getByLabel("Tìm hồ sơ bác sĩ", { exact: true }).fill("Hồ sơ bác sĩ kiểm thử Admin 4");
    await create.getByRole("combobox", { name: "Hồ sơ bác sĩ", exact: false }).waitFor();
    await selectOption("Hồ sơ bác sĩ", /Hồ sơ bác sĩ kiểm thử Admin 4/, create);
    const doctorResponse = page.waitForResponse(response => usersUrl(response) && response.request().method() === "POST");
    await create.getByRole("button", { name: "Tạo tài khoản", exact: true }).click();
    const doctorCreated = await doctorResponse;
    assert.equal(doctorCreated.status(), 201);
    check((await doctorCreated.json()).result.doctorId === fixture.adminCompletion.AvailableDoctorId, "Doctor account creation links the profile selected in the UI");
    await create.waitFor({ state: "hidden" });
    await filterUser("ui_browser_doctor");
    check(await page.getByRole("table").getByText("Hồ sơ bác sĩ kiểm thử Admin 4", { exact: true }).isVisible(), "Account table shows the actual linked doctor profile");
    await filterUser("ui_browser_staff");
    await page.getByRole("button", { name: "Đổi vai trò ui_browser_staff", exact: true }).click();
    const roleDialog = page.getByRole("dialog", { name: "Đổi vai trò tài khoản" });
    await selectOption("Vai trò mới", "Dược sĩ", roleDialog);
    await roleDialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await roleDialog.waitFor({ state: "hidden" });
    await page.getByRole("table").getByText("Dược sĩ", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Khóa ui_browser_staff", exact: true }).click();
    const statusDialog = page.getByRole("dialog", { name: "Khóa tài khoản" });
    await statusDialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await statusDialog.waitFor({ state: "hidden" });
    await page.getByRole("table").getByText("Đã khóa", { exact: true }).waitFor();
    check(true, "Existing role and lock workflows still persist after account completion");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Xuất trang CSV", exact: true }).click();
    const downloaded = await download;
    const csv = await readFile(await downloaded.path(), "utf8");
    check(csv.includes("ui_browser_staff") && csv.includes("Nhân viên được tạo qua giao diện"), "CSV export contains actual displayed account data");
    await filterUser("uiadmin");
    check(await page.getByRole("button", { name: "Đổi vai trò uiadmin", exact: true }).isDisabled()
        && await page.getByRole("button", { name: "Khóa uiadmin", exact: true }).isDisabled(), "Self-demotion and self-lock controls remain disabled");
    await page.screenshot({ path: ".tmp/admin-completion/users-desktop.png", fullPage: true });

    await page.goto(site + "/internal/reviews", { waitUntil: "domcontentloaded" });
    await page.getByRole("table", { name: "Điểm đánh giá theo bác sĩ" }).waitFor();
    const row = page.getByRole("table", { name: "Điểm đánh giá theo bác sĩ" }).getByRole("row").filter({ hasText: fixture.doctorName });
    await row.getByRole("button", { name: "Xem đánh giá", exact: true }).click();
    await page.waitForURL(url => url.searchParams.get("doctorId") === String(fixture.doctorId));
    await page.getByRole("button", { name: "Ẩn đánh giá", exact: true }).first().waitFor();
    const beforeRatings = await api("/reviews/admin/statistics?doctorId=" + fixture.doctorId, { access: admin.accessToken });
    const visibility = page.waitForResponse(response => response.request().method() === "PATCH" && response.url().endsWith("/visibility"));
    await page.getByRole("button", { name: "Ẩn đánh giá", exact: true }).first().click();
    const hidden = (await (await visibility).json()).result;
    const hiddenCard = page.getByRole("heading", { name: hidden.doctorName + " · Lịch hẹn #" + hidden.appointmentId, exact: true }).locator("../..");
    await hiddenCard.getByRole("button", { name: "Hiện đánh giá", exact: true }).waitFor();
    const visibleCard = page.getByText("Đang công khai", { exact: true }).locator("..");
    await visibleCard.getByText(String(beforeRatings.totals.visibleReviews - 1), { exact: true }).waitFor();
    check(true, "Moderation refreshes public counts and doctor rating summaries in the UI");
    await hiddenCard.getByRole("button", { name: "Hiện đánh giá", exact: true }).click();
    await visibleCard.getByText(String(beforeRatings.totals.visibleReviews), { exact: true }).waitFor();
    check(true, "Restoring a review restores its public aggregate");
    await page.getByRole("navigation", { name: "Phân trang nhận xét" }).getByLabel("Go to page 2").click();
    await page.getByRole("button", { name: "Ẩn đánh giá", exact: true }).first().waitFor();
    check(new URL(page.url()).searchParams.get("doctorId") === String(fixture.doctorId), "Review pagination preserves its selected doctor filter");
    await page.screenshot({ path: ".tmp/admin-completion/reviews-desktop.png", fullPage: true });

    let failReads = true;
    await page.route("**/api/users?**", route => failReads ? route.abort() : route.continue());
    await page.goto(site + "/internal/users", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Thử lại", exact: true }).waitFor();
    failReads = false;
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await page.getByRole("table", { name: "Danh sách tài khoản" }).waitFor();
    check(true, "Account read errors recover through a real API retry");
    await page.unroute("**/api/users?**");
    for (const width of [768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Account page bounds at " + width);
        await page.goto(site + "/internal/reviews", { waitUntil: "domcontentloaded" });
        await page.getByRole("table", { name: "Điểm đánh giá theo bác sĩ" }).waitFor();
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Review page bounds at " + width);
        if (width === 390) await page.screenshot({ path: ".tmp/admin-completion/reviews-mobile.png", fullPage: true });
        await page.goto(site + "/internal/users", { waitUntil: "domcontentloaded" });
        await page.getByRole("table", { name: "Danh sách tài khoản" }).waitFor();
    }
    check(errors.length === 0, "No browser runtime errors in completed Admin workflows");
    console.log("ADMIN_COMPLETION_UI_SUCCESS checks=" + checks);
} catch (error) {
    if (page) await page.screenshot({ path: ".tmp/admin-completion/failure.png", fullPage: true }).catch(() => {});
    let message = error?.stack || String(error);
    if (fixture?.password) message = message.replaceAll(fixture.password, "[redacted]");
    console.error(message.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted token]"));
    process.exitCode = 1;
} finally {
    await browser?.close();
    vite?.kill();
    if (host.exitCode === null) host.stdin.end('{"command":"stop"}\n');
    await Promise.race([finished, delay(15000, undefined, { ref: false }).then(() => host.kill())]);
}
