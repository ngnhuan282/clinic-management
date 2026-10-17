import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

export async function exerciseLoadingAndNetworkError(context, endpoint) {
    const { page, api } = context;
    assert(page && endpoint?.startsWith("/"), "states needs a logged-in page and an API endpoint");
    const target = new URL(api + endpoint).pathname.toLowerCase();
    const matches = url => url.pathname.toLowerCase() === target;
    const isRead = request => request.method() === "GET" && matches(new URL(request.url()));
    const isPrimary = request => isRead(request) && new URL(request.url()).searchParams.get("pageSize") !== "1";
    const inFlight = new Set();
    const started = request => { if (isRead(request)) inFlight.add(request); };
    const finished = request => inFlight.delete(request);
    page.on("request", started);
    page.on("requestfinished", finished);
    page.on("requestfailed", finished);
    const errorAlert = page.getByRole("alert").filter({ hasText: "Không thể kết nối tới máy chủ." }).first();

    async function quiescent() {
        await page.waitForLoadState("networkidle", { timeout: 20000 });
        await page.waitForFunction(() => !Array.from(document.querySelectorAll('[aria-busy="true"]')).some(element => {
            const box = element.getBoundingClientRect();
            return box.width && box.height && getComputedStyle(element).visibility !== "hidden";
        }), undefined, { timeout: 20000 });
        const deadline = Date.now() + 20000;
        while (inFlight.size && Date.now() < deadline) await delay(50);
        assert.equal(inFlight.size, 0, "Target API reads must finish before changing interception");
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }

    async function trigger() {
        const refresh = page.getByRole("button", { name: "Làm mới dữ liệu", exact: true }).first();
        if (await refresh.count()) {
            assert(await refresh.isEnabled(), "Refresh must be available on the settled page");
            await refresh.click();
            return "toolbar";
        }
        await page.reload({ waitUntil: "domcontentloaded" });
        return "page reload";
    }

    function announcedRead() {
        let announce;
        const started = new Promise(resolve => { announce = resolve; });
        return {
            announce,
            async wait() {
                let timeout;
                try {
                    await Promise.race([started, new Promise((_, reject) => {
                        timeout = setTimeout(() => reject(new Error("Page did not start the primary target API read")), 20000);
                    })]);
                } finally { clearTimeout(timeout); }
            },
        };
    }

    let attached = false;
    let delayed = 0;
    let aborted = 0;
    let loadingTrigger, errorTrigger;
    try {
        // Retain the current connection: a reload starts SignalR and can independently refresh the page.
        await quiescent();
        const delayedRead = announcedRead();
        await page.route(matches, async route => {
            if (isRead(route.request())) {
                delayed++;
                if (isPrimary(route.request())) delayedRead.announce();
                await delay(1500);
            }
            await route.continue();
        });
        attached = true;
        loadingTrigger = await trigger();
        await delayedRead.wait();
        await page.locator('[role="progressbar"]:visible, .MuiSkeleton-root:visible, .ant-skeleton:visible').first().waitFor();
        await quiescent();
        assert(delayed > 0, "Loading probe must delay a real API read");
        await page.unroute(matches);
        attached = false;

        const abortedRead = announcedRead();
        await page.route(matches, route => {
            if (!isRead(route.request())) return route.continue();
            aborted++;
            if (isPrimary(route.request())) abortedRead.announce();
            return route.abort("failed");
        });
        attached = true;
        errorTrigger = await trigger();
        await abortedRead.wait();
        await errorAlert.waitFor();
        // Finish list/count reads and React updates while abort remains installed.
        await quiescent();
        assert(aborted > 0, "Network error probe must abort an actual page API read");
        await errorAlert.waitFor();
        const retry = errorAlert.getByRole("button", { name: "Thử lại", exact: true });
        assert.equal(await retry.count(), 1, "The target page error must offer an explicit retry button");

        await page.unroute(matches);
        attached = false;
        const accepted = page.waitForResponse(response => isPrimary(response.request()) && response.status() === 200, { timeout: 20000 });
        accepted.catch(() => {});
        await retry.click();
        const response = await accepted;
        await response.finished();
        await quiescent();
        assert.equal(await errorAlert.count(), 0, "A successful primary API retry clears the network error");
        console.log("UI_STATES " + JSON.stringify({ endpoint, loading: true, delayedRealReads: delayed, loadingTrigger,
            networkFailureInjection: true, abortedReads: aborted, errorTrigger, explicitRetry: true, realRetry: true,
            primaryResponse: { method: "GET", path: target, status: response.status() } }));
    } finally {
        if (attached) await page.unroute(matches);
        page.off("request", started);
        page.off("requestfinished", finished);
        page.off("requestfailed", finished);
    }
}
