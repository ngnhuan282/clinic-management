# A7 implementation handoff — 2026-10-19

Branch: `feat/department-head-statistics`. Base: refreshed `origin/main`, `216303a27e0afd8b6675c4eb7b4ce9bd0e922c3f`. No remote `develop` exists. No push, merge, PR or commit was performed. The independently changed specification documents (v1.6 deleted / v1.7plus untracked) were left untouched and are not part of A7.

Follow-up requested by the user: the duplicate invoice migration, three frontend test failures, six lint errors/two warnings and the large production bundle have been repaired. The table below reports the current results; the original model-schema workaround is no longer required for A7. The separate legacy `Voided` book status issue is described below.

## Delivered

- `GET /api/department-head/statistics`, policy `reports.departmentStatistics`, requiring DepartmentHead plus the current database permission.
- Own-department scope derived from authenticated `Doctors.UserId`; missing/inactive doctor or department is 403/1010, never whole-clinic data.
- Distinct `MedicalRecord.AppointmentId` count using clinic-local SQL `date` `ExaminationDate`, for InProgress/Completed appointments. Pending/Approved counts come only from `DoctorScheduleRequests`, by `WorkDate`, including Admin-reviewed requests.
- FluentValidation 11.11.0, existing ApiResponse envelope with optional field errors, A7-only model-binding response normalization, existing JWT/global error handling.
- Permission data migration and EF seed snapshot, plus matching demo-role grants. No schema change. The destructive demo seed was edited for permission consistency but was not run against an application database.
- Internal Portal **Thống kê khoa** at `/internal/department-statistics`: dates, three cards, refresh, loading, explicit empty state, error/retry, account isolation and cancellation of superseded requests.
- Contract **A7/1.0**: [API contract](api/department-head-statistics.md), matching Swagger DTOs, query parameters, permission/version metadata and response statuses.

Main implementation: `DepartmentHeadStatisticsController`, `DepartmentStatisticsService`, `DepartmentScope.RequireHeadDepartmentAsync`, `DepartmentStatisticsRepository`, shared `IVisitReportQuery`/`VisitReportQuery`, `DepartmentStatisticsPage.jsx`, `useDepartmentStatistics.js`. Verification: `A7Checks.cs`, `departmentStatistics.test.mjs`, `tests/a7-ui.mjs`.

## Actual verification results

Commands are relative to the repository root, except npm commands run in `frontend/clinic-management-client`.

| Command | Actual result |
| --- | --- |
| `dotnet build backend/ClinicManagement/ClinicManagement.csproj --no-restore` | Passed, 0 warnings / 0 errors after restore. |
| `dotnet build tests/Week2Verification/Week2Verification.csproj --no-restore` | Passed. The initial run warned NU1900 because sandbox network access blocked NuGet audit; restoring the test project with network access resolved dependencies. |
| `dotnet run --project tests/Week2Verification --no-restore -- --a7` | Passed **78 checks** using real SQL Server migrations, including A7 permission Up/Down, idempotence and a non-6 DepartmentHead RoleId. |
| `dotnet run --project tests/Week2Verification --no-restore -- --billing-migrations-only` | Passed **9 checks**: fresh migration chain, insurance values and nullable appointment links survive upgrade/downgrade/reapply; existing invoice type backfilled as Standard. |
| `dotnet run --project tests/Week2Verification --no-build --no-restore -- --a4-api` | Passed **42 checks** with real migrations, including head clinical access, cross-department denial, no self-approval, Admin approval of head requests, conflicting and concurrent approvals. |
| `node tests/a7-ui.mjs --production` (with installed Playwright module path) | Passed on headless Edge against production chunks and a migrated SQL Server DB: full A7 behavior, staff `/profile`, Admin dashboard load/refresh, billing selection, per-patient insurance reset, stage selection reset and encoded history search. No uncaught browser exceptions. |
| `node --test --experimental-test-isolation=none tests/departmentStatistics.test.mjs` | Passed **4/4** A7 frontend tests. |
| `npm test` | **61 passed / 0 failed**, including the three repaired profile/review/billing access cases. |
| `npm run lint` | Passed: **0 errors / 0 warnings**. |
| `npx eslint src/api/departmentStatisticsApi.js src/hooks/useDepartmentStatistics.js src/pages/internal/DepartmentStatisticsPage.jsx src/utils/departmentStatistics.js src/routes/roleAccess.js src/routes/AppRoutes.jsx src/layouts/InternalLayout.jsx src/utils/errorHandler.js` | Passed for all new/modified A7 frontend code. |
| `npm run build` | Passed with no oversized-chunk warning. Pages load with React.lazy/Suspense; billing UI dependencies are split, with module initialization order preserved. |
| `git diff --check` | Passed. |

