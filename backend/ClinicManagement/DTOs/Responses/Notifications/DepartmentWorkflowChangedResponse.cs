namespace ClinicManagement.DTOs.Responses.Notifications;

// Invalidation only: clients must re-read the authorized API for their current period.
public record DepartmentWorkflowChangedResponse(int DepartmentId, string Area)
{
    public const string Schedules = "Schedules";
    public const string Statistics = "Statistics";
}
