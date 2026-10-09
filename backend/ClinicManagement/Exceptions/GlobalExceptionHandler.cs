using ClinicManagement.Commons;
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

		if (exception is AppException appException)
		{
			errorCode = appException.ErrorCode;
			message = appException.Message;
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
			message
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
