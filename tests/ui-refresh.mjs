import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { setTimeout as delay } from "node:timers/promises";

const site = "http://127.0.0.1:5190";
const outputDir = ".tmp/ui-refresh";
const stages = ["DoctorSchedules", "LabTypes", "ScheduleReview", "Diseases", "DiseasesRace", "Profile", "UnbookedProfile", "LabResults", "Reviews", "Cashier", "CashierRole", "AccountMenu"];
const commands = createInterface({ input: process.stdin, crlfDelay: Infinity });
let fixture, fixtureHost, fixtureFinished, vite, browser, context, page, currentUsername, api;
let stopping = false;
const pageErrors = [];
const responses = [];

function safeError(error) {
    let message = error instanceof Error ? error.message : String(error);
    if (fixture?.password) message = message.replaceAll(fixture.password, "[redacted]");
    return message.replace(/Bearer\s+[^\s"']+/gi, "Bearer [redacted]")
        .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted token]");
}

async function waitForFixture() {
    fixtureHost = spawn("dotnet", ["run", "--no-build", "--no-restore", "-c", "Release", "--project", "tests/UiRefreshVerification"], {
        windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
    });
    fixtureFinished = new Promise(resolve => fixtureHost.once("exit", resolve));
    fixtureHost.stderr.on("data", () => {});
    return new Promise((resolve, reject) => {
        let pending = "";
        const timeout = setTimeout(() => reject(new Error("Migration/API fixture startup timed out")), 180000);
        fixtureHost.stdout.on("data", chunk => {
            pending += chunk;
            const lines = pending.split(/\r?\n/);
            pending = lines.pop();
            for (const line of lines) {
                if (line.startsWith("UI_FIXTURE:")) {
                    clearTimeout(timeout);
                    try { resolve(JSON.parse(line.slice(11))); }
                    catch { reject(new Error("Invalid fixture readiness metadata")); }
                } else if (/^(PASS|SUCCESS)\b/.test(line)) {
                    console.log(line);
                }
            }
        });
        fixtureHost.once("error", error => { clearTimeout(timeout); reject(error); });
        fixtureHost.once("exit", code => { clearTimeout(timeout); reject(new Error(`Migration/API fixture exited before readiness (${code})`)); });
    });
}

async function start() {
    await mkdir(outputDir, { recursive: true });
    const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
    fixture = await waitForFixture();
    api = fixture.baseUrl.replace(/\/$/, "") + "/api";
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5190", "--strictPort"], {
        cwd: "frontend/clinic-management-client", windowsHide: true, stdio: "ignore",
        env: { ...process.env, VITE_API_BASE_URL: api, VITE_SIGNALR_HUB_URL: fixture.baseUrl.replace(/\/$/, "") + "/hubs/notification" },
    });
    let ready = false;
    for (let attempt = 0; attempt < 150; attempt++) {
        try { ready = (await fetch(site)).ok; } catch {}
        if (ready) break;
        await delay(200);
    }
    assert(ready, "Vite did not become ready on port 5190");
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    console.log("UI_READY " + JSON.stringify({ site, stages, usernames: fixture.usernames, migrationCount: fixture.migrationCount, checks: fixture.checks }));
}

function record(method, url, status) {
    responses.push({ method, path: new URL(url, api).pathname, status });
}

async function login(username = fixture.usernames.admin) {
    await context?.close();
    currentUsername = username;
    context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(60000);
    page.on("pageerror", error => pageErrors.push(safeError(error)));
    page.on("response", response => {
        if (response.url().startsWith(api)) record(response.request().method(), response.url(), response.status());
    });
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    await page.route("https://fonts.gstatic.com/**", route => route.abort());
    const internal = username !== fixture.usernames.patient && username !== fixture.usernames.other && username !== fixture.usernames.unbooked;
    await page.goto(site + (internal ? "/internal/login" : "/login"), { waitUntil: "domcontentloaded" });
    await page.getByLabel("Tên đăng nhập", { exact: true }).fill(username);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(fixture.password);
    const accepted = page.waitForResponse(response => response.url() === api + "/auth/login");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    assert.equal((await accepted).status(), 200, "Real UI login must succeed");
    await page.waitForURL(url => url.pathname !== "/login" && url.pathname !== "/internal/login");
}

