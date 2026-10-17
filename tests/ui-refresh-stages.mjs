import assert from "node:assert/strict";

export function createStages(helpers, context) {
    const { login: openSession, visit, probe, authChecks, settled, apiFromPage, choose, reset, refresh, screen, screens, checkPagination } = helpers;
    const fixture = context.fixture;
    let page = context.page;
    const login = async (...args) => { await openSession(...args); page = context.page; };
    const requiredLabel = label => new RegExp("^" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\*?$");
    const fillSearch = async value => {
        const labelled = page.getByRole("textbox", { name: /Tìm|Tra cứu/i });
        const placeholder = page.getByPlaceholder(/Tìm|Tra cứu|Tên, mô tả/i);
        await (await labelled.count() ? labelled.last() : placeholder.last()).fill(value);
        await settled();
    };

    async function doctorSchedules() {
        await login();
        await visit("/internal/doctor-schedules", /Lịch làm việc bác sĩ/);
        await probe("/doctor-schedules", 200);
        await authChecks(`/doctor-schedules/${fixture.scheduleIds[0]}`, fixture.usernames.patient);
        await page.getByLabel("Tuần bắt đầu").fill(fixture.today);
        await settled();
        const initial = await apiFromPage("get", `/doctor-schedules?weekStart=${fixture.today}`);
        assert.equal(initial.status, 200);
        const rows = initial.data.result ?? initial.data;
        assert(rows.length > 1, "Fixture has multiple doctor schedules to render");
        const cards = page.getByRole("button", { name: /^Xem ca / });
        assert.equal(await cards.count(), rows.length, "Calendar renders every shift, including doctors sharing a day and shift");
        await cards.first().click();
        await page.getByRole("dialog", { name: "Chi tiết ca làm việc", exact: true }).waitFor();
        assert(await page.getByRole("table", { name: "Khung giờ của ca làm việc", exact: true }).locator("tbody tr").count(), "Shift dialog renders real timeSlots from list DTO");
        await page.getByRole("dialog").getByRole("button", { name: "Đóng", exact: true }).click();
        await choose("Chuyên khoa", fixture.specializationName);
        await reset();
        await refresh();
        await screens("DoctorSchedules");
        await page.getByRole("button", { name: "Thêm lịch trực", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await choose("Chuyên khoa", fixture.specializationName, dialog);
        await choose("Bác sĩ", fixture.doctorName, dialog);
        await choose("Phòng khám", fixture.roomName, dialog);
        await dialog.getByLabel(requiredLabel("Ngày làm việc")).fill(fixture.createScheduleDate);
        await choose("Ca làm việc", /Sáng/, dialog);
        await dialog.getByLabel(requiredLabel("Giờ bắt đầu")).fill("08:00");
        await dialog.getByLabel(requiredLabel("Giờ kết thúc")).fill("09:00");
        await screen("DoctorSchedules-dialog-desktop");
        await screen("DoctorSchedules-dialog-mobile", true);
        await page.setViewportSize({ width: 1440, height: 1000 });
        const created = page.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname === "/api/doctor-schedules");
        await dialog.getByRole("button", { name: "Lưu lịch", exact: true }).click();
        assert.equal((await created).status(), 200);
        await dialog.waitFor({ state: "hidden" });
        await page.getByLabel("Tuần bắt đầu").fill(fixture.createScheduleDate);
        await settled();
        assert(await page.getByText(fixture.doctorName, { exact: true }).count(), "Saved shift renders after reload");
        const saved = await apiFromPage("get", `/doctor-schedules?weekStart=${fixture.createScheduleDate}`);
        assert((saved.data.result ?? saved.data).some(item => item.workDate === fixture.createScheduleDate && item.doctorName === fixture.doctorName));
        console.log("PASS DoctorSchedules real list, week/specialty/reset/refresh, every shift card, detail timeSlots, create and reload; 401/403; desktop/mobile. No edit/delete/import/export endpoint in this page.");
    }
    
    async function labTypes() {
        await login();
        await visit("/internal/lab-test-types", /xét nghiệm/i);
        await authChecks("/LabTestTypes", fixture.usernames.patient);
        assert(await checkPagination(), "Seeded catalog must exercise pagination");
        await fillSearch("ui-absent-lab");
        assert.equal(await page.locator("tbody tr").count(), 1, "Empty catalog state occupies one table row");
        await reset();
        await refresh();
        await screens("LabTypes");
        const name = `UI saved lab ${Date.now()}`;
        await page.getByRole("button", { name: /Thêm.*[Xx]ét [Nn]ghiệm/i }).first().click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel(requiredLabel("Tên xét nghiệm")).fill(name);
        await dialog.getByLabel(requiredLabel("Giá dịch vụ (VNĐ)")).fill("150000");
        await dialog.getByLabel(requiredLabel("Mô tả")).fill("Real API interface verification");
        let response = page.waitForResponse(value => value.request().method() === "POST" && /\/api\/LabTestTypes$/i.test(new URL(value.url()).pathname));
        await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
        assert.equal((await response).status(), 201);
        await dialog.waitFor({ state: "hidden" });
        await fillSearch(name);
        const row = page.locator("tbody tr").filter({ hasText: name });
        await row.getByRole("button", { name: /Sửa/ }).click();
        await dialog.getByLabel(requiredLabel("Tên xét nghiệm")).fill(name + " updated");
        response = page.waitForResponse(value => value.request().method() === "PUT" && /\/api\/LabTestTypes\/\d+$/i.test(new URL(value.url()).pathname));
        await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
        assert.equal((await response).status(), 204);
        await dialog.waitFor({ state: "hidden" });
        await fillSearch(name);
        await page.getByText(name + " updated", { exact: true }).waitFor();
        page.once("dialog", dialog => dialog.accept());
        response = page.waitForResponse(value => value.request().method() === "DELETE" && /\/api\/LabTestTypes\/\d+$/i.test(new URL(value.url()).pathname));
        await row.getByRole("button", { name: /Ẩn|Ngừng|Ngưng/ }).first().click();
        const confirm = page.getByRole("dialog").getByRole("button", { name: /Ẩn|Ngừng|Ngưng/ });
        if (await confirm.count()) await confirm.last().click();
        assert.equal((await response).status(), 204);
        await settled();
        const list = await apiFromPage("get", "/LabTestTypes?includeInactive=true");
        const persisted = (list.data.result ?? list.data).find(item => item.name === name + " updated");
        assert(persisted && !persisted.isActive, "Hiding persists inactive flag without deleting lab type");
        await login(fixture.usernames.doctor);
        await visit("/internal/lab-test-types", /xét nghiệm/i);
        assert.equal(await page.getByRole("button", { name: /Thêm.*[Xx]ét [Nn]ghiệm|^Sửa|^Ẩn|Ngừng dùng/i }).count(), 0, "Read-only role has no editing controls");
        console.log("PASS LabTypes real list, search/reset/refresh/pagination, create/edit/hide persisted, doctor read-only; 401/403; desktop/mobile. Excel/lock actions are unsupported.");
    }
    
    async function scheduleReview() {
        await login();
        await visit("/internal/schedule-requests", /Duyệt/);
        await authChecks("/schedule-requests", fixture.usernames.patient);
        const all = await apiFromPage("get", "/schedule-requests?pageNumber=1&pageSize=100");
        assert.equal(all.status, 200);
        const reviewIds = [fixture.headRequestId, fixture.headRejectRequestId];
        const pending = reviewIds.map(id => all.data.result.items.find(item => item.requestId === id && item.status === "Pending" && item.canReview)).filter(Boolean);
        assert(pending.length >= 2, "Admin has two reviewable head requests");
        const own = all.data.result.items.find(item => item.requestId === fixture.ownRequestId);
        assert(own && !own.canReview, "Admin cannot review its own request");
        await fillSearch("ui-absent-request");
        await reset();
        await refresh();
        await screens("ScheduleReview");
        for (const [index, operation] of ["approve", "reject"].entries()) {
            const item = pending[index];
            await fillSearch(String(item.requestId));
            const row = page.locator("tbody tr").filter({ has: page.getByRole("cell", { name: `#${item.requestId}`, exact: true }) });
            await row.getByRole("button", { name: /Xem chi tiết/ }).click();
            await page.getByRole("dialog").waitFor();
            await page.getByRole("dialog").getByRole("button", { name: "Đóng", exact: true }).click();
            await row.getByRole("button", { name: operation === "approve" ? /^Duyệt$|^Phê duyệt$/ : /^Từ chối$/ }).click();
            const dialog = page.getByRole("dialog");
            if (operation === "reject") await dialog.getByLabel(/Lý do từ chối/).fill("UI real API rejection verification");
            const response = page.waitForResponse(value => value.request().method() === "POST" && new URL(value.url()).pathname === `/api/schedule-requests/${item.requestId}/${operation}`);
            await dialog.getByRole("button", { name: operation === "approve" ? /Xác nhận|Phê duyệt|Duyệt/ : /Xác nhận|Từ chối/ }).last().click();
            assert.equal((await response).status(), 200);
            await dialog.waitFor({ state: "hidden" });
            const saved = await apiFromPage("get", `/schedule-requests/${item.requestId}`);
            assert.equal(saved.data.result.status, operation === "approve" ? "Approved" : "Rejected");
        }
        await reset();
        await page.getByRole("tab", { name: /Tất cả/ }).click();
        await settled();
        await checkPagination();
        await login(fixture.usernames.head);
        const scoped = await apiFromPage("get", "/schedule-requests?pageNumber=1&pageSize=100");
        assert.equal(scoped.status, 200);
        assert(scoped.data.result.items.every(item => item.departmentId === fixture.headDepartmentId || item.departmentId === 2), "Head sees its own department only");
        console.log("PASS ScheduleReview real list/filter/reset/tabs/detail/pagination, Admin approve/reject, self-review unavailable, Head department scope; 401/403; desktop/mobile. No Excel/import/delete/lock APIs.");
    }
    
    async function diseases() {
        await login();
        await visit("/internal/diseases", /Danh mục bệnh/);
        await authChecks("/diseases", fixture.usernames.patient);
        assert(await checkPagination(), "Seeded disease list exercises server pagination");
        await fillSearch("ui-absent-disease");
        await page.getByText(/(?:Chưa|Không) có bệnh phù hợp/).waitFor();
        await reset();
        await refresh();
        await screens("Diseases");
        const code = `UI${Date.now()}`;
        const name = `UI saved disease ${Date.now()}`;
        await page.getByRole("button", { name: "Thêm bệnh mới", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel(requiredLabel("Mã bệnh")).fill(code);
        await dialog.getByLabel(requiredLabel("Tên bệnh")).fill(name);
        await dialog.getByLabel(requiredLabel("Mô tả / ghi chú")).fill("Real API interface verification");
        let response = page.waitForResponse(value => value.request().method() === "POST" && new URL(value.url()).pathname === "/api/diseases");
        await dialog.getByRole("button", { name: /Lưu|Thêm bệnh/ }).last().click();
        assert.equal((await response).status(), 201);
        await dialog.waitFor({ state: "hidden" });
        await fillSearch(code);
        const row = page.locator("tbody tr").filter({ hasText: code });
        await row.getByRole("button", { name: /Sửa|Cập nhật/ }).click();
        await dialog.getByLabel(requiredLabel("Tên bệnh")).fill(name + " updated");
        response = page.waitForResponse(value => value.request().method() === "PUT" && /\/api\/diseases\/\d+$/.test(new URL(value.url()).pathname));
        await dialog.getByRole("button", { name: /Lưu|Cập nhật/ }).last().click();
        assert.equal((await response).status(), 200);
        await dialog.waitFor({ state: "hidden" });
        await page.getByText(name + " updated", { exact: true }).waitFor();
        await row.getByRole("button", { name: /Xóa/ }).click();
        response = page.waitForResponse(value => value.request().method() === "DELETE" && /\/api\/diseases\/\d+$/.test(new URL(value.url()).pathname));
        await page.getByRole("dialog").getByRole("button", { name: "Xóa bệnh", exact: true }).click();
        assert.equal((await response).status(), 200);
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        await settled();
        const persisted = await apiFromPage("get", `/diseases?search=${code}`);
        assert.equal(persisted.data.result.totalItems, 0);
        console.log("PASS Diseases real list/search/reset/refresh/server pagination, create/edit/delete and persisted reload; 401/403; desktop/mobile. No lock/Excel APIs.");
    }
    
    async function profile() {
        await login(fixture.usernames.patient);
        await visit("/profile", /Hồ sơ cá nhân/);
        await authChecks("/patients/me", fixture.usernames.doctor);
        const fullName = `UI profile ${Date.now()}`;
        await page.getByLabel(requiredLabel("Họ tên tài khoản")).fill("  " + fullName + "  ");
        await page.getByLabel(requiredLabel("Email")).fill(`ui-${Date.now()}@example.test`);
        await page.getByLabel(requiredLabel("Điện thoại tài khoản")).fill("0901234567");
        let response = page.waitForResponse(value => value.request().method() === "PUT" && new URL(value.url()).pathname === "/api/auth/me");
        await page.getByRole("button", { name: "Lưu tài khoản", exact: true }).click();
        assert.equal((await response).status(), 200);
        await page.getByText("Đã lưu thông tin tài khoản.", { exact: true }).waitFor();
        assert.equal(await page.getByLabel(requiredLabel("Họ tên tài khoản")).inputValue(), fullName, "Account form uses canonical returned value");
        await page.getByLabel(requiredLabel("Họ tên tài khoản")).fill("  " + fullName + "  ");
        response = page.waitForResponse(value => value.request().method() === "PUT" && new URL(value.url()).pathname === "/api/auth/me");
        await page.getByRole("button", { name: "Lưu tài khoản", exact: true }).click();
        assert.equal((await response).status(), 200);
        await page.getByText("Đã lưu thông tin tài khoản.", { exact: true }).waitFor();
        assert.equal(await page.getByLabel(requiredLabel("Họ tên tài khoản")).inputValue(), fullName, "Unchanged canonical account response resets raw whitespace too");
        await page.getByLabel(requiredLabel("Họ và tên")).fill("  UI clinical patient  ");
        await page.getByLabel(requiredLabel("Số điện thoại")).fill("0909876543");
        await page.getByLabel(requiredLabel("Ngày sinh")).fill("1990-01-02");
        await page.getByLabel(requiredLabel("Số CCCD")).fill("UI-IDENTITY-VERIFY");
        await page.getByLabel(requiredLabel("Mã bảo hiểm y tế")).fill("UI-INSURANCE");
        response = page.waitForResponse(value => value.request().method() === "PUT" && new URL(value.url()).pathname === "/api/patients/me");
        await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
        assert.equal((await response).status(), 200);
        await page.getByText("Đã lưu hồ sơ.", { exact: true }).waitFor();
        assert.equal(await page.getByLabel(requiredLabel("Họ và tên")).inputValue(), "UI clinical patient");
        await page.getByLabel(requiredLabel("Họ và tên")).fill("  UI clinical patient  ");
        response = page.waitForResponse(value => value.request().method() === "PUT" && new URL(value.url()).pathname === "/api/patients/me");
        await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
        assert.equal((await response).status(), 200);
        await page.getByText("Đã lưu hồ sơ.", { exact: true }).waitFor();
        assert.equal(await page.getByLabel(requiredLabel("Họ và tên")).inputValue(), "UI clinical patient", "Unchanged canonical patient response resets raw whitespace too");
        await page.reload();
        await page.getByLabel(requiredLabel("Họ tên tài khoản")).waitFor();
        assert.equal(await page.getByLabel(requiredLabel("Họ tên tài khoản")).inputValue(), fullName);
        assert.equal(await page.getByLabel(requiredLabel("Họ và tên")).inputValue(), "UI clinical patient");
        await screens("Profile");
        const disallowed = await apiFromPage("put", "/auth/me", { fullName, userId: 999, role: "Admin" });
        assert.equal(disallowed.status, 400, "Self-profile endpoint rejects extra identity/role fields");
        for (const [username, route] of [[fixture.usernames.admin, "/internal/profile"], [fixture.usernames.doctor, "/internal/doctor/profile"]]) {
            await login(username);
            await visit(route);
            await page.getByLabel(requiredLabel("Họ tên tài khoản")).waitFor();
            await screen(username === fixture.usernames.admin ? "Profile-internal-shared" : "Profile-doctor-shared");
            await screen(username === fixture.usernames.admin ? "Profile-internal-shared-mobile" : "Profile-doctor-shared-mobile", true);
        }
        console.log("PASS Profile both real forms save canonical BE response and reload, shared internal/doctor callers, rejects identity/role override; 401/403; desktop/mobile. No delete/lock/Excel APIs.");
    }
    
    async function labResults() {
        await login(fixture.usernames.patient);
        await visit("/lab-results", /Kết quả xét nghiệm/);
        await authChecks("/labtests");
        const list = await apiFromPage("get", "/labtests");
        assert.equal(list.status, 200);
        assert(Array.isArray(list.data), "Lab result contract remains raw array");
        assert(list.data.length >= 16 && !list.data.some(item => item.id === fixture.foreignLabId), "List contains own results and no other patient data");
        await choose("Trạng thái", "Đang chờ");
        await page.getByText(`${list.data.filter(item => item.status === "Pending").length} chỉ định phù hợp`, { exact: true }).waitFor();
        await reset();
        const own = list.data.find(item => item.result);
        await page.getByText(own.labTestTypeName, { exact: true }).first().waitFor();
        const detail = await apiFromPage("get", `/labtests/${own.id}`);
        assert.equal(detail.status, 200);
        const detailResponse = page.waitForResponse(value => value.request().method() === "GET" && new URL(value.url()).pathname === `/api/labtests/${own.id}`);
        await page.getByRole("button", { name: `Xem chi tiết xét nghiệm #${own.id}`, exact: true }).click();
        assert.equal((await detailResponse).status(), 200);
        const resultDialog = page.getByRole("dialog", { name: "Chi tiết xét nghiệm", exact: true });
        await resultDialog.getByText(own.result.resultSummary, { exact: true }).waitFor();
        await screen("LabResults-detail-desktop");
        await screen("LabResults-detail-mobile", true);
        await resultDialog.getByRole("button", { name: "Đóng", exact: true }).click();
        await page.setViewportSize({ width: 1440, height: 1000 });
        const foreign = await apiFromPage("get", `/labtests/${fixture.foreignLabId}`);
        assert.equal(foreign.status, 404);
        await refresh();
        await screens("LabResults");
        if (await page.getByRole("textbox", { name: /Tìm/ }).count() || await page.getByPlaceholder(/Tìm/).count()) {
            await fillSearch("ui-absent-result");
            await reset();
        }
        await checkPagination();
        await login(fixture.usernames.other);
        await visit("/lab-results", /Kết quả xét nghiệm/);
        const other = await apiFromPage("get", "/labtests");
        assert.equal(other.status, 200);
        assert.equal(other.data.length, 1, "Another patient sees only their own lab order");
        await login(fixture.usernames.head);
        await visit("/lab-results");
        assert.equal(new URL(page.url()).pathname, "/403", "Non-patient route access redirects to 403");
        console.log("PASS LabResults real raw list/pending/completed/refresh/details, other-patient scope and foreign ID 404; 401/403; desktop/mobile. Server has no filters/pagination or patient mutation/Excel APIs.");
    }
    
    async function reviews() {
        await login(fixture.usernames.patient);
        await visit("/my-reviews", /Đánh giá sau/);
        await authChecks("/reviews/my-appointments", fixture.usernames.admin);
        assert(await checkPagination(), "Completed appointment reviews exercise server pagination");
        await refresh();
        await screens("Reviews");
        const comment = `UI real review ${Date.now()}`;
        await page.getByRole("button", { name: "Viết đánh giá", exact: true }).first().click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel(requiredLabel("Nhận xét")).fill(comment);
        await screen("Reviews-dialog-desktop");
        await screen("Reviews-dialog-mobile", true);
        let createdAppointment;
        const response = page.waitForResponse(value => value.request().method() === "POST" && new URL(value.url()).pathname === "/api/reviews");
        await dialog.getByRole("button", { name: "Gửi đánh giá", exact: true }).click();
        const saved = await response;
        assert.equal(saved.status(), 200);
        createdAppointment = (await saved.json()).result.appointmentId;
        await page.getByText("Đã gửi đánh giá.", { exact: true }).waitFor();
        await page.getByText(comment, { exact: true }).waitFor();
        const duplicate = await apiFromPage("post", "/reviews", { appointmentId: createdAppointment, rating: 5, comment });
        assert.equal(duplicate.status, 409);
        const pending = await apiFromPage("post", "/reviews", { appointmentId: fixture.pendingAppointmentId, rating: 5 });
        assert.equal(pending.status, 400);
        const foreign = await apiFromPage("post", "/reviews", { appointmentId: fixture.foreignAppointmentId, rating: 5 });
        assert.equal(foreign.status, 403);
        const own = await apiFromPage("get", "/reviews/my-appointments?pageSize=100");
        const hidden = own.data.result.items.find(item => item.reviewId && !item.isVisible);
        assert(hidden, "Own list retains hidden review");
        const publicList = await apiFromPage("get", "/reviews?pageSize=100");
        assert(!publicList.data.result.items.some(item => item.reviewId === hidden.reviewId), "Public list excludes hidden review");
        await page.setViewportSize({ width: 1440, height: 1000 });
        await visit("/reviews", /Đánh giá bác sĩ/);
        assert.equal(await page.getByRole("button", { name: "Viết đánh giá", exact: true }).count(), 0, "Public list has no create action");
        await screen("Reviews-public-shared");
        await screen("Reviews-public-shared-mobile", true);
        console.log("PASS Reviews real list/server pagination/dialog/submit/refetch, duplicate/incomplete/foreign validation, hidden own review retained and public excluded; shared public mode; 401/403; desktop/mobile. No patient edit/delete/visibility/Excel APIs.");
    }
    
    async function diseasesRace() {
        await login();
        await visit("/internal/diseases", /Danh mục bệnh/);
        const endpoint = new URL(fixture.baseUrl.replace(/\/$/, "") + "/api/diseases").pathname;
        let announce;
        const started = new Promise(resolve => { announce = resolve; });
        const matcher = url => url.pathname === endpoint && url.searchParams.get("search") === "ui-absent-race";
        await page.route(matcher, async route => {
            announce();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await route.continue();
        });
        try {
            const older = page.waitForResponse(value => value.request().method() === "GET" && matcher(new URL(value.url())));
            older.catch(() => {});
            await page.getByLabel("Tìm bệnh", { exact: true }).fill("ui-absent-race");
            await Promise.race([started, new Promise((_, reject) => setTimeout(() => reject(new Error("Delayed filter read did not start")), 15000))]);
            const newer = page.waitForResponse(value => value.request().method() === "GET" && new URL(value.url()).searchParams.get("search") === "Tăng huyết áp");
            newer.catch(() => {});
            await page.getByLabel("Tìm bệnh", { exact: true }).fill("Tăng huyết áp");
            assert.equal((await newer).status(), 200);
            assert.equal((await older).status(), 200);
            await settled();
            assert.equal(await page.getByRole("cell", { name: "Tăng huyết áp", exact: true }).count(), 1, "Old empty response cannot replace the latest real filtered result");
            await reset();
            console.log("PASS Diseases latest filter persists after an older delayed real API response, without mocked data.");
        } finally { await page.unroute(matcher); }
    }

    async function unbookedProfile() {
        await login(fixture.usernames.patient);
        const username = `uinoprofile${Date.now()}`;
        const registered = await apiFromPage("post", "/auth/register", { username, password: fixture.password, fullName: "Patient without clinical profile", phone: "0901234555", email: username + "@example.test" });
        assert.equal(registered.status, 200);
        fixture.usernames.unbooked = username;
        await login(username);
        await visit("/profile", /Hồ sơ cá nhân/);
        await page.getByText(/Bạn chưa có hồ sơ khám bệnh tại phòng khám/).waitFor();
        assert.equal(await page.getByRole("alert").filter({ hasText: /Đã có lỗi không xác định|Không tìm thấy bệnh nhân/ }).count(), 0);
        assert(await page.getByRole("button", { name: "Lưu tài khoản", exact: true }).isEnabled());
        await page.getByLabel(requiredLabel("Họ tên tài khoản")).fill("Unbooked patient's updated account");
        const saved = page.waitForResponse(value => value.request().method() === "PUT" && new URL(value.url()).pathname === "/api/auth/me");
        await page.getByRole("button", { name: "Lưu tài khoản", exact: true }).click();
        assert.equal((await saved).status(), 200);
        await page.getByText("Đã lưu thông tin tài khoản.", { exact: true }).waitFor();
        await screens("Profile-without-clinical-record");
        await visit("/my-reviews", /Đánh giá sau/);
        await page.getByText(/Chưa có lịch hẹn đã hoàn thành để đánh giá/).waitFor();
        assert.equal(await page.getByRole("button", { name: "Viết đánh giá", exact: true }).count(), 0);
        console.log("PASS Account without clinical profile displays an honest empty state, keeps account editing, and loads an empty eligible-review list through real APIs.");
    }

    async function cashier() {
        await login();
        await visit("/internal/cashier/billing", /Thu Ngân/);
        await authChecks("/invoices/pending?stage=Pending", fixture.usernames.patient);
        const pending = await apiFromPage("get", "/invoices/pending?stage=Pending");
        assert.equal(pending.status, 200);
        assert(Array.isArray(pending.data) && pending.data.length, "Fixture has real unpaid appointment fees");
        await page.getByRole("button", { name: "Chọn thu tiền", exact: true }).first().click();
        await page.getByRole("button", { name: "80%", exact: true }).click();
        await screens("CashierBilling");
        await page.getByRole("combobox", { name: "Sổ thu tiền", exact: true }).click();
        await page.locator(".ant-select-item-option").filter({ hasText: "2. Sổ LabAndConsultation (Xét nghiệm)" }).click();
        await settled();
        assert.equal(await page.getByRole("button", { name: /Xác Nhận Thu Tiền/ }).count(), 0, "Changing billing stage clears stale checkout selection");
        await page.getByRole("combobox", { name: "Sổ thu tiền", exact: true }).click();
        await page.locator(".ant-select-item-option").filter({ hasText: "1. Sổ Pending (Phí khám ban đầu)" }).click();
        await settled();
        await page.getByRole("button", { name: "Chọn thu tiền", exact: true }).first().click();
        await page.getByRole("button", { name: "80%", exact: true }).click();
        const accepted = page.waitForResponse(value => value.request().method() === "POST" && new URL(value.url()).pathname.toLowerCase() === "/api/invoices");
        await page.getByRole("button", { name: /Xác Nhận Thu Tiền/ }).click();
        const response = await accepted;
        assert.equal(response.status(), 200);
        const invoice = await response.json();
        assert.equal(invoice.insuranceDiscountPercent, 80);
        assert.equal(invoice.insuranceAmount, invoice.totalAmount * 0.8);
        assert.equal(invoice.patientAmount, invoice.totalAmount * 0.2);
        await settled();
        const reloaded = await apiFromPage("get", "/invoices/pending?stage=Pending");
        assert(!reloaded.data.some(item => item.appointmentId === invoice.appointmentId), "Paid appointment disappears from refreshed queue");
        console.log("PASS Cashier renders, loads both real billing stages, resets stale selection, pays a fixture invoice with insurance and reloads queue; 401/403; no charges made in application DB.");
    }

    async function cashierRole() {
        await login();
        const roles = await apiFromPage("get", "/rbac/roles?pageSize=100");
        assert.equal(roles.status, 200);
        let role = roles.data.result.items.find(item => item.roleName === "Cashier");
        if (!role) {
            const created = await apiFromPage("post", "/rbac/roles", { name: "Cashier", description: "Temporary cashier verification role", permissionCodes: [] });
            assert.equal(created.status, 201);
            role = created.data.result;
        }
        const username = `uicashier${Date.now()}`;
        const registered = await apiFromPage("post", "/auth/register", { username, password: fixture.password, fullName: "Fixture cashier", phone: "0901234556", email: username + "@example.test" });
        assert.equal(registered.status, 200);
        const assigned = await apiFromPage("patch", `/users/${registered.data.result.userId}/role`, { roleId: role.roleId });
        assert.equal(assigned.status, 200);
        await login(username);
        await visit("/internal/cashier/billing", /Thu Ngân/);
        const rows = await apiFromPage("get", "/invoices/pending?stage=Pending");
        assert.equal(rows.status, 200);
        assert(Array.isArray(rows.data));
        await screens("Cashier-role");
        console.log("PASS Actual Cashier role can log in, open billing and load its permitted API; role and account provisioned only in disposable fixture DB.");
    }

    const accountMenu = async () => {
        const { verifyAccountMenu } = await import(new URL(`./account-menu-stage.mjs?revision=${Date.now()}`, import.meta.url));
        await verifyAccountMenu(helpers, context);
    };
    return { DoctorSchedules: doctorSchedules, LabTypes: labTypes, ScheduleReview: scheduleReview, Diseases: diseases, DiseasesRace: diseasesRace, Profile: profile, UnbookedProfile: unbookedProfile, Cashier: cashier, CashierRole: cashierRole, LabResults: labResults, Reviews: reviews, AccountMenu: accountMenu };
}
