using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.LabTestTypes
{
    public class UpdateLabTestTypeDto
    {
        [Required(ErrorMessage = "Tên loại xét nghiệm không được để trống")]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Range(0, 1000000000)]
        public decimal Price { get; set; }

        public bool IsActive { get; set; }
    }
}
