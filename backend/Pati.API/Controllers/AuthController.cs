using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pati.API.DTOs;
using Pati.API.DTOs.Auth;
using Pati.API.Services;

namespace Pati.API.Controllers;

public class AuthController(AuthService authService) : BaseController
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await authService.RegisterAsync(dto);
        return StatusCode(201, ApiResponse<AuthResponseDto>.Created(result, "Kayıt başarılı."));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await authService.LoginAsync(dto);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Giriş başarılı."));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto dto)
    {
        var result = await authService.RefreshAsync(dto.RefreshToken);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await authService.LogoutAsync(CurrentUserId);
        return Ok(ApiResponse.OkEmpty("Çıkış başarılı."));
    }

    [Authorize]
    [HttpPut("push-token")]
    public async Task<IActionResult> UpdatePushToken([FromBody] UpdatePushTokenDto dto)
    {
        await authService.UpdatePushTokenAsync(CurrentUserId, dto.ExpoPushToken);
        return Ok(ApiResponse.OkEmpty("Push token güncellendi."));
    }
}
