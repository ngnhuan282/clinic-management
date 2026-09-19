using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class CreateMedicineRequest
{
    [Required]
    [MaxLength(150)]
    public string MedicineName { get; set; } = string.Empty;

    [Required]
    public int CategoryId { get; set; }

    public int? SupplierId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Unit { get; set; } = string.Empty;

    [Range(0, 999999999)]
    public decimal UnitPrice { get; set; }

    [MaxLength(255)]
    public string? Description { get; set; }
}
