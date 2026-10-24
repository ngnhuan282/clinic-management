# A7 — Department head statistics

Contract baseline **A7/1.0**, 2026-10-19. This is the implementation baseline shared by BE, FE, Swagger and tests. There is no evidence yet of confirmation by Thoại or the team. Record any later change to fields, permissions, counting rules or dates in the changelog below before integrating it.

## Endpoint and access

`GET /api/department-head/statistics?fromDate=2026-10-01&toDate=2026-10-31`

JWT bearer authentication; policy `reports.departmentStatistics` requires **DepartmentHead** and the matching current database role permission. Each user keeps one `RoleId`. Migration `20261019000000_AddDepartmentStatisticsPermission` inserts a permission and grants it to the role located by `RoleName`, without changing tables or adding a second role to users. Existing clinical and schedule-review policies are preserved.

Backend resolves the department from authenticated `userId` → `Doctors.UserId` → `Doctors.DepartmentId`, requiring an active doctor and active department. An absent/inactive profile or department returns **403 / 1010**. The resolved department is mandatory in every aggregate query; there is no whole-clinic fallback. Admin's `/api/admin-dashboard/*` remains Admin-only and separate.

The endpoint accepts no department selector. Unknown query parameters, request-body fields and headers (including `DepartmentId`) have no effect on scope. They never override the database profile. FE reads the department name/ID only from the response. No department comes from localStorage.

## Period

| Parameter | Type | Rule |
| --- | --- | --- |
| `fromDate` | optional string, `yyyy-MM-dd` | Supply together with `toDate`. |
| `toDate` | optional string, `yyyy-MM-dd` | Inclusive; on/after `fromDate`, before `9999-12-31`. |

Omitting both uses the **full current calendar month in Asia/Ho_Chi_Minh (UTC+07)**. Supplying only one, empty strings, an invalid calendar date, a datetime or a reversed range returns **400 / 1001**, with errors by field. There is no existing operational-report period limit to reuse, so v1.0 has no length limit. The final representable date is excluded to allow a safe exclusive upper bound.

Visits use `[fromDate 00:00, (toDate + 1 day) 00:00)` against `ExaminationDate`, which is **SQL `date` mapped to C# `DateTime`**; the current schema does not retain a time of day. Existing `MedicalRecordService.CreateAsync` writes `Appointment.AppointmentDate.Date`, a **clinic-local calendar value**; it is not converted from UTC. `CreatedAt`/`UpdatedAt` are UTC audit timestamps and are not used. Requests use inclusive SQL `date` `WorkDate`, without a timezone conversion. The visit bounds also cover the complete last day if a future agreed schema stores times.

## Frozen response and counting rules

Success uses existing `ApiResponse<DepartmentStatisticsResponse>`: `code` int `1000`, `message` string, `result` object. There are exactly these seven result fields:

| Field | JSON type | Meaning |
| --- | --- | --- |
| `departmentId` | integer (Int32) | Authorized current department from the doctor's database profile. |
| `departmentName` | string | Database department name. |
| `fromDate`, `toDate` | strings, `yyyy-MM-dd` | Effective inclusive period. |
| `visitCount` | integer (Int32, nonnegative) | Distinct `MedicalRecords.AppointmentId` in the period, with appointment status `InProgress` or `Completed`. |
| `pendingScheduleRequestCount` | integer (Int32, nonnegative) | `DoctorScheduleRequests.RequestId` with `Status = Pending`, by `WorkDate`. |
| `approvedScheduleRequestCount` | integer (Int32, nonnegative) | `DoctorScheduleRequests.RequestId` with `Status = Approved`, by `WorkDate`. |

Visits require both the medical-record doctor and the appointment doctor to belong to the authorized department. `AppointmentId` has an existing unique index in `MedicalRecords`. A visit with several invoices, payments, diagnoses or service rows is counted once; these tables are never joined by the visit query. An appointment without a medical record is not a visit. Pending/Confirmed/Cancelled appointments do not count even if inconsistent legacy data includes a record.

Requests are scoped through `DoctorScheduleRequests.Doctor.DepartmentId`. Each request row is counted once. Neither `CreatedAt`, `ReviewedAt` nor `ReviewerId` filters the period or ownership. Admin-reviewed requests and requests made by the head remain visible in the counts. Rejected/Cancelled requests do not count. A generated `DoctorSchedule` is never added to Approved. The existing review workflow still prevents heads from approving their own or other heads' requests and requests from another department.

Counts execute as database aggregates using EF Core/SQL Server, without loading records for client-side counting or N+1 queries. Historical data follows doctors' **current** departments because the core model has no department snapshot.

## Examples

200 with data:

```json
{"code":1000,"message":"Success","result":{"departmentId":1,"departmentName":"Noi tong quat","fromDate":"2026-10-01","toDate":"2026-10-31","visitCount":3,"pendingScheduleRequestCount":2,"approvedScheduleRequestCount":2}}
```

200 without data:

```json
{"code":1000,"message":"Success","result":{"departmentId":1,"departmentName":"Noi tong quat","fromDate":"2026-10-01","toDate":"2026-10-31","visitCount":0,"pendingScheduleRequestCount":0,"approvedScheduleRequestCount":0}}
```

400 validation (example: only `fromDate` supplied):

