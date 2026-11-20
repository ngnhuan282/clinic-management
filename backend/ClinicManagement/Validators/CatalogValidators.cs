using ClinicManagement.DTOs.Requests.Catalog;
using ClinicManagement.Exceptions;

namespace ClinicManagement.Validators;

public static class CatalogValidators
{
    public static string Required(string? value, int maxLength = 150)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new AppException(ErrorCode.INVALID_REQUEST);

        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
            throw new AppException(ErrorCode.INVALID_REQUEST);

        return trimmed;
    }

    public static string? Optional(string? value, int maxLength = 500)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
            throw new AppException(ErrorCode.INVALID_REQUEST);

        return trimmed;
    }

    public static void ValidateDepartment(int departmentId)
    {
        if (departmentId <= 0) throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    public static (int PageNumber, int PageSize) ValidateQuery(CatalogQuery query) =>
        (Math.Clamp(query.PageNumber, 1, 100_000), Math.Clamp(query.PageSize, 1, 100));
}
