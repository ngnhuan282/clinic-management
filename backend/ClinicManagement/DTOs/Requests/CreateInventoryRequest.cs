using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.Requests;

public class CreateInventoryRequest
{
    [Required]
    public int MedicineId { get; set; }

    [Required]
    [MaxLength(50)]
    public string BatchNumber { get; set; } = string.Empty;

    [Range(0, int.MaxValue)]
    public int QuantityInStock { get; set; }

    [Required]
    public DateOnly ExpiryDate { get; set; }
}
