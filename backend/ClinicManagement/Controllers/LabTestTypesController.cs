using ClinicManagement.DTOs.LabTestTypes;
using ClinicManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LabTestTypesController : ControllerBase
    {
        private readonly ILabTestTypeService _service;

        public LabTestTypesController(ILabTestTypeService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
        {
            var result = await _service.GetAllAsync(includeInactive);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound(new { message = "Không tìm thấy loại xét nghiệm" });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateLabTestTypeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateLabTestTypeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var success = await _service.UpdateAsync(id, dto);
            if (!success) return NotFound(new { message = "Không tìm thấy loại xét nghiệm" });
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy loại xét nghiệm" });
            return NoContent();
        }
    }
}