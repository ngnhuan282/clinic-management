using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ClinicManagement.DTOs.LabTests;
using ClinicManagement.DTOs.LabTestResults;
using ClinicManagement.Services;
using ClinicManagement.Services.Interfaces;
namespace ClinicManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LabTestsController : ControllerBase
    {
        private readonly ILabTestService _labTestService;

        public LabTestsController(ILabTestService labTestService)
        {
            _labTestService = labTestService;
        }

        // 1. Bác sĩ chỉ định xét nghiệm
       [HttpPost]
public async Task<IActionResult> CreateOrder([FromBody] CreateLabTestDto dto)
{
    // Tìm ID người dùng từ các claim phổ biến
    var claimId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
               ?? User.FindFirstValue("sub") 
               ?? User.FindFirstValue("id")
               ?? User.FindFirstValue("nameid");

    if (string.IsNullOrEmpty(claimId) || !int.TryParse(claimId, out int doctorId))
    {
        return Unauthorized(new { message = "Không tìm thấy ID người dùng hợp lệ trong Token." });
    }

    var result = await _labTestService.CreateLabTestAsync(doctorId, dto);
    return Ok(result);
}

        // 2. Kỹ thuật viên xem các xét nghiệm chờ làm
        [HttpGet("pending")]
        [Authorize(Roles = "LabTechnician,Admin")]
        public async Task<IActionResult> GetPendingTests()
        {
            var tests = await _labTestService.GetPendingLabTestsAsync();
            return Ok(tests);
        }

        // 3. Kỹ thuật viên nhập kết quả
        [HttpPost("results")]
[Authorize(Roles = "Technician,Admin")]
public async Task<IActionResult> SubmitResult([FromBody] CreateLabTestResultDto dto)
{
    // Bắt claim ID an toàn từ nhiều định dạng claim khác nhau
    var claimId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
               ?? User.FindFirstValue("sub") 
               ?? User.FindFirstValue("id")
               ?? User.FindFirstValue("nameid");

    if (string.IsNullOrEmpty(claimId) || !int.TryParse(claimId, out int technicianId))
    {
        return Unauthorized(new { message = "Không tìm thấy ID kỹ thuật viên hợp lệ trong Token." });
    }

    try
    {
        var result = await _labTestService.SubmitResultAsync(technicianId, dto);
        return Ok(result);
    }
    catch (KeyNotFoundException ex)
    {
        return BadRequest(new { message = ex.Message });
    }
    catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
    {
        return BadRequest(new { 
            message = "Lỗi lưu dữ liệu: LabTestId không tồn tại hoặc đã có kết quả.", 
            detail = ex.InnerException?.Message 
        });
    }
}

        // 4. Bác sĩ hoặc Bệnh nhân xem chi tiết/kết quả
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRole = User.FindFirstValue(ClaimTypes.Role)!;

            var test = await _labTestService.GetLabTestByIdAsync(id, userId, userRole);
            if (test == null) return Forbid(); // Trả 403 nếu bệnh nhân cố xem của người khác

            return Ok(test);
        }
       // 5. Lấy danh sách chỉ định xét nghiệm (Toàn bộ hoặc theo Bác sĩ)
[HttpGet]
[Authorize] // Tạm thời để [Authorize] để chấp nhận mọi người dùng đã đăng nhập (Admin/Doctor)
public async Task<IActionResult> GetAllOrders()
{
    // Tìm ID từ nhiều Claim Type khác nhau phòng trường hợp JWT tạo khác format
    var claimId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
               ?? User.FindFirst("sub")?.Value 
               ?? User.FindFirst("id")?.Value;

    // Log ra console backend để kiểm tra nếu cần debug
    Console.WriteLine($"[DEBUG] Claim User ID: {claimId}");

    var tests = await _labTestService.GetAllLabTestsAsync();
    return Ok(tests);
}
    }
}