# D6: Patient Medical History

## Delivered Scope

The doctor opens **Lich su kham** from an assigned examination's editor or
record detail. History contains completed visits for the same `Patient`,
including visits by other doctors and visits recorded under replaced books.
The active examination editor also shows the saved prescription in its sidebar,
below the selected diagnoses. Returning from prescription editing refreshes this
preview without completing the visit and preserves unsaved clinical fields.
The preview uses the same loading, empty and error states as the record detail;
opening the prescription is disabled before the record is saved or while a stale
record conflict requires a reload. History still contains only completed visits.
The existing record detail screen is reused in read-only mode and includes
the full prescription, quantity, dosage and instructions. Search, inclusive
date filters and pagination are supported; newest visits come first.

Patients can open **Lich su kham** from their account menu at `/medical-records`.
The portal shows their own completed visits, filters and pagination. Each visit
opens a separate read-only page at `/medical-records/{medicalRecordId}`, including
the full prescription and browser printing of that record.
Patient detail also includes medicine costs from saved invoice lines and a scoped
invoice viewer. The history list and doctor history do not show financial data.
New appointment actions use the existing booking flow. No PDF service, insurance
verification, digital signature or national EMR integration is implied.

Section **5. So kham giay** in the doctor's examination editor now opens a
confirmation dialog for the verified physical book. It previews the current
unsaved symptoms, selected diagnoses (including the primary diagnosis and notes),
conclusion and the visit's prescription, dosage, instructions and doctor notes.
It does not show medicine prices or imply payment/dispensing.

The checkbox starts unchecked each time the dialog opens. Confirmation requires
a verified book, complete clinical fields and a successful prescription lookup.
Loading/failed lookups do not count as a missing prescription; failures expose
a retry action and block confirmation/completion, but do not block saving a draft.
Closing the dialog leaves the form unchanged. Confirming sets only the form's
`paperBookConfirmed` flag; it does not save or complete the examination.
The section distinguishes unconfirmed, confirmed-but-unsaved and saved states.
Confirming immediately replaces the action with **Da xac nhan**; the dialog cannot
be reopened while that confirmation is valid. The book's separate verification
badge describes reception's check, not the doctor's declaration.
Changing symptoms, conclusion or selected diagnoses clears form confirmation.
Empty diagnosis rows, whitespace-only edits and unchanged values do not clear it.
`PaperBookUpdatedAt` is shown only from the saved server response. Completion is
still a separate action subject to the existing backend checks. The system records
the doctor's declaration, not verification of handwritten content.

Backend medical record updates compare normalized clinical content and book ID.
Changed content invalidates the previous `PaperBookUpdatedAt`; completion requires
a new `paperBookConfirmed` declaration. An unchanged save preserves its timestamp.
Creating, reissuing, changing or cancelling a prescription also invalidates the
declaration and changes the record's `UpdatedAt`. A completed visit returns to
`InProgress` when its prescription changes, requiring confirmation and explicit
completion again. An unchanged prescription save preserves confirmation, record
version, prescription detail IDs and visit status. No invoice or stock changes
are performed by these confirmation checks.

## API Contract

Doctor endpoints require `clinical.viewAssigned` and use the standard `ApiResponse`
envelope. `{appointmentId}` is the assigned source examination, not an arbitrary
patient identifier.

Existing examination queue and medical record responses also expose nullable
`patientProfileId`, the canonical `Patient.PatientId` (falling back to the linked
book for older records). Existing `patientId` remains the optional `User.UserId`
account foreign key. Doctor screens use `patientProfileId` for `BN-xxxxx` codes;
they never present an account ID as a patient code. This is an additive response
field; no endpoint or schema migration is required.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/medical-records/by-appointment/{appointmentId}/history/summary` | Patient identity, source book, completed visit count, distinct doctor count, latest visit |
| GET | `/api/medical-records/by-appointment/{appointmentId}/history` | `PagedResponse<MedicalHistoryListItemResponse>` |
| GET | `/api/medical-records/by-appointment/{appointmentId}/history/{medicalRecordId}` | Canonical patient code, read-only record and complete prescription |

Patient endpoints require the `Patient` role and resolve the canonical patient
from the authenticated account's `UserId`. There is no patient ID parameter.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/medical-records/me/history/summary` | `PatientMedicalHistorySummaryResponse`: identity, completed visit count, non-cancelled prescription count, latest visit |
| GET | `/api/medical-records/me/history` | `PagedResponse<MedicalHistoryListItemResponse>` |
| GET | `/api/medical-records/me/history/{medicalRecordId}` | `MedicalHistoryDetailResponse`: patient code, department, read-only record and prescription |

Patients without a linked profile receive 404. Linked patients without completed
visits receive a zero-count summary and empty list. Summary counts do not change
with filters. A prescription count is a count of prescriptions, not medicines.
Prescription state is preserved: a completed visit does not imply payment or dispensing.