The SQL tests use real JWT authentication, live role permissions and the SQL Server provider, not an in-memory approximation. They verify two departments, query/header/body tampering, missing/inactive scope, revoked permissions, wrong roles even with the permission, seven-field DTO shape, request WorkDate/reviewer semantics, generated-schedule non-duplication, multiple invoice/service rows per visit, date boundaries, zeroes and actual source-table failure returning 500.

`20261015163002_AddInvoiceInsuranceAndAdjustmentFields` now alters the existing percentage precision and adds only adjustment fields. Its Down preserves insurance columns and nullable AppointmentId owned by earlier migrations. Previously applied migration history is not rewritten; databases that already applied it skip it normally. All checks use disposable databases, without migrating the configured application database.

The broader `--migrations-only` command passes the new invoice cases, then reproduces the separate existing legacy-book error: `20261005080400_UpdatePatientBookStatuses` rejects a stored `Voided` status (SQL 547). This is already recorded in `docs/WEEK6-A6.md`; mapping Voided to Lost/Replaced needs a business decision, so no historical status was silently changed. Fresh databases and the invoice-specific populated upgrade path pass. Current `ExaminationDate` is SQL `date`, so time-of-day preservation cannot be tested or claimed.

MUI Stack layout props were moved into `sx`; the billing page uses current Ant Design Space/Statistic props. The missing billing `selectRecord` handler now resets insurance when selecting another row; changing stage/refresh also hides stale selections. Billing and dashboard requests are abortable and scoped to user/filter/revision. `/profile` uses the existing shared ProfilePage for authenticated staff/custom users as well as patients; `/my-reviews` is wired to the patient-only own-review page. Review moderation and cashier menu entries enforce their explicit role restrictions.

Production splitting uses Rolldown `strictExecutionOrder` to preserve module initialization across the billing dependency chunks. The final browser check exercises the built assets, not only the development server, including the previously failing billing page.

Node child-process restrictions required running the full test runner and browser outside the sandbox. Build outputs, logs, transient test credentials and browser artifacts are excluded from the A7 change set.

## Integration and demo

No reusable Report visit aggregate existed at the base. Thoại can use `IVisitReportQuery.CountAsync` with a mandatory, already-authorized department to obtain the exact same formula. Core data is sufficient; there is no missing runtime source dependency. Team confirmation is still needed for the baseline's InProgress inclusion, ExaminationDate meaning and historical department transfers. No approval from Thoại or the team is claimed.

For an existing development database with a valid migration history, apply the new permission migration through the normal EF workflow, then run backend and frontend as in the API contract. Sign in as an active, linked DepartmentHead and open **Thống kê khoa**. An empty selected period correctly shows zeroes. Do not run the destructive demo seed over existing data to enable this feature. Fresh migration-based installation now passes; populated databases with old Voided books still require the separate compatibility decision above.

The independent reproducible demo/check is `dotnet run --project tests/Week2Verification -- --a7`; the browser demo/check is `node tests/a7-ui.mjs --production` after building the verification project and making Playwright available through `PLAYWRIGHT_MODULE` (matching the repository's other browser scripts). Both clean up their own API process and random database. Rebuild the frontend with the normal environment after the production browser test to restore normal build artifacts.

Suggested commit: `feat: add scoped department-head statistics`.

Suggested PR title: `feat: add department-head statistics for visits and schedule requests`.

Suggested PR body:

> Add an own-department statistics endpoint and Internal Portal page with inclusive date filters. Resolve scope from the authenticated doctor's database profile, aggregate distinct visits and Pending/Approved shift requests in SQL, and freeze A7/1.0 across BE/FE/Swagger/docs. Preserve clinical access and schedule-review rules.
>
> Validation: 78 A7 SQL Server checks, 42 A4 regression checks, 9 invoice migration checks, all 61 frontend tests, full lint, backend/frontend builds and production browser E2E passed. SQL checks now use the real migration chain. The separate legacy-book migration fixture still rejects Voided statuses. Team confirmation of the shared visit baseline is pending.
