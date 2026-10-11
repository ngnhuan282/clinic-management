# UI refresh verification fixture

This disposable fixture runs the existing backend against a randomly named SQL Server LocalDB database. It calls `Database.MigrateAsync()` and checks the migration history; it never uses `EnsureCreated` or generates a replacement schema from the model.

```powershell
dotnet build tests/UiRefreshVerification -c Release
node tests/UiRefreshVerification/smoke.mjs
```

The smoke runner suppresses the temporary credentials in the fixture's IPC record, reports verification results, and shuts down the API and deletes its own database. Browser verification can instead start the console project directly and keep its standard input open:

```powershell
dotnet run --no-build --no-restore -c Release --project tests/UiRefreshVerification
```

The `UI_FIXTURE:` JSON line is intended only for a test driver. It contains the API URL, random fixture password, usernames, record IDs, catalog names, and dates. Do not print that line or authentication responses in test output. No access or refresh tokens are serialized in fixture metadata.

Supported standard-input commands:

- `{"command":"state"}` returns non-secret `UI_STATE:` record counts.
- `{"command":"stop"}` or an empty line stops the API and removes the generated database.

The API allows CORS from `http://127.0.0.1:5190`. It runs in Development with HTTP loopback and `AuthCookie:Secure=false`; production cookie behavior is unchanged. The API JWT key and fixture passwords are random for every run.

All identities except the bootstrap Admin are registered with the auth API. Staff roles and doctor-account links use their server APIs. Patient profiles are created by online booking and the appointment patient-profile API, then read and updated through `/api/patients/me`. Catalogs, published doctor shifts, normal and DepartmentHead schedule requests, review moderation, lab orders, and lab results use the existing APIs.

Historical Completed appointments are fixture rows, so this fixture does not claim to verify the separate check-in and examination workflow. A fixture-only Admin doctor profile and own request exercise the `CanReview` and self-review contract because there is no doctor-profile creation API for this case. These rows are inserted only after the real migration chain completes.

The fixture verifies real 401/403 responses, foreign laboratory record exclusion, Admin self-review protection, DepartmentHead scope for filters and IDs, review ownership/Completed/duplicate rules, and hidden review exclusion. It seeds more than ten rows for diseases, lab types, schedule requests, patient review appointments, and patient lab results to support browser pagination checks.

Passing on this fresh database does not establish that upgrading an existing database with incompatible PatientBooks/check-in data works. Existing migration-upgrade findings must be reported separately.

For desktop/mobile browser verification, run `node tests/ui-refresh.mjs` after building this fixture. Set `PLAYWRIGHT_MODULE` to an installed Playwright ESM module path if it is outside the repository. The driver starts its own Vite server on port 5190 and Edge headless, and accepts JSON commands on standard input:

```json
{"command":"run","stage":"Profile"}
{"command":"run","stage":"UnbookedProfile"}
{"command":"run","stage":"Reviews"}
{"command":"run","stage":"Cashier"}
{"command":"run","stage":"CashierRole"}
{"command":"run","stage":"AccountMenu"}
{"command":"stop"}
```

Other page stages are `DoctorSchedules`, `LabTypes`, `ScheduleReview`, `Diseases`, `DiseasesRace`, and `LabResults`. Each mutation stage uses only the disposable database. Completed verification stages report `UI_DONE`; a failed assertion reports `UI_FAILED`. Stop the driver to close the owned servers and remove the fixture database. Screenshots are local artifacts in `.tmp/ui-refresh/`.

`AccountMenu` checks the existing user response and profile form, login/reload/account switching/logout in the same browser, patient destinations and staff menu, no extra user reads, keyboard/click-away behavior, long Vietnamese names and tooltip, and desktop/mobile bounds. It changes only a fixture user's full name through the existing profile API; it does not modify the application's database or authentication configuration.

Loading/error/retry verification uses `inspect` to open a logged-in page followed by `states` with the existing read endpoint. It delays or aborts a real request, then checks that explicit retry reaches the actual backend successfully; it does not fulfill requests with mocked responses.
