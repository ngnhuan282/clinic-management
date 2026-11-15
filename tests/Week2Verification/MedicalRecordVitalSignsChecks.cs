using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ClinicManagement.Data;
using Microsoft.EntityFrameworkCore;

internal static class MedicalRecordVitalSignsChecks
{
    public static async Task RunAsync(HttpClient client, ApplicationDbContext db, string password, Action<bool, string> check)
    {
        var fixtures = await ClinicJourneyChecks.PrepareClinicalUiAsync(db, check);
        var beforeStock = await db.Inventory.AsNoTracking().SumAsync(x => x.QuantityInStock);
        var beforeInvoices = await db.Invoices.CountAsync();
        async Task<JsonNode?> Send(string method, string path, object? body = null, int status = 200, string? token = null)
        {
            using var request = new HttpRequestMessage(new HttpMethod(method), "api/" + path);
            if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            if (body != null) request.Content = JsonContent.Create(body);
            using var response = await client.SendAsync(request);
            var text = await response.Content.ReadAsStringAsync();
            check((int)response.StatusCode == status, $"Vitals {method} {path}: expected {status}, got {(int)response.StatusCode}");
            var envelope = string.IsNullOrWhiteSpace(text) ? null : JsonNode.Parse(text);
            return envelope?["result"];
        }
        async Task<string> Login(string username) => (await Send("POST", "auth/login", new { username, password }))!["accessToken"]!.GetValue<string>();
        var doctor = await Login("testdoctor");
        var completedIds = new List<int>();
        foreach (var fixture in fixtures)
        {
            var baseline = new JsonObject
            {
                ["appointmentId"] = fixture.AppointmentId, ["patientBookId"] = fixture.PatientBookId,
                ["symptoms"] = "Vital signs verification", ["conclusion"] = "Recorded measurements",
                ["diagnoses"] = new JsonArray(new JsonObject { ["diseaseId"] = fixture.DiseaseId, ["isPrimary"] = true }),
            };
            var record = (await Send("POST", "medical-records", baseline, 201, doctor))!;
            var id = record["medicalRecordId"]!.GetValue<int>();
            completedIds.Add(id);
            string[] fields = ["temperature", "bloodPressure", "weightKg", "heightCm"];
            check(fields.All(field => record[field] == null), $"Vitals {fixture.Branch}: existing clients can omit every optional measurement");
            JsonObject Update()
            {
                var payload = (JsonObject)baseline.DeepClone();
                payload["expectedUpdatedAt"] = record["updatedAt"]!.GetValue<string>();
                foreach (var field in fields) payload[field] = record[field]?.DeepClone();
                return payload;
            }
            if (fixture.Branch == "web")
            {
                foreach (var (field, invalid) in new (string, JsonNode?)[]
                {
                    ("temperature", -1m), ("temperature", 0m), ("temperature", 36.55m), ("temperature", 1000m),
                    ("weightKg", -1m), ("weightKg", 60.125m), ("weightKg", 1000m),
                    ("heightCm", 0m), ("heightCm", 170.001m), ("heightCm", 1000m),
                    ("bloodPressure", "120"), ("bloodPressure", "120/0"), ("bloodPressure", "-120/80"),
                    ("bloodPressure", "1000/80"), ("bloodPressure", "120/80/70"), ("bloodPressure", "120/80\ninvalid"),
                })
                {
                    var payload = Update();
                    payload[field] = invalid;
                    await Send("PUT", $"medical-records/{id}", payload, 400, doctor);
                    var saved = await db.MedicalRecords.AsNoTracking().SingleAsync(x => x.MedicalRecordId == id);
                    check(saved.UpdatedAt == record["updatedAt"]!.GetValue<DateTime>(), $"Vitals invalid {field} does not write or advance the record version");
                    var create = (JsonObject)baseline.DeepClone();
                    create[field] = invalid?.DeepClone();
                    await Send("POST", "medical-records", create, 400, doctor);
                }
            }
            var measured = Update();
            measured["temperature"] = 36.5m;
            measured["bloodPressure"] = " 120 / 80 ";
            measured["weightKg"] = 60.25m;
            measured["heightCm"] = 170.5m;
            measured["paperBookConfirmed"] = true;
            record = (await Send("PUT", $"medical-records/{id}", measured, token: doctor))!;
            var persisted = await db.MedicalRecords.AsNoTracking().SingleAsync(x => x.MedicalRecordId == id);
            check(persisted.Temperature == 36.5m && persisted.BloodPressure == "120/80"
                && persisted.WeightKg == 60.25m && persisted.HeightCm == 170.5m && persisted.PaperBookUpdatedAt.HasValue,
                $"Vitals {fixture.Branch}: all four measurements are stored with correct precision and pressure is normalized");

            var same = Update();
            same["bloodPressure"] = " 120 / 80 ";
            record = (await Send("PUT", $"medical-records/{id}", same, token: doctor))!;
            check(record["paperBookUpdatedAt"] != null, $"Vitals {fixture.Branch}: equivalent readings preserve paper-book confirmation");
            foreach (var field in fields)
            {
                var changed = Update();
                changed[field] = field == "bloodPressure" ? JsonValue.Create("121/81") : JsonValue.Create(record[field]!.GetValue<decimal>() + 1m);
                var stale = Update();
                record = (await Send("PUT", $"medical-records/{id}", changed, token: doctor))!;
                check(record["paperBookUpdatedAt"] == null, $"Vitals {fixture.Branch}: changing {field} invalidates paper-book confirmation");
                await Send("PUT", $"medical-records/{id}", stale, 409, doctor);
                var confirm = Update();
                confirm["paperBookConfirmed"] = true;
                record = (await Send("PUT", $"medical-records/{id}", confirm, token: doctor))!;
            }
            var clear = Update();
            foreach (var field in fields) clear[field] = null;
            record = (await Send("PUT", $"medical-records/{id}", clear, token: doctor))!;
            check(fields.All(field => record[field] == null) && record["paperBookUpdatedAt"] == null,
                $"Vitals {fixture.Branch}: explicitly clearing measurements stores null and requires rechecking the paper book");
            var complete = Update();
            complete["temperature"] = 37.1m;
            complete["bloodPressure"] = "121/81";
            complete["weightKg"] = 61.25m;
            complete["heightCm"] = 171.5m;
            complete["markCompleted"] = true;
            await Send("PUT", $"medical-records/{id}", complete, 400, doctor);
            complete["paperBookConfirmed"] = true;
            record = (await Send("PUT", $"medical-records/{id}", complete, token: doctor))!;
            var history = (await Send("GET", $"medical-records/by-appointment/{fixture.AppointmentId}/history/{id}", token: doctor))!;
            check(record["status"]!.GetValue<string>() == "Completed" && fields.All(field => field == "bloodPressure"
                    ? record[field]!.GetValue<string>() == history["record"]![field]!.GetValue<string>()
                    : record[field]!.GetValue<decimal>() == history["record"]![field]!.GetValue<decimal>()),
                $"Vitals {fixture.Branch}: completed doctor history returns the same measurements");
        }
        var patient = await Login("d9uipatient");
        var own = (await Send("GET", $"medical-records/me/history/{completedIds[0]}", token: patient))!;
        check(own["record"]!["temperature"]!.GetValue<decimal>() == 37.1m
            && own["record"]!["bloodPressure"]!.GetValue<string>() == "121/81"
            && own["record"]!["weightKg"]!.GetValue<decimal>() == 61.25m
            && own["record"]!["heightCm"]!.GetValue<decimal>() == 171.5m,
            "Vitals patient history reads the persisted measurements, not a client-only summary");
        await Send("GET", $"medical-records/me/history/{completedIds[1]}", status: 404, token: patient);
        await Send("GET", $"medical-records/{completedIds[0]}", status: 403, token: patient);
        check(await db.Patients.AsNoTracking().Where(x => x.PatientId == fixtures[1].PatientProfileId).Select(x => x.UserId).SingleAsync() == null,
            "Vitals walk-in remains supported without creating a patient account");
        check(beforeStock == await db.Inventory.AsNoTracking().SumAsync(x => x.QuantityInStock)
            && beforeInvoices == await db.Invoices.CountAsync(), "Vitals operations do not alter inventory or billing");
    }
}
