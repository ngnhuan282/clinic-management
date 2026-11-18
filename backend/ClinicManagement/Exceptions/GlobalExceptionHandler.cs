using ClinicManagement.Commons;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ClinicManagement.Exceptions;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is OperationCanceledException && httpContext.RequestAborted.IsCancellationRequested)
        {
            return true;
        }

        ErrorCode errorCode;
        string message;
        IDictionary<string, string[]>? errors = null;

        if (exception is AppException appException)
        {
            errorCode = appException.ErrorCode;
            message = appException.Message;
        }
        else if (exception is ValidationException validationException)
        {
            errorCode = ErrorCode.INVALID_REQUEST;
            message = errorCode.Message;
            errors = validationException.Errors
                .GroupBy(x => x.PropertyName)
                .ToDictionary(
                    x => x.Key,
                    x => x.Select(error => error.ErrorMessage).Distinct().ToArray()
                );
        }
        else if (exception is DbUpdateConcurrencyException)
        {
            errorCode = ErrorCode.DATA_CONCURRENCY_CONFLICT;
            message = errorCode.Message;
        }
        else if (exception is DbUpdateException dbUpdateException &&
                 dbUpdateException.InnerException is SqlException sqlEx)
        {
            switch (sqlEx.Number)
            {
                case 1205:
                    errorCode = ErrorCode.DATA_CONCURRENCY_CONFLICT;
                    message = errorCode.Message;
                    break;
                case 547:
                    errorCode = ErrorCode.DATA_IN_USE;
                    message = errorCode.Message;
                    break;
                case 2601:
                case 2627:
                    errorCode = ErrorCode.DATA_DUPLICATE;
                    message = errorCode.Message;
                    break;
                case 2628:
                    errorCode = ErrorCode.INVALID_REQUEST;
                    message = "Nội dung nhập vượt quá độ dài cho phép.";
                    break;
                default:
                    errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;
                    message = errorCode.Message;
                    _logger.LogError(
                        exception,
                        "Database exception ({SqlNumber}) occurred. TraceId: {TraceId}",
                        sqlEx.Number,
                        httpContext.TraceIdentifier
                    );
                    break;
            }
        }
        else
        {
            errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;
            message = errorCode.Message;

            _logger.LogError(
                exception,
                "Unhandled exception occurred. TraceId: {TraceId}",
                httpContext.TraceIdentifier
            );
        }

        if (httpContext.Response.HasStarted)
        {
            return true;
        }

        var response = ApiResponse<object>.Failure(
            errorCode.Code,
            message,
            errors
        );

        httpContext.Response.StatusCode = (int)errorCode.StatusCode;

        await httpContext.Response.WriteAsJsonAsync(
            response,
            cancellationToken
        );

        return true;
    }
}
