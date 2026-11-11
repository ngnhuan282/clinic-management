// Run after `npm run build` in the frontend. API responses are isolated browser fixtures.
// Set PLAYWRIGHT_MODULE to an installed Playwright ESM module when necessary.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = resolve("frontend/clinic-management-client/dist");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };
const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = resolve(root, "." + pathname);
    if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    try {
        const target = extname(pathname) ? file : resolve(root, "index.html");
        const body = await readFile(target);
        response.writeHead(200, { "Content-Type": types[extname(target)] || "application/octet-stream" }).end(body);
    } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const site = `http://127.0.0.1:${server.address().port}`;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const doctor = { doctorId: 1, fullName: "Nguyễn Văn Kiểm Thử", title: "BS", departmentId: 1, departmentName: "Nội tổng quát", experienceYears: 8, biography: "Giới thiệu chuyên môn của bác sĩ.", rooms: [{ roomId: 1, roomCode: "P101", roomName: "Phòng khám Nội" }] };
const user = { userId: 123, username: "ui-regression", fullName: "Bệnh nhân kiểm thử", role: "Patient", permissions: [], phone: "0901234567", email: "ui@example.test" };
const paginate = items => ({ items, pageNumber: 1, pageSize: 10, totalItems: items.length, totalPages: items.length ? 1 : 0 });
const errors = [];
const unexpected = [];
let profile = null, createCalls = 0, failProfileCreate = true, failLab = true, browser;
const output = ".tmp/ui-regressions";
await mkdir(output, { recursive: true });

async function contextFor(patient = false) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    if (patient) await context.addInitScript(({ user, site }) => {
        if (location.origin !== site) return;
        sessionStorage.setItem("accessToken", "ui-regression-token");
        sessionStorage.setItem("user", JSON.stringify(user));
    }, { user, site });
    await context.route("**/*", async route => {
        const request = route.request();
        const url = new URL(request.url());
        const path = url.pathname.toLowerCase();
        if (!path.startsWith("/api/")) {
            if (url.origin === site) return route.continue();
            return route.abort();
        }
        const json = (result, status = 200, raw = false) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(raw ? result : { code: 1000, result }) });
        if (path === "/api/auth/me") return json(user);
        if (path === "/api/auth/refresh") return json({ ...user, accessToken: "ui-regression-token" });
        if (path === "/api/notifications") return json({ ...paginate([]), unreadCount: 0 });
        if (path === "/api/appointments/departments") return json([{ departmentId: 1, name: doctor.departmentName, description: "Thông tin chuyên khoa Nội tổng quát." }]);
        if (path === "/api/rooms/public") return json(doctor.rooms);
        if (path === "/api/doctors/public/1") return json(doctor);
        if (path === "/api/doctors/public") return json(paginate(url.searchParams.get("fullName") === "absent" ? [] : [doctor]));
        if (path === "/api/doctors") return json([doctor]);
        if (path === "/api/appointments/available-slots") return json([{ startTime: "08:00:00", endTime: "08:30:00", isAvailable: true }]);
        if (path === "/api/public/services") return json([{ id: 1, name: "Xét nghiệm kiểm thử", description: "Thông tin xét nghiệm", price: 100000 }]);
        if (path === "/api/reviews" || path === "/api/reviews/my-appointments" || path === "/api/appointments/mine") return json(paginate([]));
        if (path === "/api/patients/me") {
            if (request.method() === "POST") {
                createCalls++;
                if (failProfileCreate) return json({ code: 4002 }, 409, true);
                profile = { ...request.postDataJSON(), patientId: 456 };
                return json(profile);
            }
            return profile ? json(profile) : json({ code: 4001 }, 404, true);
        }
        const lab = { id: 7, labTestTypeName: "Xét nghiệm kiểm thử", status: "Completed", clinicalDiagnosis: "Kiểm tra định kỳ", result: { resultSummary: "Kết quả kiểm thử bình thường", note: "Ghi chú kiểm thử", performedAt: "2026-11-11T03:00:00Z" } };
        if (path === "/api/labtests") return json([lab], 200, true);
        if (path === "/api/labtests/7") return failLab ? json({ code: 9999 }, 500, true) : json(lab, 200, true);
        unexpected.push(request.method() + " " + path);
        return json({ code: 9999 }, 500, true);
    });
    context.on("page", page => {
        page.on("pageerror", error => errors.push(error.message));
        page.setDefaultTimeout(15000);
    });
    return context;
}

async function open(page, path) {
    const response = await page.goto(site + path, { waitUntil: "networkidle" });
    assert(response?.ok(), "Built application is reachable: " + path);
    await page.locator("h1").waitFor();
}

async function bounds(page, label) {
    await page.getByRole("button", { name: "Mở menu điều hướng" }).waitFor({ state: page.viewportSize().width < 1360 ? "visible" : "hidden" });
    const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        elements: [...document.querySelectorAll("body *")].filter(element => {
            const box = element.getBoundingClientRect();
            return box.width && box.right > innerWidth + 1 && getComputedStyle(element).position !== "absolute";
        }).slice(0, 5).map(element => element.tagName + ":" + element.textContent.slice(0, 50)) }));
    assert(overflow.scrollWidth <= overflow.width + 1, label + " " + JSON.stringify(overflow));
}

