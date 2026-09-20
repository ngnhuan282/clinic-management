// Run with PLAYWRIGHT_MODULE pointing to an installed Playwright module when it is not on Node's module path.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
await mkdir('.tmp', { recursive: true });
const host = spawn('dotnet', ['run', '--no-restore', '--project', 'tests/Week2Verification', '--', '--ui'], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
let vite, browser, page, registered;
const hostFinished = new Promise(resolve => host.once('exit', resolve));
try {
    const session = await new Promise((resolve, reject) => {
        let output = '';
        const timer = setTimeout(() => reject(new Error('API fixture did not start within 120 seconds')), 120000);
        host.stdout.on('data', chunk => {
            output += chunk;
            for (const line of output.split(/\r?\n/).slice(0, -1)) {
                if (line.startsWith('AUTH_UI_SESSION:')) { clearTimeout(timer); resolve(JSON.parse(line.slice(16))); }
                else if (line.startsWith('PASS')) console.log(line);
            }
            output = output.slice(output.lastIndexOf('\n') + 1);
        });
        host.once('exit', code => { clearTimeout(timer); reject(new Error(`API fixture exited with ${code}`)); });
        host.once('error', reject);
        host.stderr.on('data', chunk => process.stderr.write(chunk));
    });
    vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5190', '--strictPort'], {
        cwd: 'frontend/clinic-management-client', windowsHide: true, stdio: 'ignore',
        env: { ...process.env, VITE_API_BASE_URL: session.baseUrl.replace(/\/$/, '') + '/api' },
    });
    for (let i = 0; i < 100; i++) {
        try { if ((await fetch('http://127.0.0.1:5190')).ok) break; } catch {}
        await delay(200);
    }
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://fonts.gstatic.com/**', route => route.abort());
    await page.goto('http://127.0.0.1:5190/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Đăng nhập Cổng Bệnh Nhân' }).waitFor();
    await page.screenshot({ path: '.tmp/auth-login-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.getByText('Vui lòng nhập tên đăng nhập.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Quên mật khẩu?' }).click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', { name: 'Đã hiểu' }).click();
    await page.getByRole('tab', { name: 'Đăng ký tài khoản', exact: true }).click();
    await page.getByLabel('Họ và tên', { exact: true }).waitFor();
    await page.screenshot({ path: '.tmp/auth-register-desktop.png', fullPage: true });
    for (const width of [1024, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `No horizontal overflow at ${width}px`);
        if (width === 390) await page.screenshot({ path: '.tmp/auth-register-mobile.png', fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    const username = 'ui_' + randomUUID().replaceAll('-', '').slice(0, 12);
    const email = username + '@example.test';
    const password = 'Ui-' + randomUUID();
    async function fillRegistration(name = username, address = email) {
        await page.getByLabel('Họ và tên', { exact: true }).waitFor();
        await page.getByLabel('Tên đăng nhập', { exact: true }).fill(name);
        await page.getByLabel('Họ và tên', { exact: true }).fill('Nguyễn Văn Kiểm Thử');
        await page.getByLabel('Số điện thoại di động', { exact: true }).fill('0912345678');
        await page.getByLabel('Địa chỉ email', { exact: true }).fill(address);
        await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
        await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill(password);
        await page.getByRole('checkbox').check();
    }
    await fillRegistration();
    await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('Mismatch');
    await page.getByRole('button', { name: 'Đăng ký tài khoản', exact: true }).click();
    await page.getByText('Mật khẩu xác nhận chưa khớp.').waitFor();
    await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
    assert.equal(await page.getByLabel('Mật khẩu', { exact: true }).getAttribute('type'), 'text');
    await page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click();
    await page.getByRole('button', { name: 'Đăng ký tài khoản', exact: true }).click();
    await page.waitForURL('**/booking');
    registered = { username, email };
    assert(await page.evaluate(() => Boolean(sessionStorage.getItem('accessToken')) && !localStorage.getItem('accessToken')));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Tài khoản', exact: true }).waitFor();
    const patientRefresh = await page.evaluate(() => sessionStorage.getItem('refreshToken'));
    await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).click();
    await page.waitForURL('**/login');
    assert(await page.evaluate(() => !sessionStorage.getItem('accessToken') && !localStorage.getItem('accessToken')));
    const revoked = await page.request.post(session.baseUrl + 'api/auth/refresh', { data: { refreshToken: patientRefresh } });
    assert.equal(revoked.status(), 401);
    console.log('PASS real API registration, session restoration, logout and refresh revocation');
    await page.getByRole('tab', { name: 'Đăng ký tài khoản', exact: true }).click();
    await fillRegistration();
    await page.getByRole('button', { name: 'Đăng ký tài khoản', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Tài khoản đã tồn tại.' }).waitFor();
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username + '_other');
    await page.getByRole('button', { name: 'Đăng ký tài khoản', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Email đã tồn tại.' }).waitFor();
    await page.getByRole('tab', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('heading', { name: 'Đăng nhập Cổng Bệnh Nhân' }).waitFor();
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
    await page.getByLabel('Mật khẩu', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Tên đăng nhập hoặc mật khẩu không đúng.' }).waitFor();
    console.log('PASS backend duplicate username/email and incorrect password errors');
    await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await page.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập trên thiết bị này' }).check();
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL('**/booking');
    assert(await page.evaluate(() => Boolean(localStorage.getItem('accessToken')) && !sessionStorage.getItem('accessToken')));
    const anotherTab = await context.newPage();
    await anotherTab.goto('http://127.0.0.1:5190/booking', { waitUntil: 'domcontentloaded' });
    await anotherTab.getByRole('button', { name: 'Tài khoản', exact: true }).waitFor();
    await anotherTab.close();
    console.log('PASS remember-me persists login across tabs');
    await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).click();
    await page.waitForURL('**/login');
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill('testadmin');
    await page.getByLabel('Mật khẩu', { exact: true }).fill(session.password);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL('**/internal/dashboard');
    const previousRefresh = await page.evaluate(() => sessionStorage.getItem('refreshToken'));
    await page.evaluate(() => sessionStorage.setItem('accessToken', 'expired-test-token'));
    await page.goto('http://127.0.0.1:5190/internal/departments', { waitUntil: 'domcontentloaded' });
    await page.getByRole('cell', { name: 'Noi tong quat', exact: true }).waitFor();
    const currentRefresh = await page.evaluate(() => sessionStorage.getItem('refreshToken'));
    assert.notEqual(previousRefresh, currentRefresh);
    assert(await page.evaluate(() => !localStorage.getItem('accessToken')));
    assert.deepEqual(pageErrors, []);
    console.log('PASS admin redirect and real JWT refresh preserves session-only storage');
    await page.setViewportSize({ width: 1440, height: 600 });
    const sidebarLogout = page.getByRole('button', { name: 'Đăng xuất', exact: true });
    const logoutBounds = await sidebarLogout.boundingBox();
    assert(logoutBounds && logoutBounds.y >= 0 && logoutBounds.y + logoutBounds.height <= 600, 'Sidebar logout remains visible on short screens');
    await page.screenshot({ path: '.tmp/admin-logout-desktop.png', fullPage: true });
    await sidebarLogout.click();
    await page.waitForURL('**/internal/login');
    assert(await page.evaluate(() => !sessionStorage.getItem('accessToken') && !localStorage.getItem('accessToken')));
    const adminRevoked = await page.request.post(session.baseUrl + 'api/auth/refresh', { data: { refreshToken: currentRefresh } });
    assert.equal(adminRevoked.status(), 401);
    await page.goto('http://127.0.0.1:5190/internal/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/login');
    console.log('PASS admin sidebar logout clears credentials, revokes refresh token and blocks protected pages');

    async function loginAdmin() {
        await page.getByRole('heading', { name: 'Đăng nhập Cổng Bệnh Nhân' }).waitFor();
        await page.getByLabel('Tên đăng nhập', { exact: true }).fill('testadmin');
        await page.getByLabel('Mật khẩu', { exact: true }).fill(session.password);
        await page.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập trên thiết bị này' }).check();
        await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
        await page.waitForURL('**/internal/dashboard');
    }
    await loginAdmin();
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileRefresh = await page.evaluate(() => localStorage.getItem('refreshToken'));
    await page.getByRole('button', { name: 'Tài khoản quản trị' }).click();
    await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).waitFor();
    await page.screenshot({ path: '.tmp/admin-logout-mobile.png', fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).click();
    await page.waitForURL('**/internal/login');
    assert(await page.evaluate(() => !localStorage.getItem('refreshToken') && !sessionStorage.getItem('refreshToken')));
    assert.equal((await page.request.post(session.baseUrl + 'api/auth/refresh', { data: { refreshToken: mobileRefresh } })).status(), 401);
    console.log('PASS mobile admin account menu logs out remembered sessions');

    await loginAdmin();
    const offlineRefresh = await page.evaluate(() => localStorage.getItem('refreshToken'));
    await page.route('**/api/auth/logout', route => route.abort('connectionfailed'));
    await page.getByRole('button', { name: 'Tài khoản quản trị' }).click();
    await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).click();
    await page.waitForURL('**/internal/login');
    assert(await page.evaluate(() => !localStorage.getItem('accessToken') && !sessionStorage.getItem('accessToken')));
    await page.unroute('**/api/auth/logout');
    await page.request.post(session.baseUrl + 'api/auth/logout', { data: { refreshToken: offlineRefresh } });
    assert.deepEqual(pageErrors, []);
    console.log('PASS admin logout clears local credentials when the server is unreachable');
    console.log('SUCCESS auth UI: real API/SQL Server flows and responsive layouts passed');
} catch (error) {
    await page?.screenshot({ path: '.tmp/auth-ui-failure.png', fullPage: true }).catch(() => {});
    throw error;
} finally {
    await browser?.close();
    vite?.kill();
    host.stdin.end(JSON.stringify(registered || {}) + '\n');
    const completed = await Promise.race([hostFinished.then(code => ({ code })), delay(15000).then(() => null)]);
    if (!completed) host.kill();
    else if (completed.code !== 0) process.exitCode = 1;
}
