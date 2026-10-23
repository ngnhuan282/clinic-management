import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { formatMedicalRecordPaperTime, formatMedicalRecordUtcTime } from "../src/utils/medicalRecordTime.js";

test("medical record UTC creation and version timestamps display once in clinic time", () => {
    for (const value of ["2026-10-23T12:10:00", "2026-10-23T12:10:00Z", "2026-10-23T12:10:00.1234567"])
        assert.equal(formatMedicalRecordUtcTime(value), "19:10 23/10/2026");
});

test("medical record paper confirmation without a zone is already clinic-local", () => {
    assert.equal(formatMedicalRecordPaperTime("2026-10-23T19:10:00"), "19:10 23/10/2026");
    assert.equal(formatMedicalRecordPaperTime("2026-10-23T19:10:00.1234567"), "19:10 23/10/2026");
});

test("both medical record timestamp formatters respect explicit UTC and offsets", () => {
    for (const format of [formatMedicalRecordUtcTime, formatMedicalRecordPaperTime]) {
        assert.equal(format("2026-10-23T12:10:00Z"), "19:10 23/10/2026");
        assert.equal(format("2026-10-23T19:10:00+07:00"), "19:10 23/10/2026");
        assert.equal(format("2026-10-23T21:10:00+09:00"), "19:10 23/10/2026");
    }
});

test("medical record UTC conversion rolls the date only when needed", () => {
    assert.equal(formatMedicalRecordUtcTime("2026-10-23T17:15:00"), "00:15 24/10/2026");
    assert.equal(formatMedicalRecordPaperTime("2026-10-23T23:30:00"), "23:30 23/10/2026");
    assert.equal(formatMedicalRecordPaperTime("2026-10-24T00:15:00"), "00:15 24/10/2026");
});

test("missing or invalid medical record timestamps never crash the audit panel", () => {
    for (const format of [formatMedicalRecordUtcTime, formatMedicalRecordPaperTime])
        for (const value of [null, undefined, "", "  ", "not-a-date", 123]) assert.equal(format(value), "-");
    assert.equal(formatMedicalRecordUtcTime(" 2026-10-23T12:10:00 "), "19:10 23/10/2026");
});

test("medical record audit time does not depend on the machine timezone", () => {
    const moduleUrl = new URL("../src/utils/medicalRecordTime.js", import.meta.url).href;
    const script = `import { formatMedicalRecordUtcTime as utc, formatMedicalRecordPaperTime as paper } from ${JSON.stringify(moduleUrl)};
        process.stdout.write(JSON.stringify([utc("2026-10-23T12:10:00"), paper("2026-10-23T19:10:00")]));`;
    for (const TZ of ["UTC", "America/New_York", "Asia/Ho_Chi_Minh"])
        assert.deepEqual(JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", script], {
            env: { ...process.env, TZ }, encoding: "utf8",
        })), ["19:10 23/10/2026", "19:10 23/10/2026"]);
});
