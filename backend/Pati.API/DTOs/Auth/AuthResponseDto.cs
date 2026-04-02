namespace Pati.API.DTOs.Auth;

public record AuthResponseDto(string AccessToken, string RefreshToken, UserDto User);
public record UserDto(Guid Id, string Name, string Email);
public record RefreshTokenDto(string RefreshToken);
public record UpdatePushTokenDto(string ExpoPushToken);
