using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Pati.API.Data;
using Pati.API.DTOs.Auth;
using Pati.API.Entities;
using Pati.API.Repositories;

namespace Pati.API.Services;

public class AuthService(IUnitOfWork uow, AppDbContext context, IConfiguration config, IWebHostEnvironment env)
{
    // İstemci doğrulaması atlanabildiği için (Swagger, doğrudan istek) kurallar
    // burada da uygulanır: geçersiz veri 400 ile Türkçe bir mesaj döner.
    private const int MinPasswordLength = 6;

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var name = (dto.Name ?? string.Empty).Trim();
        var email = NormalizeEmail(dto.Email);

        if (name.Length < 2)
            throw new InvalidOperationException("Lütfen adınızı girin (en az 2 karakter).");
        if (!IsValidEmail(email))
            throw new InvalidOperationException("Geçerli bir e-posta adresi girin.");
        if (string.IsNullOrEmpty(dto.Password) || dto.Password.Length < MinPasswordLength)
            throw new InvalidOperationException($"Şifre en az {MinPasswordLength} karakter olmalı.");

        if (await uow.Users.AnyAsync(u => u.Email == email))
            throw new InvalidOperationException("Bu email adresi zaten kayıtlı.");

        var user = new User
        {
            Email = email,
            Name = name,
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
        var email = NormalizeEmail(dto.Email);
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(dto.Password))
            throw new UnauthorizedAccessException("Email veya şifre hatalı.");

        var user = await uow.Users.FirstOrDefaultAsync(u => u.Email == email)
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
        // Boş token, RefreshToken'ı null olan ilk kullanıcıyla eşleşmemeli.
        if (string.IsNullOrWhiteSpace(refreshToken))
            throw new UnauthorizedAccessException("Geçersiz veya süresi dolmuş token.");

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

    /// <summary>
    /// Hesabı ve tüm verileri kalıcı olarak siler (App Store 5.1.1(v) gereksinimi).
    /// FK'ler cascade olduğundan kullanıcı satırının silinmesi kedileri, aşıları,
    /// kiloları ve ilaçları da siler; yüklenen fotoğraflar en-iyi-çaba ile temizlenir.
    /// </summary>
    public async Task DeleteAccountAsync(Guid userId)
    {
        var user = await uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        // Fotoğraf dosyalarını temizle (KVKK — kişisel veri bırakma).
        // IgnoreQueryFilters: soft-delete edilmiş dostların fotoğrafları da silinmeli.
        var photoUrls = await context.Cats
            .IgnoreQueryFilters()
            .Where(c => c.UserId == userId && c.PhotoUrl != null)
            .Select(c => c.PhotoUrl!)
            .ToListAsync();

        // Harcama fişleri de kişisel veri; hesapla birlikte silinmeli.
        var receiptUrls = await context.VetExpenses
            .IgnoreQueryFilters()
            .Where(e => e.Cat.UserId == userId && e.ReceiptUrl != null)
            .Select(e => e.ReceiptUrl!)
            .ToListAsync();

        foreach (var photoUrl in photoUrls.Concat(receiptUrls))
            DeleteUploadedFile(photoUrl);

        uow.Users.Remove(user);
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

    private static string NormalizeEmail(string? email) =>
        (email ?? string.Empty).Trim().ToLowerInvariant();

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 255) return false;
        var at = email.IndexOf('@');
        if (at <= 0 || at != email.LastIndexOf('@')) return false;
        var domain = email[(at + 1)..];
        return domain.Length >= 3 && domain.Contains('.')
            && !domain.StartsWith('.') && !domain.EndsWith('.')
            && !email.Contains(' ');
    }

    /// <summary>
    /// "/uploads/cats/x.jpg" biçimindeki göreli yolu wwwroot altındaki dosyaya
    /// çevirip siler. En-iyi-çaba: dosya silinemese de hesap silme devam eder.
    /// </summary>
    private void DeleteUploadedFile(string photoUrl)
    {
        try
        {
            var segments = photoUrl.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length == 0 || segments.Any(seg => seg == "..")) return;

            var root = Path.GetFullPath(env.WebRootPath ?? "wwwroot");
            var path = Path.GetFullPath(Path.Combine([root, .. segments]));
            if (!path.StartsWith(root, StringComparison.Ordinal)) return;
            if (File.Exists(path)) File.Delete(path);
        }
        catch
        {
            // yoksayılır
        }
    }
}