Patient detail's `medicineBilling` is null when there is no prescription. Otherwise,
it contains `totalMedicineAmount` (null without an invoice, not zero) and `invoices`.
Only Paid/Unpaid Medicine/Final invoices for the same appointment, billing patient
and prescription sources are included. Costs sum the stored `TotalPrice` of matching
Prescription/PrescriptionDetail lines; current medicine prices and unrelated fees
are never used. Each invoice includes its full saved items and whole-invoice totals
for viewing, with payment status separate from prescription status. Insurance and
patient amounts are null for legacy invoices without a consistent saved split.
No payment amount is allocated to medicine from a mixed Final invoice. Doctor
detail leaves `medicineBilling` null. No general invoice access or billing write
permission is granted to patients by this addition.

Medical record PUT requests must include `expectedUpdatedAt`, copied unchanged
from the loaded record's UTC `updatedAt`. Missing versions return 400; stale
versions return 409/code 7107 without saving content, confirming the book or
completing the appointment. Record and prescription writes advance this version
atomically in a transaction. The editor clears a rejected confirmation and blocks
further saves until the user explicitly reloads the current record; it warns before
replacing unsaved fields. Prescription previews refresh with the record version.

Prescription updates retain detail IDs for medicines that remain in the order,
including changes to notes, dosage and instructions. Medicine/Final invoices in
Paid or Unpaid state prevent changing medicines/quantities, cancellation or reissue
(409/code 7407); the cashier must resolve billing first. Clinical instructions may
still be corrected and require renewed paper-book confirmation. Invoice amounts,
source IDs and payment status are never rewritten by prescription editing.

List parameters: `search` (max 200 characters), `fromDate`, `toDate`,
`pageNumber` (default 1), `pageSize` (default 10; maximum 100).
Search covers formatted `HS-xxxxx` codes, doctor, department and diagnosis.
Date bounds include the whole date. Reversed dates return 400.
Sort order: examination date descending, start time descending, record ID descending.

## Access and Identity

- The source must belong to the current active doctor, unless the caller is Admin.
- The source must be checked in, have a verified book and not be cancelled.
- The verified book and patient profile must refer to the same `Patient`.
- Matching uses `Appointment.PatientProfileId`. Older records fall back to
  their book's `PatientId`, or an account link only when no profile/book link exists.
  Names and phone numbers are never used to join history.
- Visits not completed and records belonging to another patient return 404.
- The patient endpoints apply the same completed-visit query and patient matching,
  including replaced books and pre-account visits. Another account cannot retrieve
  a record by changing the URL, even when names and phone numbers coincide.
- Reading another doctor's historical record does not grant update or prescription
  editing access. Existing write authorization is unchanged.
- No database migration is required.

## Navigation

Filters and pagination remain in the URL when opening and returning from a record.
Returning to the examination preserves the unsaved form in navigation state.
A restored draft does not override a saved record with a different `UpdatedAt`.
The editor also preserves its draft when opening the prescription screen. If only
the prescription changed while away, returning retains unsaved clinical fields
but clears paper-book confirmation. Concurrent changes to the saved clinical
content or book discard the stale draft. Prescription writes refresh record status
before choosing the return screen.
Medical record `updatedAt` is consistently serialized as UTC, including SQL reloads,
so a save response and a later GET expose the same version value.
Draft state stays in the browser's navigation session, not in API/database storage.
In the patient portal, detail URLs retain the list's query string. Returning with
the page's back action or browser Back restores list filters, pagination and scroll
position. Direct detail links fall back to the history list when returning.
Record requests are cancelled on navigation/account changes. Browser printing
excludes navigation and footer. Phone numbers have an explicit `SDT` label in both
doctor and patient summaries.

## Optional Billing Demo Data

To preview medicine costs without the cashier UI, run this additive script on a
development database after the clinic demo seed:

```powershell
sqlcmd -S "(localdb)\MSSQLLocalDB" -d ClinicManagementDb -E -b -i "backend/ClinicManagement/Data/Seed/clinic-demo-medical-history-billing.sql"
```

Do not rerun the reset seed to apply it. This script creates missing demo
prescriptions/invoices only and does not update existing clinical content,
prescriptions, invoices, patient links, visit status or inventory. Repeated runs
skip visits with an existing prescription invoice. Invoice IDs are generated,
not fixed. Prices are snapshotted at insertion, not recomputed by the UI.

| Account | Completed Record | Fixture |
| --- | --- | --- |
| `demo_patient04` | `HS-01001` | Paid Final invoice with medicine, consultation and a demo 20% insurance split |
| `demo_patient06` | `HS-01002` | Paid medicine invoice |
| `demo_patient09` | `HS-01022` | Unpaid Final invoice with medicine and consultation |
| `demo_patient06` | Record of appointment `1025`, if already completed with an issued prescription | Unpaid Final invoice for the existing prescription; no medicine edits |

All accounts use the development-only password documented in README. The paid
states and insurance split are fixtures, not actual transactions or approvals.
No stock is deducted and no prescription is marked as dispensed.

## Verification

```powershell
dotnet run --project tests/Week2Verification -- --d6
dotnet run --project tests/Week2Verification -- --d6-seed
```

This focused check uses a uniquely named temporary LocalDB database and removes
it afterward. It covers identity, replaced books, walk-in patients, cross-doctor
read access, write denial, filtering, pagination, patient account isolation,
empty/no-profile accounts and unauthenticated access.
The seed check logs in to all 16 demo patient accounts and verifies their own
profile, completed visit count, history and record details, both after a fresh
seed and after the idempotent, non-destructive repair documented in README.
