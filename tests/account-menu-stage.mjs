import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

export async function verifyAccountMenu(helpers, context) {
    const { login, visit, settled, apiFromPage } = helpers;
    const { fixture } = context;
    const labels = ["Đặt lịch khám", "Kết quả xét nghiệm", "Hồ sơ cá nhân", "Đánh giá sau khám", "Đăng xuất"];
    let longName = "Nguyễn Thị Ánh Hồng Phương Uyên Đặng Hoàng Bảo Ngọc Trần Thùy Dương";
    await login(fixture.usernames.patient);
    let page = context.page;
    await visit("/profile");
    let profile = (await apiFromPage("get", "/auth/me")).data.result;
    assert(profile.fullName, "Existing real User response supplies fullName");
    const originalName = profile.fullName;
    if (originalName === longName) longName = "Trần Thị Ngọc Ánh Nguyễn Hoàng Thùy Dương Đặng Thanh Hồng Phương Uyên";
    let name = originalName;
    const trigger = () => page.getByRole("button", { name: `${name}, mở menu tài khoản`, exact: true });
    const menu = () => page.getByRole("menu");
    const item = label => menu().getByRole("menuitem", { name: label, exact: true });
    const close = async () => {
        await page.keyboard.press("Escape");
        await menu().waitFor({ state: "hidden" });
    };
    const capture = async filename => {
        await page.screenshot({ path: `.tmp/ui-refresh/${filename}.png` });
        console.log(`SCREENSHOT .tmp/ui-refresh/${filename}.png`);
    };
    const bounds = async () => {
        const rect = await menu().evaluate(element => {
            const paper = element.closest(".MuiPaper-root");
            const box = paper.getBoundingClientRect();
            return { x: box.x, y: box.y, right: box.right, bottom: box.bottom, radius: getComputedStyle(paper).borderRadius };
        });
        const viewport = page.viewportSize();
        assert(rect.x >= 0 && rect.y >= 0 && rect.right <= viewport.width + 1 && rect.bottom <= viewport.height + 1, "Dropdown remains within viewport");
        assert.equal(rect.radius, "12px");
    };
    const noOverflow = async () => {
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Account area must not cause page overflow");
    };
    const open = async () => {
        await trigger().click();
        await menu().waitFor();
        await delay(220);
        assert.deepEqual(await menu().getByRole("menuitem").allTextContents(), labels);
        assert.equal(await menu().locator(".MuiListItemIcon-root svg").count(), 5, "Each existing action has a MUI icon");
        await bounds();
    };

    await trigger().waitFor();
    const widthBefore = (await trigger().boundingBox()).width;
    let accountReads = 0;
    const countRead = request => { if (request.method() === "GET" && new URL(request.url()).pathname === "/api/auth/me") accountReads++; };
    page.on("request", countRead);
    await trigger().focus();
    await page.keyboard.press("ArrowDown");
    await menu().waitFor();
    await delay(250);
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), labels[0]);
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), labels[1]);
    await page.keyboard.press("End");
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "Đăng xuất");
    await page.keyboard.press("Home");
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), labels[0]);
    await capture("AccountMenu-desktop");
    await close();
    assert(await trigger().evaluate(element => element === document.activeElement), "Escape restores focus to account trigger");
    await open();
    await page.mouse.click(5, 400);
    await menu().waitFor({ state: "hidden" });
    assert.equal(accountReads, 0, "Opening and closing the menu does not fetch the user again");
    page.off("request", countRead);

    for (const [label, route] of [["Đặt lịch khám", "/booking"], ["Kết quả xét nghiệm", "/lab-results"], ["Đánh giá sau khám", "/my-reviews"], ["Hồ sơ cá nhân", "/profile"]]) {
        await open();
        await item(label).click();
        await page.waitForURL(url => url.pathname === route);
        await settled();
        await menu().waitFor({ state: "hidden" });
        await trigger().waitFor();
    }

    await page.getByLabel(/^Họ tên tài khoản/).fill(longName);
    const saved = page.waitForResponse(response => response.request().method() === "PUT" && new URL(response.url()).pathname === "/api/auth/me");
    await page.getByRole("button", { name: "Lưu tài khoản", exact: true }).click();
    const response = await saved;
    assert.equal(response.status(), 200);
    assert.equal((await response.json()).result.fullName, longName);
    name = longName;
    await trigger().waitFor();
    assert.equal((await trigger().boundingBox()).width, widthBefore, "A long name does not resize the account button");
    assert.equal(await page.getByRole("button", { name: `${originalName}, mở menu tài khoản`, exact: true }).count(), 0, "Profile save updates the visible auth name immediately");
    assert(await trigger().locator("span").evaluateAll(elements => elements.some(element => getComputedStyle(element).textOverflow === "ellipsis" && element.scrollWidth > element.clientWidth)), "Long Vietnamese name is truncated visually");
    await trigger().hover();
    await page.getByRole("tooltip").getByText(longName, { exact: true }).waitFor();
    await open();
    await menu().getByText(longName, { exact: true }).waitFor();
    await capture("AccountMenu-long-name-desktop");
    await close();

    let release;
    let announce;
    const gate = new Promise(resolve => { release = resolve; });
    const started = new Promise(resolve => { announce = resolve; });
    const match = url => url.pathname === "/api/auth/me";
    await page.route(match, async route => { announce(); await gate; await route.continue(); });
    try {
        await page.reload({ waitUntil: "domcontentloaded" });
        await Promise.race([started, delay(15000).then(() => { throw new Error("Reload must validate the stored session through existing auth API"); })]);
        assert.equal(await page.getByRole("button", { name: /mở menu tài khoản/ }).count(), 0, "Stored name is withheld while session verification is pending");
        release();
        await trigger().waitFor();
        await settled();
    } finally { release(); await page.unroute(match); }

    for (const width of [1440, 1360, 1024]) {
        await page.setViewportSize({ width, height: 1000 });
        await noOverflow();
        if (width >= 1360) {
            const link = await page.getByRole("link", { name: "Cẩm nang sức khỏe", exact: true }).boundingBox();
            assert((await trigger().boundingBox()).x >= link.x + link.width, "Account button does not overlap desktop navigation");
        }
        await open();
        await close();
    }
    for (const [width, height] of [[390, 844], [320, 568]]) {
        await page.setViewportSize({ width, height });
        await page.getByRole("button", { name: "Mở menu điều hướng", exact: true }).click();
        await trigger().waitFor();
        await open();
        await noOverflow();
        await capture(`AccountMenu-mobile-${width}`);
        assert(await item("Hồ sơ cá nhân").evaluate(element => {
            const rect = element.getBoundingClientRect();
            return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
        }), "Mobile action is above the drawer and receives pointer input");
        await close();
        await open();
        await item("Đánh giá sau khám").click();
        await page.waitForURL(url => url.pathname === "/my-reviews");
        await settled();
        await page.getByRole("button", { name: "Đóng menu", exact: true }).waitFor({ state: "hidden" });
    }

    await page.setViewportSize({ width: 1440, height: 1000 });
    await open();
    const loggedOut = page.waitForResponse(value => value.request().method() === "POST" && new URL(value.url()).pathname === "/api/auth/logout");
    await item("Đăng xuất").click();
    assert.equal((await loggedOut).status(), 204);
    await page.waitForURL(url => url.pathname === "/login");
    assert.equal(await page.getByRole("button", { name: /mở menu tài khoản/ }).count(), 0);
    assert.equal(await page.getByRole("link", { name: "Cổng Bệnh Nhân", exact: true }).getAttribute("href"), "/login");
    assert(!(await page.context().cookies()).some(cookie => cookie.name === "clinic_refresh"), "Existing logout removes refresh cookie");
    assert(await page.evaluate(async () => (await import("/src/utils/authStorage.js")).readSession() === null), "Existing logout clears stored session");
    await capture("AccountMenu-logged-out");

    await page.getByLabel("Tên đăng nhập", { exact: true }).fill(fixture.usernames.other);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(fixture.password);
    const accepted = page.waitForResponse(value => value.request().method() === "POST" && new URL(value.url()).pathname === "/api/auth/login");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    assert.equal((await accepted).status(), 200);
    await page.waitForURL(url => url.pathname !== "/login");
    profile = (await apiFromPage("get", "/auth/me")).data.result;
    name = profile.fullName;
    assert.notEqual(name, longName);
    await trigger().waitFor();
    assert.equal(await page.getByRole("button", { name: `${longName}, mở menu tài khoản`, exact: true }).count(), 0, "Same browser shows the next account, not the previous session");
    await open();
    await capture("AccountMenu-switched-account");
    await close();

    await login(fixture.usernames.admin);
    page = context.page;
    await visit("/profile");
    name = (await apiFromPage("get", "/auth/me")).data.result.fullName;
    await trigger().click();
    await menu().waitFor();
    assert.deepEqual(await menu().getByRole("menuitem").allTextContents(), ["Trang quản lý", "Hồ sơ cá nhân", "Đăng xuất"]);
    await item("Trang quản lý").click();
    await page.waitForURL(url => url.pathname === "/internal/dashboard");
    console.log("PASS AccountMenu real login/name/profile update/reload/account switch/logout, all patient destinations and staff menu; icons, tooltip/ellipsis/Vietnamese, keyboard/Escape/click-away, viewport 1440/1360/1024/390/320, no extra user reads. User update only in disposable fixture DB.");
}
