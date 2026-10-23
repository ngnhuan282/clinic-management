import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

let playwright;
try { playwright = await import(process.env.PLAYWRIGHT_MODULE || "playwright"); }
catch (error) {
    if (process.env.PLAYWRIGHT_MODULE) throw error;
    playwright = await import(new URL("../tmp/medical-history-browser/node_modules/playwright/index.mjs", import.meta.url));
}
const host = spawn("dotnet", [process.env.CLINIC_TEST_ASSEMBLY || "tmp/d8-verification/Week2Verification.dll", "--d8-ui"], {
    windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
});
const finished = new Promise(resolve => host.once("exit", resolve));
let vite, browser, diagnosticPage;
const screenshots = "tmp/d8-dispensing-screenshots";
try {
    await mkdir(screenshots, { recursive: true });
    const fixture = await new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("D8 temporary SQL fixture timed out")), 240000);
        host.stdout.on("data", chunk => {
            pending += chunk;
            const lines = pending.split(/\r?\n/);
            pending = lines.pop();
            for (const line of lines) {
                if (line.startsWith("AUTH_UI_SESSION:")) {
                    clearTimeout(timeout);
                    resolve(JSON.parse(line.slice(16)));
                } else if (line.startsWith("SUCCESS")) console.log(line);
            }
        });
        host.stderr.on("data", chunk => process.stderr.write(chunk));
        host.once("error", reject);
        host.once("exit", code => { clearTimeout(timeout); reject(new Error(`D8 fixture exited: ${code}`)); });
    });
    const api = fixture.baseUrl.replace(/\/$/, "") + "/api";
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5190", "--strictPort"], {
        cwd: "frontend/clinic-management-client", windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, VITE_API_BASE_URL: api, VITE_SIGNALR_HUB_URL: fixture.baseUrl + "hubs/notification" },
    });
    vite.stdout.on("data", chunk => process.stdout.write(chunk));
    vite.stderr.on("data", chunk => process.stderr.write(chunk));
    for (let i = 0; i < 100; i++) {
        try { if ((await fetch("http://127.0.0.1:5190")).ok) break; } catch { /* Wait for Vite. */ }
        if (vite.exitCode != null) throw new Error("D8 Vite exited before startup");
        await delay(200);
    }
    browser = await playwright.chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    const errors = [];
    async function login(username, path) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        const response = await context.request.post(api + "/auth/login", { data: { username, password: fixture.password } });
        assert.equal(response.status(), 200);
        const { result } = await response.json();
        const page = await context.newPage();
        diagnosticPage = page;
        page.setDefaultTimeout(25000);
        page.setDefaultNavigationTimeout(180000);
        page.on("pageerror", error => errors.push(error.message));
        await page.route("https://fonts.googleapis.com/**", route => route.abort());
        await page.route("https://fonts.gstatic.com/**", route => route.abort());
        await page.goto("http://127.0.0.1:5190/internal/login");
        await page.evaluate(session => {
            localStorage.clear();
            sessionStorage.clear();
            sessionStorage.setItem("accessToken", session.accessToken);
            sessionStorage.setItem("user", JSON.stringify({ userId: session.userId, username: session.username,
                fullName: session.fullName, role: session.role, permissions: session.permissions }));
        }, result);
        await page.goto("http://127.0.0.1:5190" + path);
        return { context, page, access: result.accessToken };
    }
    async function until(predicate, description) {
        const started = Date.now();
        while (!await predicate()) {
            if (Date.now() - started > 25000) throw new Error(description);
            await delay(100);
        }
    }
    async function noOverflow(page) {
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2),
            "D8 page must not overflow the viewport");
    }
    const code = `RX-${String(fixture.prescriptionId).padStart(5, "0")}`;
    const path = `/internal/pharmacy/dispensing/${fixture.prescriptionId}`;
    const pharmacy = await login("d8pharmacist", path);
    await pharmacy.page.getByRole("heading", { name: "Chi tiết cấp thuốc", exact: true }).waitFor();
    const waiting = pharmacy.page.getByRole("button", { name: "Chờ thanh toán", exact: true });
    await waiting.waitFor();
    assert.equal(await waiting.isDisabled(), true);
    await pharmacy.page.screenshot({ path: `${screenshots}/unpaid-desktop.png`, fullPage: true });
    const peer = await login("d8pharmacist2", `/internal/pharmacy/dispensing?search=${code}`);
    await peer.page.getByRole("button", { name: "Xem chi tiết", exact: true }).waitFor();

    const cashier = await login("d8cashier", "/internal/cashier/billing");
    const payment = await cashier.context.request.post(api + "/Invoices", {
        headers: { Authorization: "Bearer " + cashier.access },
        data: { appointmentId: fixture.appointmentId, patientId: fixture.patientId, billingStage: "Medicine", paymentMethod: "Cash",
            items: [{ sourceType: "PrescriptionDetail", sourceId: fixture.detailId,
                itemName: "D8 UI integration", quantity: 6, unitPrice: 1000 }] },
    });
    assert.equal(payment.status(), 200, await payment.text());
    await pharmacy.page.evaluate(() => window.dispatchEvent(new Event("focus")));
    const handover = pharmacy.page.getByRole("button", { name: "Xác nhận giao thuốc", exact: true });
    await handover.waitFor();
    assert.equal(await handover.isEnabled(), true, "Real cashier payment must be fetched when the pharmacy tab regains focus");
    for (const width of [1440, 390]) {
        await pharmacy.page.setViewportSize({ width, height: 1000 });
        await noOverflow(pharmacy.page);
        await pharmacy.page.screenshot({ path: `${screenshots}/paid-${width}.png`, fullPage: true });
    }
    await pharmacy.page.setViewportSize({ width: 1440, height: 1000 });
    await handover.click();
    const dialog = pharmacy.page.getByRole("dialog");
    await dialog.waitFor();
    const submit = dialog.getByRole("button", { name: "Giao thuốc và trừ kho", exact: true });
    assert.equal(await submit.isDisabled(), true, "Physical handover requires an explicit reconciliation checkbox");
    let detailReads = 0;
    pharmacy.page.on("request", request => {
        if (request.method() === "GET" && request.url().endsWith(`/api/dispensing/${fixture.prescriptionId}`)) detailReads++;
    });
    await delay(1000);
    const beforeFocus = detailReads;
    await pharmacy.page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await delay(750);
    assert.equal(detailReads, beforeFocus, "Background refresh must not interrupt an open confirmation dialog");
    await dialog.getByRole("checkbox").check();
    let confirmPosts = 0;
    pharmacy.page.on("request", request => {
        if (request.method() === "POST" && request.url().endsWith(`/api/dispensing/${fixture.prescriptionId}/confirm`)) confirmPosts++;
    });
    await submit.click({ clickCount: 2 });
    await until(async () => await pharmacy.page.getByText("Đơn thuốc đã được giao và trừ kho.", { exact: false }).count() > 0,
        "Dispensing success must show persisted handover state");
    assert.equal(confirmPosts, 1, "Double-clicking handover must send only one mutation");
    assert.equal(await handover.count(), 0);
    await pharmacy.page.screenshot({ path: `${screenshots}/dispensed-desktop.png`, fullPage: true });
    await peer.page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await until(async () => await peer.page.getByText("Đã cấp", { exact: true }).count() > 0,
        "The other pharmacist's queue must refresh after handover");
    assert.ok(peer.page.url().includes(`search=${code}`), "Background reload must preserve queue filters");
    const persisted = await pharmacy.context.request.get(api + `/dispensing/${fixture.prescriptionId}`, {
        headers: { Authorization: "Bearer " + pharmacy.access },
    });
    const detail = (await persisted.json()).result;
    assert.equal(detail.prescriptionStatus, "Dispensed");
    assert.equal(detail.medicines[0].allocations.reduce((sum, lot) => sum + lot.quantityAllocated, 0), 6);
    const repeated = await peer.context.request.post(api + `/dispensing/${fixture.prescriptionId}/confirm`, {
        headers: { Authorization: "Bearer " + peer.access },
    });
    assert.equal(repeated.status(), 400);
    await pharmacy.page.reload();
    await until(async () => await pharmacy.page.getByText("Đơn thuốc đã được giao và trừ kho.", { exact: false }).count() > 0,
        "Reload must retain the real dispensed result");
    const pollingRead = pharmacy.page.waitForRequest(request => request.method() === "GET"
        && request.url().endsWith(`/api/dispensing/${fixture.prescriptionId}`), { timeout: 35000 });
    await pollingRead;
    console.log("PASS D8 visible pharmacy detail polls its authorized API without a manual reload");
    await pharmacy.page.goto(`http://127.0.0.1:5190/internal/pharmacy/dispensing/${fixture.shortagePrescriptionId}`);
    await pharmacy.page.getByRole("button", { name: "Gửi yêu cầu rà soát", exact: true }).click();
    const reviewDialog = pharmacy.page.getByRole("dialog");
    const note = reviewDialog.getByLabel("Ghi chú đề xuất");
    const draft = "D8 preserve this unsent pharmacy note";
    await note.fill(draft);
    await pharmacy.page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await delay(750);
    assert.equal(await note.inputValue(), draft);
    await reviewDialog.getByRole("button", { name: "Hủy bỏ", exact: true }).click();
    assert.deepEqual(errors, []);
    console.log("SUCCESS: D8 browser payment-to-handover, focus refresh, draft protection, permissions, double-click and desktop/mobile checks passed.");
} catch (error) {
    if (diagnosticPage) {
        await diagnosticPage.screenshot({ path: `${screenshots}/failure.png`, fullPage: true }).catch(() => {});
        console.error((await diagnosticPage.locator("body").innerText().catch(() => "")).slice(0, 5000));
    }
    throw error;
} finally {
    await browser?.close();
    if (vite && vite.exitCode == null) {
        const stopped = new Promise(resolve => vite.once("exit", resolve));
        vite.kill();
        await stopped;
    }
    if (host.exitCode == null && !host.stdin.destroyed) host.stdin.end("\n");
    await finished;
}
