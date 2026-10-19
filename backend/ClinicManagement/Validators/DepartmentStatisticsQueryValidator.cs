using System.Globalization;
using ClinicManagement.DTOs.Requests;
using FluentValidation;

namespace ClinicManagement.Validators;

public sealed class DepartmentStatisticsQueryValidator : AbstractValidator<DepartmentStatisticsQuery>
{
    public DepartmentStatisticsQueryValidator()
    {
        RuleFor(x => x).Custom((query, context) =>
        {
            if (query.FromDate is null && query.ToDate is null) return;
            var validFrom = TryParse(query.FromDate, out var from);
            var validTo = TryParse(query.ToDate, out var to);
            if (!validFrom) context.AddFailure("fromDate", "Provide both dates in yyyy-MM-dd format.");
            if (!validTo) context.AddFailure("toDate", "Provide both dates in yyyy-MM-dd format.");
            if (validFrom && validTo && from > to)
                context.AddFailure("toDate", "toDate must be on or after fromDate.");
            if (validTo && to == DateOnly.MaxValue)
                context.AddFailure("toDate", "toDate must be before 9999-12-31.");
        });
    }

    public static bool TryParse(string? value, out DateOnly date) =>
        DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
}
