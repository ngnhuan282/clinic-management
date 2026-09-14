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

		if (exception is AppException appException)
		{
			errorCode = appException.ErrorCode;
		}
		else
		{
			errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;

			_logger.LogError(
				exception,
				"Unhandled exception occurred. TraceId: {TraceId}",
				httpContext.TraceIdentifier
			);
		}

		var response = ApiResponse<object>.Failure(
			errorCode.Code,
			errorCode.Message
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