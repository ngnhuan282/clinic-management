import test from "node:test";
import assert from "node:assert/strict";
import { currentStatisticsMonth, readDepartmentStatistics, statisticsDateErrors } from "../src/utils/departmentStatistics.js";
import { canAccessPath, redirectForProtectedRoute } from "../src/routes/roleAccess.js";

test("A7 uses the full clinic month including leap years and December", () => {
    assert.deepEqual(currentStatisticsMonth("2028-02-20"), { fromDate: "2028-02-01", toDate: "2028-02-29" });
    assert.deepEqual(currentStatisticsMonth("2026-12-10"), { fromDate: "2026-12-01", toDate: "2026-12-31" });
});

test("A7 validates real calendar dates, paired dates, ordering and the supported upper bound", () => {
    for (const period of [
        { fromDate: "", toDate: "2026-10-31" },
        { fromDate: "2026-10-01", toDate: "" },
        { fromDate: "2026-02-29", toDate: "2026-03-01" },
        { fromDate: "2026-11-01", toDate: "2026-10-31" },
        { fromDate: "2026-1-01", toDate: "2026-10-31" },
        { fromDate: "2026-10-01", toDate: "9999-12-31" },
    ]) assert.ok(Object.keys(statisticsDateErrors(period)).length);
    assert.deepEqual(statisticsDateErrors({ fromDate: "2026-10-01", toDate: "2026-10-01" }), {});
});

test("A7 accepts actual zero counts and rejects missing or failed aggregate responses", () => {
    const result = { departmentId: 1, departmentName: "Nội", fromDate: "2026-10-01", toDate: "2026-10-31",
        visitCount: 0, pendingScheduleRequestCount: 0, approvedScheduleRequestCount: 0 };
    assert.equal(readDepartmentStatistics({ code: 1000, result }), result);
    for (const envelope of [null, { code: 9999, result }, { code: 1000, result: null },
        { code: 1000, result: { ...result, visitCount: undefined } },
        { code: 1000, result: { ...result, approvedScheduleRequestCount: -1 } }])
        assert.throws(() => readDepartmentStatistics(envelope));
});

test("A7 menu and route require DepartmentHead and its own permission", () => {
    const path = "/internal/department-statistics";
    const options = { allowedRoles: ["DepartmentHead"], allowedPermissions: ["reports.departmentStatistics"] };
    assert.equal(canAccessPath({ role: "DepartmentHead", permissions: ["reports.departmentStatistics"] }, path), true);
    assert.equal(canAccessPath({ role: "DepartmentHead", permissions: [] }, path), false);
    for (const role of ["Admin", "Doctor", "Patient", "Receptionist", "CustomReporter"]) {
        const user = { role, permissions: ["reports.departmentStatistics"], isAuthenticated: true };
        assert.equal(canAccessPath(user, path), false);
        assert.equal(redirectForProtectedRoute(user, path, options), "/403");
    }
    assert.equal(redirectForProtectedRoute({ isAuthenticated: false }, path, options), "/internal/login");
});
