import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readSession, saveSession, clearSession } from '../frontend/clinic-management-client/src/utils/authStorage.js';

class MemoryStorage {
    data = new Map();
    getItem(key) { return this.data.get(key) ?? null; }
    setItem(key, value) { this.data.set(key, String(value)); }
    removeItem(key) { this.data.delete(key); }
}
const credentials = { accessToken: 'access', refreshToken: 'refresh', user: { userId: 4, role: 'Patient' } };
beforeEach(() => {
    globalThis.localStorage = new MemoryStorage();
    globalThis.sessionStorage = new MemoryStorage();
});

test('without remember-me credentials remain in session storage', () => {
    saveSession(credentials);
    assert.equal(localStorage.getItem('accessToken'), null);
    assert.equal(sessionStorage.getItem('accessToken'), 'access');
    assert.deepEqual(readSession(), { ...credentials, remember: false });
});
test('remember-me survives a new browser tab session', () => {
    saveSession({ ...credentials, remember: true });
    globalThis.sessionStorage = new MemoryStorage();
    assert.deepEqual(readSession(), { ...credentials, remember: true });
});
test('switching persistence removes the previous credentials', () => {
    saveSession({ ...credentials, remember: true });
    saveSession({ ...credentials, accessToken: 'new-session' });
    assert.equal(localStorage.getItem('refreshToken'), null);
    assert.equal(localStorage.getItem('user'), null);
    assert.equal(readSession().accessToken, 'new-session');
});
test('damaged saved user data does not crash startup', () => {
    localStorage.setItem('accessToken', 'stale');
    localStorage.setItem('user', '{bad json');
    assert.equal(readSession(), null);
});
test('logout removes credentials from both storage locations', () => {
    saveSession({ ...credentials, remember: true });
    sessionStorage.setItem('refreshToken', 'stale-session');
    clearSession();
    assert.equal(readSession(), null);
    assert.equal(sessionStorage.getItem('refreshToken'), null);
    assert.equal(localStorage.getItem('refreshToken'), null);
});
test('existing local-storage sessions remain compatible', () => {
    localStorage.setItem('accessToken', 'legacy');
    localStorage.setItem('user', JSON.stringify(credentials.user));
    assert.equal(readSession().accessToken, 'legacy');
    assert.equal(readSession().remember, true);
});
