using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests.Staff;

public class LinkStaffAccountRequest
{
    [Required, Range(1, int.MaxValue)] public int? UserId { get; set; }
}
