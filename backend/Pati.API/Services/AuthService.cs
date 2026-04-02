using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Pati.API.DTOs.Auth;
using Pati.API.Entities;
using Pati.API.Repositories;

namespace Pati.API.Services;

public class AuthService(IUnitOfWork uow, IConfiguration config)
{
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (await uow.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
            throw new InvalidOperationException("Bu email adresi zaten kayıtlı.");

        var user = new User
        {
            Email = dto.Email.ToLower(),
            Name = dto.Name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12)
        };

        var (accessToken, refreshToken) = GenerateTokenPair(user);
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);

        await uow.Users.AddAsync(user);
        await uow.SaveChangesAsync();

        return new AuthResponseDto(accessToken, refreshToken, new UserDto(user.Id, user.Name, user.Email));
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await uow.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower())
            ?? throw new UnauthorizedAccessException("Email veya şifre hatalı.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Email veya şifre hatalı.");

        var (accessToken, refreshToken) = GenerateTokenPair(user);
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);
        user.UpdatedAt = DateTime.UtcNow;
        uow.Users.Update(user);
        await uow.SaveChangesAsync();

        return new AuthResponseDto(accessToken, refreshToken, new UserDto(user.Id, user.Name, user.Email));
    }

    public async Task<AuthResponseDto> RefreshAsync(string refreshToken)
    {
        var user = await uow.Users.FirstOrDefaultAsync(u =>
            u.RefreshToken == refreshToken && u.RefreshTokenExpiry > DateTime.UtcNow)
            ?? throw new UnauthorizedAccessException("Geçersiz veya süresi dolmuş token.");

        var (newAccess, newRefresh) = GenerateTokenPair(user);
        user.RefreshToken = newRefresh;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);
        uow.Users.Update(user);
        await uow.SaveChangesAsync();

        return new AuthResponseDto(newAccess, newRefresh, new UserDto(user.Id, user.Name, user.Email));
    }

    public async Task LogoutAsync(Guid userId)
    {
        var user = await uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        uow.Users.Update(user);
        await uow.SaveChangesAsync();
    }

    public async Task UpdatePushTokenAsync(Guid userId, string pushToken)
    {
        var user = await uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");
        user.ExpoPushToken = pushToken;
        uow.Users.Update(user);
        await uow.SaveChangesAsync();
    }

    private (string access, string refresh) GenerateTokenPair(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
        );

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        return (accessToken, refreshToken);
    }
}
