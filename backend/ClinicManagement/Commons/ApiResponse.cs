namespace ClinicManagement.Commons;

public class ApiResponse<T>
{
	public int Code { get; set; }

	public string Message { get; set; } = string.Empty;

	public T? Result { get; set; }

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
		string message)
	{
		return new ApiResponse<T>
		{
			Code = code,
			Message = message
		};
	}
}