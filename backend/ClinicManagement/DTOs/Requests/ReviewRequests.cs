using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ClinicManagement.DTOs.Requests;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class CreateReviewRequest
{
    public int AppointmentId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class ReviewVisibilityRequest
{
    [Required] public bool? IsVisible { get; set; }
}

public class ReviewQuery : PaginationRequest
{
    [Range(1, int.MaxValue)] public int? DoctorId { get; set; }
}
