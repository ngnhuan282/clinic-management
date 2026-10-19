using System.Text.Json.Serialization;

namespace ClinicManagement.Commons;

public class ApiResponse<T>
{
	public int Code { get; set; }

	public string Message { get; set; } = string.Empty;

	public T? Result { get; set; }

	[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
	public IDictionary<string, string[]>? Errors { get; set; }

	public static ApiResponse<T> Success(
		T? result,
		string message = "Success")
	{
		return new ApiResponse<T>
		{
			Code = 1000,
			Message = message,
			Result = result
		};
	}

	public static ApiResponse<T> Failure(
		int code,
		string message,
		IDictionary<string, string[]>? errors = null)
	{
		return new ApiResponse<T>
		{
			Code = code,
			Message = message,
			Errors = errors
		};
	}
}
