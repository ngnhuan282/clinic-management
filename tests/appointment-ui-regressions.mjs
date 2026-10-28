import assert from "node:assert/strict";

export async function checkReceptionRegressions({ open, session, send, fixture, pass }) {
    // Disable realtime for this page so a server event cannot conceal a missing post-action refresh.
    const page = await open(session, "/internal/appointments", { disableRealtime: true });
    const appointments = [];
    for (const [index, startTime] of ["14:00:00", "14:30:00"].entries()) {
        appointments.push(await send("POST", "/appointments", fixture.patientToken, {
            doctorId: fixture.DoctorId, appointmentDate: fixture.FutureDate, startTime,
            patientName: `C9 bulk UI ${index + 1}`, patientPhone: `090900099${index}`,
            reason: "C9 partial bulk confirmation regression",
        }));
    }
    await page.getByLabel("Từ ngày", { exact: true }).fill(fixture.FutureDate);
    await page.getByLabel("Đến ngày", { exact: true }).fill(fixture.FutureDate);
    await page.getByRole("textbox", { name: "Tìm lịch hẹn", exact: true }).fill("C9 bulk UI");
    await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
    const rows = appointments.map((_, index) => page.getByRole("row").filter({ hasText: `C9 bulk UI ${index + 1}` }));
    for (const row of rows) await row.getByRole("checkbox").check();
    const rejectedUrl = `**/api/appointments/${appointments[1].appointmentId}/confirm`;
    await page.route(rejectedUrl, route => route.fulfill({ status: 400, contentType: "application/json",
        body: JSON.stringify({ code: 1001, message: "Invalid request", result: null }) }));
    await page.getByRole("button", { name: "Xác nhận hàng loạt (2)", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "Đã xác nhận 1/2 lịch hẹn." }).waitFor();
    await rows[0].getByText("Đã xác nhận", { exact: true }).waitFor();
    await rows[1].getByText("Chờ xác nhận", { exact: true }).waitFor();
    assert(await rows[1].getByRole("checkbox").isChecked(), "Keep the failed appointment selected for retry");
    assert(await rows[0].getByRole("checkbox").isDisabled(), "A confirmed appointment cannot be confirmed again");
    await page.unroute(rejectedUrl);
    await page.getByRole("button", { name: "Xác nhận hàng loạt (1)", exact: true }).click();
    await rows[1].getByText("Đã xác nhận", { exact: true }).waitFor();
    pass("partial bulk confirmation refreshes real server state without SignalR and retries only the failed row");

    const previousDay = new Date(fixture.FutureDate + "T12:00:00Z");
    previousDay.setUTCDate(previousDay.getUTCDate() - 1);
    await page.getByLabel("Đến ngày", { exact: true }).fill(previousDay.toISOString().slice(0, 10));
    await page.getByRole("alert").filter({ hasText: "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu." }).waitFor();
    assert.equal(await page.getByRole("row").filter({ hasText: "C9 bulk UI" }).count(), 0,
        "An invalid date range must not retain stale rows");
    await page.getByLabel("Đến ngày", { exact: true }).fill(fixture.FutureDate);
    await rows[1].waitFor();
    pass("invalid date ranges show an actionable error and clear stale appointments");

    const summaryRoute = "**/api/appointments?**";
    const failSummary = route => new URL(route.request().url()).searchParams.get("pageSize") === "1"
        ? route.fulfill({ status: 500, contentType: "application/json",
            body: JSON.stringify({ code: 9999, message: "Uncategorized error", result: null }) })
        : route.continue();
    await page.route(summaryRoute, failSummary);
    const summaryError = page.getByRole("alert").filter({ has: page.getByRole("button", { name: "Tải lại thống kê", exact: true }) });
    await page.getByRole("button", { name: "Tải lại lịch hẹn", exact: true }).click();
    await summaryError.waitFor();
    await rows[0].waitFor();
    await page.unroute(summaryRoute, failSummary);
    await summaryError.getByRole("button", { name: "Tải lại thống kê", exact: true }).click();
    await summaryError.waitFor({ state: "hidden" });
    pass("failed appointment summaries show an error separately from the list and can be retried");

    await page.getByRole("button", { name: "Đặt lịch trực tiếp", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox", { name: "1. Chọn Chuyên khoa khám", exact: true }).click();
    await page.getByRole("option", { name: fixture.DepartmentName, exact: true }).click();
    await dialog.getByRole("combobox", { name: "2. Chọn Bác sĩ phụ trách", exact: true }).click();
    await page.getByRole("option", { name: new RegExp(fixture.DoctorName) }).click();
    await dialog.getByLabel("Ngày khám", { exact: true }).fill(fixture.FutureDate);
    const available = await send("GET", `/appointments/available-slots?doctorId=${fixture.DoctorId}&date=${fixture.FutureDate}`, session.accessToken);
    const expected = available.filter(slot => slot.isAvailable);
    assert(expected.length > 8, "The disposable schedule must contain more than eight real free slots");
    const slots = dialog.getByRole("group", { name: "Khung giờ tiếp nhận", exact: true });
    await slots.getByRole("button", { name: "12:30", exact: true }).click();
    assert.equal(await slots.getByRole("button").count(), expected.length, "Show every available slot returned by the API");
    assert.equal(await slots.getByRole("button", { name: "12:30", exact: true }).getAttribute("aria-pressed"), "true");
    for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 844 });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Walk-in dialog overflow at ${width}px`);
    }
    await page.screenshot({ path: ".tmp/c8c9/walk-in-mobile.png", fullPage: true });
    await dialog.getByRole("textbox", { name: /^Họ và tên bệnh nhân/ }).fill("C9 real walk-in UI");
    await dialog.getByRole("textbox", { name: /^Số điện thoại liên hệ/ }).fill("0909000997");
    await dialog.getByRole("textbox", { name: /^Lý do khám \/ Triệu chứng ban đầu/ }).fill("C9 real walk-in form submission");
    const submitted = page.waitForResponse(response => response.request().method() === "POST"
        && new URL(response.url()).pathname === "/api/appointments/direct");
    await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
    const response = await submitted;
    assert.equal(response.status(), 200);
    const appointment = (await response.json()).result;
    assert.equal(appointment.startTime, "12:30:00");
    assert.equal(appointment.appointmentDate.slice(0, 10), fixture.FutureDate);
    assert.equal(appointment.status, "Confirmed");
    assert(appointment.patientProfileId > 0, "Walk-in must create/link a real Patient profile");
    await dialog.waitFor({ state: "hidden" });
    pass("walk-in exposes all real slots on desktop/mobile and saves a future date beyond shortcuts with its Patient profile");
}