```json
{"code":1001,"message":"Invalid request","result":null,"errors":{"toDate":["Provide both dates in yyyy-MM-dd format."]}}
```

401 unauthenticated, invalid or expired token:

```json
{"code":1002,"message":"Unauthenticated","result":null}
```

403 wrong role or revoked permission:

```json
{"code":1003,"message":"You do not have permission","result":null}
```

403 absent/inactive doctor or department:

```json
{"code":1010,"message":"An active doctor profile and department are required","result":null}
```

500 when the data source fails:

```json
{"code":9999,"message":"Uncategorized error","result":null}
```

`ApiResponse.Errors` is an optional extension to the existing envelope and is omitted when null, preserving existing endpoint JSON. A7 FluentValidation exceptions and model-binding failures use 400/1001; JWT challenge/forbidden and the global exception handler keep the same envelope. Existing endpoints retain their model-binding response factory. The existing exception handler logs unexpected failures with `TraceIdentifier`; the project does not expose a response-body `traceId`. Errors never expose SQL, exception stacks or patient data.

## Integration with Thoại's Report module

No shared operational-visit aggregation was present at base `216303a`. The existing Admin dashboard counts completed appointments for its own dashboard; it does not define a reusable visit contract and remains unchanged. A7 therefore implements the proposed medical-record baseline using the actual field `ExaminationDate` (the model has no `VisitDate`).

Reuse `IVisitReportQuery.CountAsync(int departmentId, DateOnly fromDate, DateOnly toDate, CancellationToken)` → `VisitReportQuery`. It requires a positive department ID and executes the same distinct-appointment formula as A7. `DepartmentStatisticsService` resolves/authorizes the department before calling it; the query is not a public endpoint and is not an authorization substitute. Thoại's future Report service must resolve its authorized scope first and call this shared query; do not derive visits from billing or implement a second formula.

The underlying data is sufficient and A7 has no missing runtime report dependency. Still awaiting business confirmation: inclusion of `InProgress` alongside `Completed`; use of the existing clinic-local `ExaminationDate`; attribution to doctors' current departments after transfers. No team approval is claimed. If a different agreed Report definition arrives, update this one shared query, BE/FE/OpenAPI/tests and this contract together, with a changelog entry.

## Run and verify

Apply migrations to the intended development database with its normal local configuration (do not rerun the destructive demo seed over existing data):

```powershell
dotnet ef database update --project backend/ClinicManagement
dotnet run --project backend/ClinicManagement
cd frontend/clinic-management-client
npm run dev
```

Sign in at `/internal/login` as a DepartmentHead linked to an active doctor and department, with the new permission. Open **Thống kê khoa** at `/internal/department-statistics`, select dates, click **Áp dụng** or **Làm mới**. Loading, empty results, field errors, source failure and retry are distinct states. The shared Axios client handles token refresh/logout; permission 403 uses the existing `/403` route, while missing-profile 1010 explains the setup error. Responses are cancelled/guarded by account, period and refresh revision, with no persistent statistics cache.

Automated checks (the repository uses an executable verification harness, not xUnit):

```powershell
dotnet build backend/ClinicManagement
dotnet run --project tests/Week2Verification -- --a7
dotnet run --project tests/Week2Verification -- --a4-api
cd frontend/clinic-management-client
npm test
npm run lint
npm run build
```

`--a7` creates and deletes its own random SQL Server LocalDB database and applies the full migration chain before testing real JWT/authorization/relational queries. It also verifies A7's permission Up/Down SQL independently in a rollback transaction, including idempotence and a DepartmentHead role whose ID is not 6. It simulates source failure only inside that disposable database and never seeds or mutates the configured application database. The duplicate invoice-column migration has been repaired; the normal migration-based A7 and A4 checks now pass. `--model-schema` remains an explicit diagnostic fallback, not a requirement for A7.

`--billing-migrations-only` additionally verifies that upgrading, downgrading and reapplying the invoice migration retain existing insurance amounts and nullable appointment links. The broader `--migrations-only` legacy fixture still encounters the separate, previously documented `PatientBooks.Status = Voided` compatibility problem in `20261005080400_UpdatePatientBookStatuses`; no unconfirmed mapping to Lost/Replaced is performed.

`tests/a7-ui.mjs` starts the fixture with `--a7-ui` and checks real UI/API behavior in Playwright. `--production` builds and serves the split production assets for verification; `--model` selects the optional diagnostic fallback. Follow the module-path convention used by the other browser scripts (`PLAYWRIGHT_MODULE`, optional `BROWSER_CHANNEL`, default msedge). Build the verification project before running the browser script. After a production browser run, run the normal frontend build again to restore artifacts using your usual API environment.

## Changelog

- **A7/1.0 — 2026-10-19:** First implementation baseline: own-department endpoint, explicit report permission, three aggregate fields, inclusive clinic-local periods, FluentValidation/ApiResponse errors, portal page and shared mandatory-department visit query. Team confirmation pending; verification results and unrelated pre-existing failures are recorded in `docs/WEEK7-A7.md`.
- **Maintenance — 2026-10-19:** Repair duplicate invoice migration and frontend access/effect errors; add route-based loading and split the billing UI dependencies. The A7/1.0 API and metric definitions are unchanged. Current verification and remaining legacy-book limitations are recorded in `docs/WEEK7-A7.md`.