try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const guest = await contextFor();
    const page = await guest.newPage();
    for (const path of ["/", "/about", "/specialties", "/specialties/1", "/services", "/pricing", "/health-guide", "/health-guide/dat-lich-kham", "/contact", "/privacy", "/reviews", "/login", "/register", "/doctors/1"]) {
        await open(page, path);
        await bounds(page, "Desktop " + path);
    }
    console.log("PASS Refreshed public routes render from the production build");
    await open(page, "/doctors");
    assert.equal(await page.locator("form").count(), 1, "Doctor search has a single form");
    await page.getByLabel("Tên bác sĩ", { exact: true }).fill("absent");
    await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
    await page.getByText("Không tìm thấy bác sĩ phù hợp", { exact: true }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("fullName"), "absent");
    await page.getByRole("button", { name: "Xóa lọc", exact: true }).click();
    await page.getByRole("heading", { name: doctor.fullName, exact: false }).waitFor();
    await page.goBack();
    assert.equal(await page.getByLabel("Tên bác sĩ", { exact: true }).inputValue(), "absent");
    console.log("PASS Doctor search submit, empty state, reset and browser Back");
    for (const width of [1440, 1360, 1359, 1280, 1200, 1024, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        for (const path of ["/", "/doctors", "/doctors/1", "/booking?departmentId=1&doctorId=1"]) {
            await open(page, path);
            await bounds(page, `Guest ${width}px ${path}`);
        }
    }
    await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
    await page.getByRole("navigation", { name: "Điều hướng trên điện thoại" }).getByRole("link", { name: "Liên hệ", exact: true }).click();
    await page.getByRole("heading", { level: 1, name: /Liên hệ/ }).waitFor();
    await page.getByRole("button", { name: "Đóng menu" }).waitFor({ state: "hidden" });
    await page.screenshot({ path: output + "/guest-mobile.png", fullPage: true });
    console.log("PASS Guest desktop/mobile bounds and mobile navigation");

    const member = await contextFor(true);
    const patient = await member.newPage();
    await open(patient, "/profile");
    await patient.getByLabel("Họ và tên", { exact: false }).fill("Bệnh nhân tạo hồ sơ");
    await patient.getByLabel("Số điện thoại", { exact: false }).fill("0901234567");
    await patient.getByRole("button", { name: "Tạo hồ sơ khám bệnh", exact: true }).click();
    await patient.getByText(/Thông tin này khớp với một hồ sơ bệnh nhân đã có sẵn/).waitFor();
    assert.equal(await patient.getByLabel("Họ và tên", { exact: false }).inputValue(), "Bệnh nhân tạo hồ sơ");
    failProfileCreate = false;
    await patient.getByRole("button", { name: "Tạo hồ sơ khám bệnh", exact: true }).click();
    await patient.getByRole("button", { name: "Lưu thay đổi hồ sơ", exact: true }).waitFor();
    assert.equal(createCalls, 2, "Failed and successful submission each send a single request");
    await patient.reload();
    await patient.getByRole("button", { name: "Lưu thay đổi hồ sơ", exact: true }).waitFor();
    assert.equal(await patient.getByLabel("Họ và tên", { exact: false }).inputValue(), "Bệnh nhân tạo hồ sơ");
    console.log("PASS Missing patient profile can be created, handles failure and reloads saved data");
    await open(patient, "/lab-results?labTestId=7");
    const dialog = patient.getByRole("dialog", { name: "Chi tiết xét nghiệm" });
    await dialog.getByRole("button", { name: "Thử lại" }).waitFor();
    failLab = false;
    await dialog.getByRole("button", { name: "Thử lại" }).click();
    await dialog.getByText("Kết quả kiểm thử bình thường", { exact: true }).waitFor();
    await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
    assert.equal(new URL(patient.url()).searchParams.has("labTestId"), false);
    console.log("PASS Laboratory detail loads, retries and closes without a runtime error");
    await patient.goto(`${site}/booking?departmentId=1&doctorId=1&date=${today}`, { waitUntil: "networkidle" });
    await patient.getByRole("button", { name: /08:00/ }).waitFor();
    console.log("PASS Member booking restores doctor and date from the profile link");
    for (const width of [1440, 1360, 1359, 1280, 1200, 390, 320]) {
        await patient.setViewportSize({ width, height: 900 });
        for (const path of ["/profile", "/my-appointments", "/lab-results", "/my-reviews"]) {
            await open(patient, path);
            await bounds(patient, `Patient ${width}px ${path}`);
        }
    }
    await patient.screenshot({ path: output + "/patient-mobile.png", fullPage: true });
    assert.deepEqual(errors, [], "No browser runtime errors");
    assert.deepEqual(unexpected, [], "Every API request is an isolated known fixture");
    console.log("UI_REGRESSIONS_SUCCESS production rendering, interactions, responsive bounds; API responses mocked");
} catch (error) {
    console.error(error);
    console.error("Browser errors:", errors);
    for (const [index, context] of (browser?.contexts() || []).entries()) {
        await context.pages()[0]?.screenshot({ path: `${output}/failure-${index}.png`, fullPage: true }).catch(() => {});
    }
    process.exitCode = 1;
} finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
}