async function visit(route, heading) {
    await page.goto(site + route, { waitUntil: "domcontentloaded" });
    if (heading) await page.getByRole("heading", { name: heading }).first().waitFor();
    await settled();
}

async function settled() {
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.locator("[aria-busy='true']").waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
    await delay(200);
}

async function apiFromPage(method, endpoint, payload) {
    return page.evaluate(async ({ method, endpoint, payload }) => {
        const { default: client } = await import("/src/api/axiosClient.js");
        try {
            const response = await client.request({ method, url: endpoint, ...(payload === undefined ? {} : { data: payload }) });
            return { status: response.status, data: response.data };
        } catch (error) {
            return { status: error.response?.status || 0, data: error.response?.data };
        }
    }, { method, endpoint, payload });
}

async function loginSession(username) {
    const response = await fetch(api + "/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json", Origin: site },
        body: JSON.stringify({ username, password: fixture.password }),
    });
    record("POST", response.url, response.status);
    assert.equal(response.status, 200, "Permission probe login must succeed");
    return (await response.json()).result;
}

async function probe(endpoint, status, username) {
    const session = username ? await loginSession(username) : null;
    const response = await fetch(api + endpoint, { headers: session ? { Authorization: `Bearer ${session.accessToken}` } : {} });
    record("GET", response.url, response.status);
    assert.equal(response.status, status, `GET ${endpoint} should return ${status}`);
    return response;
}

async function authChecks(endpoint, forbiddenUsername) {
    await probe(endpoint, 401);
    const response = await fetch(api + endpoint, { headers: { Authorization: "Bearer invalid-ui-access" } });
    record("GET", response.url, response.status);
    assert.equal(response.status, 401, "Invalid access token must return 401");
    if (forbiddenUsername) await probe(endpoint, 403, forbiddenUsername);
}

async function choose(label, option, scope = page) {
    const input = scope.getByRole("combobox", { name: label }).first();
    await input.click();
    if (option !== undefined) await page.getByRole("option", { name: option, exact: typeof option === "string" }).first().click();
    else {
        const options = page.getByRole("option");
        const count = await options.count();
        assert(count > 0, `No selectable option for ${label}`);
        await options.nth(count > 1 ? 1 : 0).click();
    }
}

async function fillSearch(value) {
    const byLabel = page.getByRole("textbox", { name: /Tìm|Tìm kiếm|Tra cứu/i });
    const byPlaceholder = page.getByPlaceholder(/Tìm|Tra cứu/i);
    const input = await byLabel.count() ? byLabel.first() : byPlaceholder.first();
    assert(await input.count(), "The page needs a discoverable search field");
    await input.fill(value);
    await settled();
}

async function reset() {
    await page.getByRole("button", { name: /^Đặt lại(?: bộ lọc)?$/i }).first().click();
    await settled();
}

async function refresh() {
    await page.getByRole("button", { name: /Làm mới dữ liệu|Làm mới|Tải lại|Thử lại/i }).first().click();
    await settled();
}

