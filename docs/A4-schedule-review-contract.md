# A4 schedule review contract

The review workflow uses `DoctorScheduleRequests` with `RequestId` (int), `DoctorId` (int), `RoomId` (int), `WorkDate` (date), `StartTime` and `EndTime` (SQL `time` / C# `TimeSpan`), `Status` (`Pending`, `Approved`, `Rejected`, `Cancelled`), `ReviewerId`, `ReviewedAt`, `RejectReason`, and `CreatedAt`. `DoctorSchedules.RequestId` is a nullable, unique foreign key for migrated schedules; newly approved requests receive exactly one linked schedule and 30-minute `TimeSlots` in one transaction.

The migration creates or upgrades the `DepartmentHead` role by `RoleName`, using the database-assigned `RoleId`. This avoids colliding with an existing custom role at ID 6.

Phú's doctor registration API should create only `Pending` requests. It must resolve the doctor from the authenticated user's `Doctors.UserId`, validate the doctor's department and proposed room, and accept only `WorkDate`, `StartTime`, `EndTime`, and `RoomId` from the client. It must not accept `DoctorId`, `DepartmentId`, `ReviewerId`, `Status`, or `RequestId` as authority. No registration endpoint was present when A4 was implemented, so A4 does not expose one.

Review endpoints are `GET /api/schedule-requests?status=Pending&pageNumber=1&pageSize=10`, `GET /api/schedule-requests/{id}`, `POST /api/schedule-requests/{id}/approve`, and `POST /api/schedule-requests/{id}/reject` with `{ "rejectReason": "..." }`. They return the existing `ApiResponse<T>` shape. Department heads see only their department's requests and can review other doctors' requests except requests from department heads. Admin sees and reviews department head requests. `DoctorScheduleService.GetAvailableSlotsAsync` and the booking repository select active schedules linked to `Approved` requests.

Phú should preserve these fields and the `RequestId` link when integrating registration and schedule changes. The existing Admin direct schedule creation endpoint still creates unlinked schedules for legacy management, but those schedules do not open public booking slots; it should be retired or changed to the registration and approval workflow when Phú's UI/API is integrated.
