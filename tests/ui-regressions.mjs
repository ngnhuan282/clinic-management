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

async function contextFor(patient = false, role = "Patient") {
    const sessionUser = role === "Patient" ? user : { ...user, role, fullName: "Quản trị kiểm thử",
        permissions: ["billing.view", "billing.create", "billing.recordPayment"] };
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    if (patient) await context.addInitScript(({ user, site }) => {
        if (location.origin !== site) return;
        sessionStorage.setItem("accessToken", "ui-regression-token");
        sessionStorage.setItem("user", JSON.stringify(user));
    }, { user: sessionUser, site });
    await context.route("**/*", async route => {
        const request = route.request();
        const url = new URL(request.url());
        const path = url.pathname.toLowerCase();
        if (!path.startsWith("/api/")) {
            if (url.origin === site) return route.continue();
            return route.abort();
        }
        const json = (result, status = 200, raw = false) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(raw ? result : { code: 1000, result }) });
        const specializations = [
            { specializationId: 1, code: "NỘI-TQ", name: "Nội tổng quát chuyên sâu", description: "Khám và theo dõi bệnh lý nội khoa.", departmentId: 1, departmentName: doctor.departmentName },
        ];
        if (path === "/api/auth/me") return json(sessionUser);
        if (path === "/api/auth/refresh") return json({ ...sessionUser, accessToken: "ui-regression-token" });
        if (path === "/api/notifications") return json({ ...paginate([]), unreadCount: 0 });
        const receipt = { receiptNumber: "PT-KIEM-THU", type: "Payment", method: "Cash", amount: 25000, paidAt: "2026-11-20T08:30:00Z" };
        const invoice = { source: "Invoice", id: 19, billingStage: "Medicine", status: "PartiallyPaid", patientId: 123,
            patientName: user.fullName, appointmentId: 3, createdAt: "2026-11-20T08:00:00Z", totalAmount: 100000,
            insuranceAmount: 0, patientAmount: 100000, paidAmount: 25000, remainingAmount: 75000,
            details: [{ name: "Thuốc kiểm thử", quantity: 2, unitPrice: 50000, total: 100000 }], payments: [receipt] };
        if (path === "/api/patients/me/invoices") return json(paginate([invoice]));
        if (path === "/api/admin-dashboard/summary") return json({ appointments: {}, inventory: {}, revenue: {} }, 200, true);
        if (path === "/api/admin-dashboard/appointments") {
            const included = url.searchParams.get("from") === "2026-10-01" && url.searchParams.get("to") === "2026-10-15";
            const summary = { totalAppointments: included ? 4 : 0, completedCount: included ? 3 : 0, inProgressCount: 0, cancelledCount: 0 };
            return json({ summary, dailyAppointments: included ? [{ date: "2026-10-11", ...summary }] : [] }, 200, true);
        }
        if (path === "/api/admin-dashboard/revenue") {
            const included = url.searchParams.get("from") === "2026-10-01" && url.searchParams.get("to") === "2026-10-15";
            const summary = { totalRevenue: included ? 150000 : 0, patientPayments: included ? 150000 : 0, insurancePayments: 0 };
            return json({ summary, dailyRevenue: included ? [{ date: "2026-10-11", ...summary }] : [] }, 200, true);
        }
        if (path === "/api/invoices/pending") return json([], 200, true);
        if (path === "/api/invoices/history") return json([{ ...invoice, invoiceType: "Standard", pendingStockReviewId: 29 }], 200, true);
        if (path === "/api/invoices/adjustment/preview") {
            assert.equal(request.postDataJSON().prescriptionStockReviewId, 29);
            return json({ totalChange: -80000, insuranceChange: 0, patientChange: -80000, patientAmount: 20000,
                netPaid: 25000, refundAmount: 5000, remainingAmount: 0 }, 200, true);
        }
        if (path === "/api/invoices/adjustment") {
            assert.equal(request.postDataJSON().expectedRefundAmount, 5000);
            assert.equal(request.postDataJSON().adjustmentPatientAmount, -80000);
            return json({ id: 20 }, 200, true);
        }
        if (path === "/api/appointments/departments") return json([{ departmentId: 1, code: "NOI", name: doctor.departmentName, description: "Thông tin chuyên khoa Nội tổng quát.", specializations }]);
        if (path === "/api/specializations/public") return json(specializations);
        if (path === "/api/public/clinic-settings") return json({
            clinicName: "Clinic Management System",
            tagline: "Hệ thống quản lý phòng khám đa khoa",
            description: "Kết nối người bệnh với các chuyên khoa và bác sĩ uy tín.",
            phone: "1900 6868",
            email: "contact@medclinic-system.vn",
            workingHours: "07:30 – 20:00, Thứ Hai – Chủ Nhật",
            locations: [{ name: "Cơ sở TP. Hồ Chí Minh", address: "128 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh" }],
            defaultExaminationFee: 150000,
            patientBookFee: 10000,
            defaultSlotDurationMinutes: 30,
        });
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
    await open(page, "/specialties");
    await page.getByText("Nội tổng quát chuyên sâu", { exact: false }).first().waitFor();
    await page.getByText("Khoa: Nội tổng quát", { exact: true }).waitFor();
    await open(page, "/specialties/1");
    await page.getByRole("heading", { name: /Chuyên khoa trực thuộc/ }).waitFor();
    await page.getByText("Nội tổng quát chuyên sâu", { exact: true }).waitFor();
    console.log("PASS Refreshed public routes and department-specialization catalog render from the production build");
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
    await patient.getByRole("button", { name: /mở menu tài khoản/i }).click();
    await patient.getByRole("menuitem", { name: "Hóa đơn của tôi" }).click();
    await patient.getByRole("heading", { name: "Hóa đơn của tôi" }).waitFor();
    await patient.getByRole("button", { name: /Thuốc · #19/ }).click();
    await patient.getByText(/PT-KIEM-THU/).waitFor();
    await patient.getByText("Còn phải thanh toán", { exact: true }).waitFor();
    console.log("PASS Patient account menu opens invoice balances and recorded receipts");

    const staff = await contextFor(true, "Admin");
    const admin = await staff.newPage();
    await open(admin, "/internal/dashboard");
    await admin.getByText("Không có lượt khám hoặc chứng từ trong kỳ này.").waitFor();
    await admin.getByLabel(/Từ ngày/).fill("2026-10-01");
    await admin.getByLabel(/Đến ngày/).fill("2026-10-15");
    await admin.getByRole("button", { name: "Xem báo cáo" }).click();
    await admin.getByRole("table", { name: "Doanh thu và lượt khám theo ngày" }).getByRole("rowheader", { name: "11/10/26" }).waitFor();
    await admin.getByLabel(/Đến ngày/).fill("2026-09-01");
    assert(await admin.getByRole("button", { name: "Xem báo cáo" }).isDisabled());
    console.log("PASS Admin can query an inclusive reporting period and invalid periods are blocked");

    await admin.goto(site + "/internal/cashier/billing", { waitUntil: "networkidle" });
    await admin.getByRole("tab", { name: /Tra Cứu Hóa Đơn/ }).click();
    await admin.getByRole("button", { name: "Đối soát đơn thuốc" }).click();
    await admin.getByLabel("Lý do điều chỉnh / hoàn tiền").fill("Hoàn phần chênh lệch");
    await admin.getByRole("button", { name: "Xem số dư mới" }).click();
    await admin.getByText("Cần hoàn tại quầy", { exact: true }).waitFor();
    await admin.getByRole("button", { name: "Xác nhận đã hoàn tiền" }).click();
    await admin.getByText("Đã lưu chứng từ điều chỉnh.", { exact: true }).waitFor();
    console.log("PASS Cashier previews the exact prescription refund and confirms it separately");

    for (const width of [1440, 1360, 1359, 1280, 1200, 390, 320]) {
        await patient.setViewportSize({ width, height: 900 });
        for (const path of ["/profile", "/my-appointments", "/lab-results", "/my-reviews", "/invoices"]) {
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
