using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class CreateMedicineCategoryRequest
{
    [Required]
    [MaxLength(100)]
    public string CategoryName { get; set; } = string.Empty;
}
