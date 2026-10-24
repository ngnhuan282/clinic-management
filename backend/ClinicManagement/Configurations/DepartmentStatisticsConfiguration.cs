using ClinicManagement.Commons;
using ClinicManagement.Controllers;
using ClinicManagement.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace ClinicManagement.Configurations;

public static class DepartmentStatisticsConfiguration
{
    public static IMvcBuilder AddDepartmentStatisticsValidation(this IMvcBuilder builder) =>
        builder.ConfigureApiBehaviorOptions(options =>
        {
            var existingFactory = options.InvalidModelStateResponseFactory;
            options.InvalidModelStateResponseFactory = context =>
            {
                if (context.ActionDescriptor is not ControllerActionDescriptor action
                    || action.ControllerTypeInfo.AsType() != typeof(DepartmentHeadStatisticsController))
                    return existingFactory(context);

                var errors = context.ModelState.Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(x => x.Key, _ => new[] { "Invalid query parameter." });
                return new BadRequestObjectResult(ApiResponse<object>.Failure(
                    ErrorCode.INVALID_REQUEST.Code, ErrorCode.INVALID_REQUEST.Message, errors));
            };
        });
}
