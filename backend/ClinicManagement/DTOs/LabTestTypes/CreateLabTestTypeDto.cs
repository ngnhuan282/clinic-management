using System.ComponentModel.DataAnnotations;

namespace ClinicManagement.DTOs.LabTestTypes
{
    public class CreateLabTestTypeDto
    {
        [Required(ErrorMessage = "Tên loại xét nghiệm không được để trống")]
        [StringLength(200, ErrorMessage = "Tên loại xét nghiệm không quá 200 ký tự")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Range(0, 1000000000, ErrorMessage = "Giá xét nghiệm phải lớn hơn hoặc bằng 0")]
        public decimal Price { get; set; }
    }
}
