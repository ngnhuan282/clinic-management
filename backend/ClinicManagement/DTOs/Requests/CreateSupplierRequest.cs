using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class CreateSupplierRequest
{
    [Required]
    [MaxLength(150)]
    public string SupplierName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ContactInfo { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }
}
