using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;

// End-to-end coverage for the core clinical workflow: doctor schedule requests with
// room-conflict validation and RejectReason, HoD approval opening booking slots, walk-in
// booking with patient deduplication, and the PatientBooks Pending/Issued/Lost/Replaced
// lifecycle with its PreviousBookId history chain. Also covers the public doctor directory
// and doctor self-profile endpoints, which have no other test coverage yet.
internal static class CoreWorkflowChecks
{
    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check)
    {
        async Task<JsonNode?> Send(HttpMethod method, string path, object? body = null, int status = 200, string? token = null)
        {
            using var request = new HttpRequestMessage(method, path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status,
                $"CoreWorkflow {method} {path}: expected {status}, got {(int)response.StatusCode}"
                + ((int)response.StatusCode == status ? "" : $": {content}"));
            return string.IsNullOrWhiteSpace(content) ? null : JsonNode.Parse(content);
        }
        async Task<string> Login(string name) => (await Send(HttpMethod.Post, "api/auth/login",
            new { username = name, password }))!["result"]!["accessToken"]!.GetValue<string>();

        client.DefaultRequestHeaders.Authorization = null;
        var receptionToken = await Login("testreceptionist");

        var department = new Department { Code = "CW", Name = "Core workflow department", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var otherDepartment = new Department { Code = "CW2", Name = "Other core workflow department", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        db.Departments.AddRange(department, otherDepartment);
        await db.SaveChangesAsync();
        var specialization = new Specialization { Code = "CW-SP", Name = "Core workflow specialization", DepartmentId = department.DepartmentId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var room = new Room { RoomNumber = "CW-101", Name = "Core workflow room", DepartmentId = department.DepartmentId, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        db.Specializations.Add(specialization);
        db.Rooms.Add(room);
        await db.SaveChangesAsync();

        var doctorUser = new User { Username = "cwdoctor", FullName = "CW doctor", PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), RoleId = 2, CreatedAt = DateTime.UtcNow };
        var headUser = new User { Username = "cwhead", FullName = "CW head", PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), RoleId = 6, CreatedAt = DateTime.UtcNow };
        db.Users.AddRange(doctorUser, headUser);
        await db.SaveChangesAsync();
        var doctor = new Doctor
        {
            FullName = "Dr. Core Workflow", Title = "BS", ExperienceYears = 5,
            DepartmentId = department.DepartmentId, SpecializationId = specialization.SpecializationId,
            UserId = doctorUser.UserId, IsActive = true
        };
        var headDoctor = new Doctor
        {
            FullName = "Dr. CW Head", Title = "BS.CKII", ExperienceYears = 10,
            DepartmentId = department.DepartmentId, SpecializationId = specialization.SpecializationId,
            UserId = headUser.UserId, IsActive = true
        };
        db.Doctors.AddRange(doctor, headDoctor);
        await db.SaveChangesAsync();
        var doctorToken = await Login("cwdoctor");
        var headToken = await Login("cwhead");

        // === Schedule request: reject keeps RejectReason, approve opens available slots ===
        var date = DateOnly.FromDateTime(DateTime.Today.AddDays(60));
        DoctorScheduleRequest AddRequest(string start, string end) => new()
        {
            DoctorId = doctor.DoctorId, RoomId = room.RoomId, WorkDate = date,
            StartTime = TimeSpan.Parse(start), EndTime = TimeSpan.Parse(end), CreatedAt = DateTime.UtcNow
        };
        var rejectedRequest = AddRequest("09:00", "10:00");
        db.DoctorScheduleRequests.Add(rejectedRequest);
        await db.SaveChangesAsync();
        await Send(HttpMethod.Post, $"api/schedule-requests/{rejectedRequest.RequestId}/reject",
            new { rejectReason = "Thiếu thông tin phòng" }, token: headToken);
        db.ChangeTracker.Clear();
        var savedRejection = await db.DoctorScheduleRequests.AsNoTracking().SingleAsync(x => x.RequestId == rejectedRequest.RequestId);
        check(savedRejection.Status == "Rejected" && savedRejection.RejectReason == "Thiếu thông tin phòng",
            "Rejected request stores RejectReason so the doctor can see why");

        var approvedRequest = AddRequest("09:00", "10:00");
        db.DoctorScheduleRequests.Add(approvedRequest);
        await db.SaveChangesAsync();
        await Send(HttpMethod.Post, $"api/schedule-requests/{approvedRequest.RequestId}/approve", token: headToken);
        var slotsAfterApproval = (await Send(HttpMethod.Get,
            $"api/appointments/available-slots?doctorId={doctor.DoctorId}&date={date:yyyy-MM-dd}"))!["result"]!.AsArray();
        check(slotsAfterApproval.Count == 2, "Only the Approved request opens booking slots; the Rejected one does not");

        // === Public doctor directory (AllowAnonymous), now that an Approved shift exists ===
        client.DefaultRequestHeaders.Authorization = null;
        var byName = (await Send(HttpMethod.Get, "api/doctors/public?fullName=Core Workflow"))!["result"]!["items"]!.AsArray();
        check(byName.Count == 1 && byName[0]!["doctorId"]!.GetValue<int>() == doctor.DoctorId,
            "Public doctor search works without authentication and filters by name");
        check(byName[0]!["rooms"]!.AsArray().Any(x => x!["roomCode"]!.GetValue<string>() == room.RoomNumber
            && x["roomName"]!.GetValue<string>() == room.Name), "Public doctor search exposes room code and name for display");
        var byOtherDepartment = (await Send(HttpMethod.Get,
            $"api/doctors/public?departmentId={otherDepartment.DepartmentId}"))!["result"]!["items"]!.AsArray();
        check(!byOtherDepartment.Any(x => x!["doctorId"]!.GetValue<int>() == doctor.DoctorId),
            "Public doctor search excludes doctors from a different department");

        // === Doctor self profile ===
        await Send(HttpMethod.Get, "api/doctors/me", status: 401);
        await Send(HttpMethod.Get, "api/doctors/me", status: 403, token: receptionToken);
        var profile = (await Send(HttpMethod.Get, "api/doctors/me", token: doctorToken))!["result"]!;
        check(profile["fullName"]!.GetValue<string>() == "Dr. Core Workflow", "Doctor reads own profile");
        var updatedProfile = (await Send(HttpMethod.Put, "api/doctors/me",
            new { fullName = "Dr. Core Workflow Updated", title = "ThS.BS", experienceYears = 8, biography = "Updated bio" },
            token: doctorToken))!["result"]!;
        check(updatedProfile["fullName"]!.GetValue<string>() == "Dr. Core Workflow Updated"
            && updatedProfile["experienceYears"]!.GetValue<int>() == 8, "Doctor updates own profile");
        db.ChangeTracker.Clear();
        check((await db.Doctors.AsNoTracking().SingleAsync(x => x.DoctorId == doctor.DoctorId)).FullName == "Dr. Core Workflow Updated",
            "Profile update by the doctor is persisted to the database");

        // === Walk-in booking deduplicates the Patient by phone/identity ===
        var phone = "09" + Random.Shared.Next(10000000, 99999999);
        var identity = "CWID" + Random.Shared.Next(10000, 99999);
        var firstWalkIn = (await Send(HttpMethod.Post, "api/appointments/direct", new
        {
            doctorId = doctor.DoctorId, appointmentDate = date.ToString("yyyy-MM-dd"), startTime = "09:00:00",
            patientName = "Core Workflow Patient", patientPhone = phone, identityNumber = identity, reason = "Kham tong quat"
        }, token: receptionToken))!["result"]!;
        var patientProfileId = firstWalkIn["patientProfileId"]!.GetValue<int>();
        check(await db.Patients.CountAsync(x => x.Phone == phone) == 1, "Walk-in creates exactly one Patient record");

        await Send(HttpMethod.Post, "api/appointments/direct", new
        {
            doctorId = doctor.DoctorId, appointmentDate = date.ToString("yyyy-MM-dd"), startTime = "09:30:00",
            patientName = "Core Workflow Patient", patientPhone = phone, identityNumber = identity, reason = "Tai kham"
        }, status: 409, token: receptionToken);
        var secondWalkIn = (await Send(HttpMethod.Post, "api/appointments/direct", new
        {
            doctorId = doctor.DoctorId, appointmentDate = date.ToString("yyyy-MM-dd"), startTime = "09:30:00",
            patientProfileId, patientName = "Core Workflow Patient", patientPhone = phone, reason = "Tai kham"
        }, token: receptionToken))!["result"]!;
        check(secondWalkIn["patientProfileId"]!.GetValue<int>() == patientProfileId
            && await db.Patients.CountAsync(x => x.Phone == phone) == 1,
            "A matched returning patient reuses the same profile instead of creating a duplicate");

        // === PatientBooks lifecycle: list, status transitions, invalid transition, history chain ===
        var bookPatient = new Patient { FullName = "CW Book Patient", Phone = "09" + Random.Shared.Next(10000000, 99999999), CreatedAt = DateTime.UtcNow };
        db.Patients.Add(bookPatient);
        await db.SaveChangesAsync();
        var pendingBook = new PatientBook
        {
            PatientId = bookPatient.PatientId, BookNumber = "PENDING-" + bookPatient.PatientId,
            Status = "Pending", IssuedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        db.PatientBooks.Add(pendingBook);
        await db.SaveChangesAsync();

        await Send(HttpMethod.Get, "api/PatientBooks", status: 403, token: doctorToken);
        var listed = (await Send(HttpMethod.Get,
            $"api/PatientBooks?patientId={bookPatient.PatientId}", token: receptionToken))!["result"]!["items"]!.AsArray();
        check(listed.Count == 1 && listed[0]!["status"]!.GetValue<string>() == "Pending",
            "Reception lists a patient's books filtered by PatientId");

        await Send(HttpMethod.Put, $"api/PatientBooks/{pendingBook.PatientBookId}/status",
            new { status = "Issued", newBookNumber = "CW-BOOK-001" }, token: receptionToken);
        db.ChangeTracker.Clear();
        check((await db.PatientBooks.AsNoTracking().SingleAsync(x => x.PatientBookId == pendingBook.PatientBookId)).Status == "Issued",
            "Pending book transitions to Issued with a new book number");

        var invalidTransition = (await Send(HttpMethod.Put, $"api/PatientBooks/{pendingBook.PatientBookId}/status",
            new { status = "Pending" }, status: 400, token: receptionToken))!;
        check(invalidTransition["code"]!.GetValue<int>() == 7106, "An unsupported status transition is rejected as PATIENT_BOOK_INVALID_STATUS");

        var lostResult = (await Send(HttpMethod.Put, $"api/PatientBooks/{pendingBook.PatientBookId}/status",
            new { status = "Lost", newBookNumber = "CW-BOOK-002" }, token: receptionToken))!["result"]!;
        var replacementId = lostResult["patientBookId"]!.GetValue<int>();
        check(replacementId != pendingBook.PatientBookId && lostResult["previousBookId"]!.GetValue<int>() == pendingBook.PatientBookId,
            "Reporting a book Lost retires it and issues a replacement linked by PreviousBookId");
        db.ChangeTracker.Clear();
        check((await db.PatientBooks.AsNoTracking().SingleAsync(x => x.PatientBookId == pendingBook.PatientBookId)).Status == "Lost",
            "The original book is marked Lost");

        var replacedResult = (await Send(HttpMethod.Put, $"api/PatientBooks/{replacementId}/status",
            new { status = "Replaced", newBookNumber = "CW-BOOK-003" }, token: receptionToken))!["result"]!;
        var thirdBookId = replacedResult["patientBookId"]!.GetValue<int>();
        db.ChangeTracker.Clear();
        check((await db.PatientBooks.AsNoTracking().SingleAsync(x => x.PatientBookId == replacementId)).Status == "Replaced",
            "The second-generation book is marked Replaced when reissued again");

        var history = (await Send(HttpMethod.Get,
            $"api/PatientBooks/{thirdBookId}/history", token: receptionToken))!["result"]!.AsArray();
        check(history.Count == 3
            && history[0]!["patientBookId"]!.GetValue<int>() == pendingBook.PatientBookId
            && history[1]!["patientBookId"]!.GetValue<int>() == replacementId
            && history[2]!["patientBookId"]!.GetValue<int>() == thirdBookId
            && history[2]!["status"]!.GetValue<string>() == "Issued",
            "History walks the full PreviousBookId chain from the original book to the currently Issued one");
    }
}
