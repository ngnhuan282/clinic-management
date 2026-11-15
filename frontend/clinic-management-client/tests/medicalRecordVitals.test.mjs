import assert from "node:assert/strict";
import test from "node:test";
import { getVitalSignReadings, getVitalSignsError, normalizeVitalSigns } from "../src/utils/medicalRecordVitals.js";

test("vital signs stay optional and never turn an empty field into zero", () => {
    const empty = { temperature: null, bloodPressure: null, weightKg: null, heightCm: null };
    assert.deepEqual(normalizeVitalSigns({}), empty);
    assert.deepEqual(normalizeVitalSigns({ temperature: " ", bloodPressure: " ", weightKg: "", heightCm: null }), empty);
    assert.equal(getVitalSignsError({}), "");
    assert.ok(getVitalSignReadings({}).every(field => field.value === "Chưa ghi nhận"));
});

test("measured values normalize consistently for requests and paper-book confirmation", () => {
    assert.deepEqual(normalizeVitalSigns({ temperature: "36.50", bloodPressure: " 120 / 80 ", weightKg: "60.25", heightCm: "170" }),
        { temperature: 36.5, bloodPressure: "120/80", weightKg: 60.25, heightCm: 170 });
    assert.equal(getVitalSignsError({ temperature: "36.50", bloodPressure: " 120 / 80 ", weightKg: "60.25", heightCm: "170" }), "");
});

test("negative, nonnumeric, overflow and excess precision values cannot be saved", () => {
    for (const key of ["temperature", "weightKg", "heightCm"]) {
        for (const value of [-1, 0, "invalid", Infinity, 1000, key === "temperature" ? 36.55 : 60.125]) {
            assert.notEqual(getVitalSignsError({ [key]: value }), "", `${key}: ${value}`);
        }
    }
    assert.equal(getVitalSignsError({ temperature: 999.9, weightKg: 999.99, heightCm: 999.99 }), "");
});

test("blood pressure is a pair of positive integer readings, not free text", () => {
    for (const value of ["120", "120/0", "0/80", "-120/80", "120/80/70", "120.5/80", "1000/80", "normal", "120/80\nextra"]) {
        assert.notEqual(getVitalSignsError({ bloodPressure: value }), "", value);
    }
    assert.equal(getVitalSignsError({ bloodPressure: "1/1" }), "");
    assert.equal(getVitalSignsError({ bloodPressure: "999/999" }), "");
});

test("read-only values include the matching units and do not invent missing measurements", () => {
    const readings = getVitalSignReadings({ temperature: 36.5, bloodPressure: "120/80", weightKg: 60.25 });
    assert.deepEqual(readings.map(field => field.value), ["36,5 °C", "120/80 mmHg", "60,25 kg", "Chưa ghi nhận"]);
});
