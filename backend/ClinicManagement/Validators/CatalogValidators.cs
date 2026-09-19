using ClinicManagement.DTOs.Requests;
using ClinicManagement.Exceptions;

namespace ClinicManagement.Validators;

public static class CatalogValidators
{
    public static string Required(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new AppException(ErrorCode.INVALID_REQUEST)
            : value.Trim();

    public static void ValidateDepartment(int departmentId)
    {
        if (departmentId <= 0) throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    public static (int PageNumber, int PageSize) ValidateQuery(CatalogQuery query) =>
        (Math.Max(1, query.PageNumber), Math.Clamp(query.PageSize, 1, 100));
}
