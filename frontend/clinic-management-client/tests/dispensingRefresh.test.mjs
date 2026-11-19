import test from "node:test";
import assert from "node:assert/strict";
import { canKeepDispensingSnapshot } from "../src/utils/dispensingRefresh.js";

test("transient dispensing read failures preserve only an existing same-key snapshot", () => {
    for (const previous of [{ key: "a", value: {} }, { key: "a", pagedData: { items: [] } }]) {
        for (const error of [{}, { response: { status: 500 } }, { response: { status: 503 } }, { response: { status: 408 } }, { response: { status: 429 } }])
            assert.equal(canKeepDispensingSnapshot(previous, "a", error), true);
        assert.equal(canKeepDispensingSnapshot(previous, "different-session-or-prescription", {}), false);
    }
    for (const previous of [null, { key: "a", loading: true }, { key: "a", error: "failed" }])
        assert.equal(canKeepDispensingSnapshot(previous, "a", {}), false);
});

test("permission, missing resource and validation failures must clear dispensing snapshots", () => {
    for (const status of [400, 401, 403, 404, 409, 422])
        assert.equal(canKeepDispensingSnapshot({ key: "a", value: {} }, "a", { response: { status } }), false);
});
