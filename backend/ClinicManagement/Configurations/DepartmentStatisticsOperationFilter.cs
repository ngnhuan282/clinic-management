using ClinicManagement.Commons;
using ClinicManagement.Controllers;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace ClinicManagement.Configurations;

public sealed class DepartmentStatisticsOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        if (context.MethodInfo.DeclaringType != typeof(DepartmentHeadStatisticsController)) return;
        operation.Summary = "A7: statistics for the authenticated department head's own department";
        operation.Description = "Contract A7 v1.0 (2026-10-19). Requires DepartmentHead and "
            + PermissionCodes.ReportsDepartmentStatistics + ". Department comes only from Doctors.UserId. "
            + "Omit both dates for the full current Vietnam (UTC+07) month, or supply both yyyy-MM-dd dates. "
            + "Inclusive end date; no period length limit; toDate must be before 9999-12-31. "
            + "Visits: distinct MedicalRecord.AppointmentId, ExaminationDate in clinic local time, "
            + "Appointment status InProgress/Completed, record and appointment doctors in the authorized department. "
            + "Requests: DoctorScheduleRequests by WorkDate and Pending/Approved status, irrespective of reviewer. "
            + "No invoices or DoctorSchedules are added to these counts. See docs/api/department-head-statistics.md.";
        operation.Extensions["x-contract-version"] = new OpenApiString("A7/1.0");
        operation.Extensions["x-policy"] = new OpenApiString(PermissionCodes.ReportsDepartmentStatistics);
        foreach (var parameter in operation.Parameters)
        {
            parameter.Schema = new OpenApiSchema { Type = "string", Format = "date", Pattern = @"^\d{4}-\d{2}-\d{2}$" };
            parameter.Example = new OpenApiString(parameter.Name == "fromDate" ? "2026-10-01" : "2026-10-31");
            parameter.Description = "Clinic-local date yyyy-MM-dd; provide both dates or omit both.";
        }
        operation.Responses["400"].Description = "1001 Invalid request; field errors in errors.";
        operation.Responses["401"].Description = "1002 Unauthenticated.";
        operation.Responses["403"].Description = "1003 Permission denied, or 1010 missing active doctor/department.";
        operation.Responses["500"].Description = "9999 Source/server failure; never replaced with zero counts.";
    }
}
