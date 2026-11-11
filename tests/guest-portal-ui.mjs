// Uses a disposable LocalDB fixture. No application database or external form is modified.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const host = spawn("dotnet", ["run", "--no-build", "--no-restore", "-c", "Release", "--project", "tests/UiRefreshVerification"], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
const finished = new Promise(resolve => host.once("exit", resolve));
let vite, browser, fixture;
let fixtureError = "";
host.stderr.on("data", chunk => { fixtureError = (fixtureError + chunk).slice(-6000); });
const pageErrors = [];
const site = "http://127.0.0.1:5190";
let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; console.log("PASS " + label); };
try {
    fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("Fixture startup timed out")), 180000);
        host.stdout.on("data", chunk => {
            pending += chunk;
            const lines = pending.split(/\r?\n/); pending = lines.pop();
            for (const line of lines) {
                if (line.startsWith("UI_FIXTURE:")) { clearTimeout(timeout); resolve(JSON.parse(line.slice(11))); }
                else if (line.startsWith("PASS ") || line.startsWith("UI_FIXTURE_CLEANUP:")) console.log(line);
            }
        });
        host.once("error", error => { clearTimeout(timeout); reject(error); });
        host.once("exit", code => { clearTimeout(timeout); reject(new Error("Fixture stopped before readiness: " + code + "\n" + fixtureError)); });
    });
    const apiBase = fixture.baseUrl.replace(/\/$/, "") + "/api";
    const api = async (path, { method = "GET", payload, access, expected = 200 } = {}) => {
        const response = await fetch(apiBase + path, { method, headers: { "Content-Type": "application/json", ...(access ? { Authorization: "Bearer " + access } : {}) }, body: payload ? JSON.stringify(payload) : undefined });
        assert.equal(response.status, expected, method + " " + path);
        if (expected !== 200) return null;
        return (await response.json()).result;
    };
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5190", "--strictPort"], {
        cwd: "frontend/clinic-management-client", windowsHide: true, stdio: "ignore",
        env: { ...process.env, VITE_API_BASE_URL: apiBase, VITE_SIGNALR_HUB_URL: fixture.baseUrl.replace(/\/$/, "") + "/hubs/notification" },
    });
    let ready = false;
    for (let attempt = 0; attempt < 150; attempt++) { try { ready = (await fetch(site)).ok; } catch {} if (ready) break; await delay(200); }
    assert.ok(ready, "Vite starts");
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    await page.route("https://fonts.gstatic.com/**", route => route.abort());
    await mkdir(".tmp/guest-portal", { recursive: true });
    const open = async (path, title) => {
        await page.goto(site + path, { waitUntil: "domcontentloaded" });
        await page.getByRole("heading", { level: 1, name: title }).waitFor();
        check(new URL(page.url()).pathname === path.split("?")[0], "Anonymous route " + path.split("?")[0]);
    };
    const bounds = async label => check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), label);
    await open("/", /Chăm sóc sức khỏe/);
    await page.getByRole("heading", { name: fixture.doctorName, exact: false }).first().waitFor();
    await bounds("Desktop homepage stays within viewport");
    await page.screenshot({ path: ".tmp/guest-portal/home-desktop.png", fullPage: true });
    for (const [path, title] of [["/about", "Về phòng khám"], ["/specialties", "Chuyên khoa"], ["/services", "Dịch vụ y tế"], ["/pricing", "Bảng giá dịch vụ"], ["/health-guide", "Cẩm nang & hướng dẫn khách hàng"], ["/contact", "Liên hệ & cơ sở phòng khám"], ["/privacy", "Thông tin cá nhân khi đăng ký khám"], ["/health-guide/dat-lich-kham", "Đặt lịch khám trực tuyến như thế nào?"]]) {
        await open(path, title); await bounds("Desktop bounds " + path);
    }
    await open("/specialties", "Chuyên khoa");
    await page.getByLabel("Tìm chuyên khoa").fill("noi tong quat");
    await page.getByRole("heading", { level: 2, name: "Nội tổng quát", exact: true }).waitFor();
    check(true, "Unaccented specialty searches find accented database names");
    await open("/specialties/2", "Nhi khoa");
    await page.getByRole("heading", { name: "Giới thiệu chuyên khoa", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Nhóm vấn đề thường gặp", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Chuẩn bị trước khi đến khám", exact: true }).waitFor();
    check(await page.getByRole("link", { name: "UMC Clinic", exact: true }).getAttribute("href") === "https://umcclinic.com.vn/nhi-khoa", "Specialty details include substantive content and a direct source link");
    const catalog = await api("/appointments/departments");
    check(catalog.some(item => item.name === "Nội tổng quát" && item.description.length > 150), "Public API returns accented names and expanded descriptions from the database");
    await open("/specialties/" + fixture.departmentId, fixture.departmentName);
    await page.getByRole("link", { name: "Xem bác sĩ chuyên khoa" }).click();
    await page.getByRole("heading", { name: "Tra cứu bác sĩ" }).waitFor();
    check(new URL(page.url()).searchParams.get("departmentId") === String(fixture.departmentId), "Specialty link preserves doctor filter");
    await page.getByRole("link", { name: "Hồ sơ bác sĩ" }).first().waitFor();
    await open("/doctors/" + fixture.doctorId, new RegExp(fixture.doctorName));
    await page.getByLabel("Ngày khám").fill(fixture.bookingDate);
    await page.getByText("Giờ Việt Nam (UTC+7).").waitFor();
    await page.getByRole("link", { name: "Đặt khám với bác sĩ" }).click();
    await page.getByRole("heading", { name: "Đăng ký khám trực tuyến" }).waitFor();
    await page.getByLabel("Họ và tên", { exact: false }).waitFor();
    await page.getByRole("group", { name: "Giờ khám còn trống" }).waitFor();
    check(await page.getByLabel("Ngày khám", { exact: false }).inputValue() === fixture.bookingDate, "Doctor profile preserves selected booking date");
    const available = await api("/appointments/available-slots?doctorId=" + fixture.doctorId + "&date=" + fixture.bookingDate);
    const slot = available.find(item => item.isAvailable);
    assert.ok(slot, "Fixture has an available slot");
    await page.getByRole("group", { name: "Giờ khám còn trống" }).getByRole("button", { name: slot.startTime.slice(0, 5), exact: true }).click();
    await page.getByRole("button", { name: "Kiểm tra đăng ký" }).click();
    check(await page.getByText("Vui lòng nhập họ tên, tối đa 100 ký tự.").isVisible(), "Guest form validates required patient details");
    await page.getByLabel("Họ và tên", { exact: false }).fill("Khách kiểm thử chưa đăng nhập");
    await page.getByLabel("Số điện thoại", { exact: false }).fill("123");
    await page.getByLabel("Lý do khám", { exact: false }).fill("Đăng ký khám từ cổng khách");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Kiểm tra đăng ký" }).click();
    check(await page.getByText("Nhập số điện thoại 10 chữ số hoặc dạng +84.").isVisible(), "Guest form rejects an invalid phone number");
    await page.getByLabel("Số điện thoại", { exact: false }).fill("0901234567");
    await page.getByRole("button", { name: "Kiểm tra đăng ký" }).click();
    await page.getByRole("dialog", { name: "Xác nhận thông tin đăng ký" }).waitFor();
    const submitted = page.waitForResponse(response => response.url().endsWith("/appointments/guest") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Gửi đăng ký khám" }).click();
    const response = await submitted;
    assert.equal(response.status(), 200);
    const receipt = (await response.json()).result;
    await page.getByRole("heading", { name: "Đã tiếp nhận đăng ký khám" }).waitFor();
    await page.waitForFunction(() => window.scrollY === 0);
    const receiptHeading = await page.getByRole("heading", { name: "Đã tiếp nhận đăng ký khám" }).boundingBox();
    const header = await page.locator("header").boundingBox();
    check(receiptHeading.y >= header.y + header.height, "Receipt heading remains visible below the sticky header");
    check(receipt.status === "Pending" && receipt.appointmentId > 0, "Anonymous booking persists and returns a Pending receipt");
    check(!("patientPhone" in receipt) && !("reason" in receipt) && !("patientProfileId" in receipt), "Guest receipt contains no private patient profile fields");
    await page.screenshot({ path: ".tmp/guest-portal/booking-receipt.png", fullPage: true });
    const admin = await api("/auth/login", { method: "POST", payload: { username: fixture.usernames.admin, password: fixture.password } });
    const appointments = await api("/appointments?doctorId=" + fixture.doctorId + "&dateFrom=" + fixture.bookingDate + "&dateTo=" + fixture.bookingDate + "&pageSize=100", { access: admin.accessToken });
    check(appointments.items.some(item => item.appointmentId === receipt.appointmentId && item.patientName === "Khách kiểm thử chưa đăng nhập"), "Staff appointment list contains the submitted guest registration");
    await api("/appointments/" + receipt.appointmentId + "/confirm", { method: "PATCH", access: admin.accessToken });
    check(true, "Staff can confirm a guest appointment using the existing workflow");
    const payload = { doctorId: fixture.doctorId, appointmentDate: fixture.bookingDate, startTime: slot.startTime, patientName: "Khách kiểm thử", patientPhone: "0901234567", reason: "Khám" };
    await api("/appointments/guest", { method: "POST", payload, expected: 409 });
    await api("/appointments/guest", { method: "POST", payload: { ...payload, appointmentDate: "2020-01-01" }, expected: 400 });
    await api("/appointments/guest", { method: "POST", payload: { ...payload, patientPhone: "invalid-phone" }, expected: 400 });
    await api("/appointments/guest", { method: "POST", payload: { ...payload, doctorId: 2147483647 }, expected: 404 });
    await api("/appointments/guest", { method: "POST", payload, expected: 429 });
    check(true, "Guest API rejects duplicate slots, past dates, invalid details, missing doctors and excess requests");
    for (const path of ["/appointments/mine", "/patients/me", "/LabTests", "/LabTestTypes"]) await api(path, { expected: 401 });
    await api("/appointments", { method: "POST", payload, expected: 401 });
    await api("/appointments/" + receipt.appointmentId + "/confirm", { method: "PATCH", expected: 401 });
    check(true, "Anonymous users cannot read patient records or confirm appointments");
    const services = await api("/public/services");
    check(services.length > 0 && services.every(item => Object.keys(item).sort().join() === ["description", "id", "name", "price"].join()), "Public service catalog exposes only service and price fields");
    const service = services[0];
    await api("/LabTestTypes/" + service.id, { method: "PUT", access: admin.accessToken, payload: { name: service.name, description: service.description, price: service.price, isActive: false }, expected: 204 });
    check(!(await api("/public/services")).some(item => item.id === service.id), "Inactive services are absent from public prices");
    await api("/LabTestTypes/" + service.id, { method: "PUT", access: admin.accessToken, payload: { name: service.name, description: service.description, price: service.price, isActive: true }, expected: 204 });
    const profile = await api("/doctors/public/" + fixture.doctorId);
    check(profile.doctorId === fixture.doctorId && !("userId" in profile), "Public doctor profile excludes linked account information");
    await api("/doctors/public/2147483647", { expected: 404 });

    await open("/services", "Dịch vụ y tế");
    await page.getByLabel("Tìm dịch vụ").fill("khong-co-dich-vu-nay-xyz");
    await page.getByText("Không tìm thấy dịch vụ phù hợp.").waitFor();
    check(true, "Public service search has a working empty state");
    let failReads = true;
    await page.route("**/api/public/services", route => failReads && route.request().method() === "GET" ? route.abort() : route.continue());
    await open("/pricing", "Bảng giá dịch vụ");
    await page.getByRole("button", { name: "Thử lại" }).waitFor();
    failReads = false;
    await page.getByRole("button", { name: "Thử lại" }).click();
    await page.getByRole("table", { name: "Bảng giá dịch vụ xét nghiệm" }).waitFor();
    check(true, "Error retry reloads the real public pricing API");
    await page.unroute("**/api/public/services");
    await open("/doctors?departmentId=" + fixture.departmentId, "Tra cứu bác sĩ");
    await page.getByRole("link", { name: "Hồ sơ bác sĩ" }).first().waitFor();
    await page.getByLabel("Tên bác sĩ").fill("khong-co-bac-si-xyz");
    await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
    await page.getByText("Không tìm thấy bác sĩ phù hợp với bộ lọc hiện tại.").waitFor();
    await page.goBack();
    await page.getByRole("link", { name: "Hồ sơ bác sĩ" }).first().waitFor();
    check(await page.getByLabel("Tên bác sĩ").inputValue() === "", "Browser Back restores doctor filters and results");
    for (const width of [1360, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await open("/", /Chăm sóc sức khỏe/); await bounds("Homepage bounds at " + width);
        if (width === 390) await page.screenshot({ path: ".tmp/guest-portal/home-mobile.png", fullPage: true });
        await open("/booking?departmentId=" + fixture.departmentId + "&doctorId=" + fixture.doctorId + "&date=" + fixture.bookingDate, "Đăng ký khám trực tuyến");
        await page.getByRole("group", { name: "Giờ khám còn trống" }).waitFor(); await bounds("Guest booking bounds at " + width);
    }
    await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
    await page.getByRole("navigation", { name: "Điều hướng trên điện thoại" }).getByRole("link", { name: "Liên hệ", exact: true }).click();
    await page.getByRole("heading", { name: "Liên hệ & cơ sở phòng khám" }).waitFor();
    await page.getByRole("button", { name: "Đóng menu" }).waitFor({ state: "hidden" });
    check(true, "Mobile menu closes after navigation");
    await bounds("Mobile contact page bounds");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await open("/booking?departmentId=" + fixture.departmentId + "&doctorId=" + fixture.doctorId + "&date=" + fixture.bookingDate, "Đăng ký khám trực tuyến");
    await page.getByRole("link", { name: "Đăng nhập", exact: true }).click();
    await page.getByLabel("Tên đăng nhập", { exact: true }).fill(fixture.usernames.patient);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(fixture.password);
    const memberSlots = page.waitForResponse(response => response.url().includes("/appointments/available-slots") && response.request().method() === "GET");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    const memberAvailability = await memberSlots;
    await page.getByRole("link", { name: "Xem lịch hẹn của tôi" }).waitFor();
    const memberQuery = new URL(memberAvailability.url()).searchParams;
    check(memberQuery.get("doctorId") === String(fixture.doctorId) && memberQuery.get("date") === fixture.bookingDate, "Sign-in returns to member booking with the selected doctor and date");
    const patient = await api("/auth/login", { method: "POST", payload: { username: fixture.usernames.patient, password: fixture.password } });
    const own = await api("/appointments/mine?pageSize=100", { access: patient.accessToken });
    check(own.items.every(item => item.appointmentId !== receipt.appointmentId), "Guest registration is not silently attached to an unrelated signed-in account");
    check(pageErrors.length === 0, "No browser runtime errors");
    console.log("GUEST_PORTAL_SUCCESS checks=" + checks);
} catch (error) {
    const failedPage = browser?.contexts()[0]?.pages()[0];
    if (failedPage) await failedPage.screenshot({ path: ".tmp/guest-portal/failure.png", fullPage: true }).catch(() => {});
    let message = error?.stack || String(error);
    if (fixture?.password) message = message.replaceAll(fixture.password, "[redacted]");
    console.error(message.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted token]"));
    process.exitCode = 1;
} finally {
    await browser?.close();
    vite?.kill();
    if (!host.killed && host.exitCode === null) host.stdin.end('{"command":"stop"}\n');
    await Promise.race([finished, delay(15000).then(() => host.kill())]);
}
