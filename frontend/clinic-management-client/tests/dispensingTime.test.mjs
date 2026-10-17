import test from "node:test";
import assert from "node:assert/strict";
import { formatDispensedAt } from "../src/utils/dispensingTime.js";

test("zone-less dispensing timestamps keep their clinic-local time", () => {
    assert.equal(formatDispensedAt("2026-10-12T09:30:00"), "09:30 12/10/26");
    assert.equal(formatDispensedAt("2026-10-12T09:30:00.1234567"), "09:30 12/10/26");
});

test("explicit UTC dispensing timestamps convert to clinic time once", () => {
    assert.equal(formatDispensedAt("2026-10-12T02:30:00Z"), "09:30 12/10/26");
    assert.equal(formatDispensedAt("2026-10-12T02:30:00.123Z"), "09:30 12/10/26");
});

test("explicit timezone offsets are respected without appending another zone", () => {
    assert.equal(formatDispensedAt("2026-10-12T09:30:00+07:00"), "09:30 12/10/26");
    assert.equal(formatDispensedAt("2026-10-12T11:30:00+09:00"), "09:30 12/10/26");
    assert.equal(formatDispensedAt("2026-10-11T22:30:00-04:00"), "09:30 12/10/26");
});

test("late clinic-local times do not incorrectly roll into the next day", () => {
    assert.equal(formatDispensedAt("2026-10-12T23:30:00"), "23:30 12/10/26");
    assert.equal(formatDispensedAt("2026-10-12T00:15:00"), "00:15 12/10/26");
    assert.equal(formatDispensedAt("2026-10-11T17:15:00Z"), "00:15 12/10/26");
});

test("empty or invalid dispensing times do not break the detail page", () => {
    for (const value of [null, undefined, "", "  ", "not-a-date", 123])
        assert.equal(formatDispensedAt(value), "");
    assert.equal(formatDispensedAt(" 2026-10-12T09:30:00 "), "09:30 12/10/26");
});
