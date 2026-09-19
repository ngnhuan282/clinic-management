using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Responses;

namespace ClinicManagement.Mappings;

public static class CatalogMappings
{
    public static DepartmentResponse ToResponse(this Department entity) => new()
    {
        DepartmentId = entity.DepartmentId, Code = entity.Code, Name = entity.Name, Description = entity.Description,
        IsActive = entity.IsActive, CreatedAt = entity.CreatedAt, UpdatedAt = entity.UpdatedAt
    };

    public static SpecializationResponse ToResponse(this Specialization entity) => new()
    {
        SpecializationId = entity.SpecializationId, Code = entity.Code, Name = entity.Name, Description = entity.Description,
        DepartmentId = entity.DepartmentId, DepartmentName = entity.Department.Name, IsActive = entity.IsActive,
        CreatedAt = entity.CreatedAt, UpdatedAt = entity.UpdatedAt
    };

    public static RoomResponse ToResponse(this Room entity) => new()
    {
        RoomId = entity.RoomId, RoomNumber = entity.RoomNumber, Name = entity.Name, RoomType = entity.RoomType,
        DepartmentId = entity.DepartmentId, DepartmentName = entity.Department.Name, Location = entity.Location,
        IsActive = entity.IsActive, CreatedAt = entity.CreatedAt, UpdatedAt = entity.UpdatedAt
    };
}
