namespace Pati.API.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string Message { get; init; } = string.Empty;
    public Dictionary<string, string[]>? Errors { get; init; }
    public int StatusCode { get; init; }

    public static ApiResponse<T> Ok(T data, string message = "İşlem başarılı") =>
        new() { Success = true, Data = data, Message = message, StatusCode = 200 };

    public static ApiResponse<T> Created(T data, string message = "Başarıyla oluşturuldu") =>
        new() { Success = true, Data = data, Message = message, StatusCode = 201 };

    public static ApiResponse<T> Fail(string message, int statusCode = 400, Dictionary<string, string[]>? errors = null) =>
        new() { Success = false, Message = message, Errors = errors, StatusCode = statusCode };
}

public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse OkEmpty(string message = "İşlem başarılı") =>
        new() { Success = true, Message = message, StatusCode = 200 };
}