async function screen(name, mobile = false) {
    const filename = path.basename(name).replace(/[^A-Za-z0-9_.-]/g, "-");
    assert(filename && filename !== "." && filename !== "..", "Invalid screenshot name");
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
    await settled();
    await page.evaluate(() => window.scrollTo(0, 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Page must not overflow the viewport");
    const target = path.join(outputDir, filename.endsWith(".png") ? filename : filename + ".png");
    await page.screenshot({ path: target, fullPage: true });
    console.log("SCREENSHOT " + target.replaceAll("\\", "/"));
    return target;
}

async function screens(stage) {
    await screen(`${stage}-desktop`);
    await screen(`${stage}-mobile`, true);
    await page.setViewportSize({ width: 1440, height: 1000 });
}

async function checkPagination() {
    const next = page.getByRole("button", { name: /Go to next page|Trang tiếp|Trang sau|^Sau$|^›$/i }).first();
    if (await next.count() && await next.isEnabled()) {
        await next.click();
        await settled();
        const previous = page.getByRole("button", { name: /Go to previous page|Trang trước|^Trước$|^‹$/i }).first();
        assert(await previous.count() && await previous.isEnabled(), "Pagination must allow returning to the previous page");
        await previous.click();
        await settled();
        return true;
    }
    return false;
}


async function execute(input) {
    const action = input.command || input.action || input.type;
    const errorStart = pageErrors.length;
    const responseStart = responses.length;
    if (action === "stop") { await stop(); return; }
    if (action === "screenshot") {
        await login(input.username || fixture.usernames.admin);
        assert(input.path?.startsWith("/"), "Screenshot needs an application route");
        await visit(input.path);
        await screen(input.screenshotName || "page", Boolean(input.mobile));
    } else if (action === "run") {
        const { createStages } = await import(new URL(`./ui-refresh-stages.mjs?revision=${Date.now()}`, import.meta.url));
        const handlers = createStages({ login, visit, probe, authChecks, settled, apiFromPage, choose, fillSearch, reset, refresh, screen, screens, checkPagination }, {
            get page() { return page; },
            get fixture() { return fixture; },
        });
        assert(handlers[input.stage], `Unknown stage ${input.stage}`);
        await handlers[input.stage]();
    } else if (action === "inspect") {
        if (input.username && input.username !== currentUsername) await login(input.username);
        if (input.path) await visit(input.path);
        console.log("UI_INSPECT " + JSON.stringify({ path: new URL(page.url()).pathname, headings: await page.getByRole("heading").allTextContents(), buttons: await page.getByRole("button").allTextContents(), labels: await page.locator("label").allTextContents() }));
    } else if (action === "states") {
        const { exerciseLoadingAndNetworkError } = await import(new URL(`./ui-refresh-states.mjs?revision=${Date.now()}`, import.meta.url));
        await exerciseLoadingAndNetworkError({ get page() { return page; }, get api() { return api; } }, input.endpoint);
    } else {
        throw new Error("Use command run, screenshot, inspect, states or stop");
    }
    assert.deepEqual(pageErrors.slice(errorStart), [], "No browser pageerror");
    const observed = [...new Map(responses.slice(responseStart).map(value => [`${value.method} ${value.path} ${value.status}`, value])).values()];
    console.log("UI_DONE " + JSON.stringify({ command: action, stage: input.stage, pageErrors: 0, responses: observed }));
}

async function stop() {
    if (stopping) return;
    stopping = true;
    await browser?.close().catch(() => {});
    vite?.kill();
    if (fixtureHost && !fixtureHost.killed) fixtureHost.stdin.end(JSON.stringify({ command: "stop" }) + "\n");
    const code = fixtureFinished ? await Promise.race([fixtureFinished, delay(15000).then(() => null)]) : 0;
    if (code === null) { fixtureHost?.kill(); console.log("UI_STOPPED fixture cleanup timeout; inspect disposable fixture cleanup"); }
    else { console.log("UI_STOPPED " + JSON.stringify({ fixtureExitCode: code })); if (code !== 0) process.exitCode = 1; }
    commands.close();
}

process.once("SIGINT", () => { void stop(); });
process.once("SIGTERM", () => { void stop(); });
try {
    await start();
    for await (const line of commands) {
        if (!line.trim()) continue;
        try { await execute(JSON.parse(line)); }
        catch (error) {
            await page?.screenshot({ path: path.join(outputDir, "failure.png"), fullPage: true }).catch(() => {});
            console.log("UI_FAILED " + JSON.stringify({ error: safeError(error), path: page ? new URL(page.url()).pathname : null }));
        }
        if (stopping) break;
    }
} catch (error) {
    console.error("UI_START_FAILED " + safeError(error));
    process.exitCode = 1;
} finally {
    await stop();
}
