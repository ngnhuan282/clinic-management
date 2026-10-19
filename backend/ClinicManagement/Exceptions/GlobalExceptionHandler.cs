using ClinicManagement.Commons;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;

namespace ClinicManagement.Exceptions;

public sealed class GlobalExceptionHandler: IExceptionHandler
{
	private readonly ILogger<GlobalExceptionHandler> _logger;

	public GlobalExceptionHandler(
		ILogger<GlobalExceptionHandler> logger)
	{
		_logger = logger;
	}

	public async ValueTask<bool> TryHandleAsync(
		HttpContext httpContext,
		Exception exception,
		CancellationToken cancellationToken)
	{
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
			errors = validationException.Errors.GroupBy(x => x.PropertyName)
				.ToDictionary(x => x.Key, x => x.Select(error => error.ErrorMessage).Distinct().ToArray());
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

		var response = ApiResponse<object>.Failure(
			errorCode.Code,
			message,
			errors
		);

		httpContext.Response.StatusCode =
			(int)errorCode.StatusCode;

		await httpContext.Response.WriteAsJsonAsync(
			response,
			cancellationToken
		);

		return true;
	}
}
