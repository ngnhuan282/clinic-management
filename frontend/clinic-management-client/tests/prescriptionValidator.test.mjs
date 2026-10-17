import assert from "node:assert/strict";
import test from "node:test";
import { getPrescriptionTextError, PRESCRIPTION_TEXT_LIMITS } from "../src/validators/prescriptionValidator.js";

for (const [field, limit] of Object.entries(PRESCRIPTION_TEXT_LIMITS)) {
    test(`${field} accepts the storage boundary and rejects one extra character`, () => {
        assert.equal(getPrescriptionTextError(field, "a".repeat(limit)), "");
        const error = getPrescriptionTextError(field, "a".repeat(limit + 1));
        assert(error.includes(String(limit)));
        assert(error.length > 0);
    });
}

test("length validation leaves required-field validation to the form", () => {
    for (const value of [undefined, null, ""]) assert.equal(getPrescriptionTextError("dosage", value), "");
});

test("UTF-16 characters and whitespace count consistently with input and backend limits", () => {
    const pair = "\uD83D\uDC8A";
    assert.equal(getPrescriptionTextError("dosage", pair.repeat(50)), "");
    assert.notEqual(getPrescriptionTextError("dosage", `${pair.repeat(50)}a`), "");
    assert.notEqual(getPrescriptionTextError("instructions", ` ${"a".repeat(255)}`), "");
});
