using Microsoft.EntityFrameworkCore;
using Pati.API.Data;
using Pati.API.DTOs.Cats;
using Pati.API.Entities;
using Pati.API.Repositories;

namespace Pati.API.Services;

public class CatService(IUnitOfWork uow, AppDbContext context, IWebHostEnvironment env)
{
    public async Task<IEnumerable<CatDto>> GetUserCatsAsync(Guid userId)
    {
        var cats = await context.Cats
            .Include(c => c.WeightLogs)
            .Include(c => c.VaccineSchedules)
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name)
            .ToListAsync();

        return cats.Select(MapToDto);
    }

    public async Task<CatDto> GetCatAsync(Guid catId, Guid userId)
    {
        var cat = await context.Cats
            .Include(c => c.WeightLogs)
            .Include(c => c.VaccineSchedules)
            .FirstOrDefaultAsync(c => c.Id == catId && c.UserId == userId)
            ?? throw new KeyNotFoundException("Dost bulunamadı.");

        return MapToDto(cat);
    }

    public async Task<CatDto> CreateCatAsync(Guid userId, CreateCatDto dto)
    {
        var cat = new Cat
        {
            UserId = userId,
            Name = dto.Name,
            Species = NormalizeSpecies(dto.Species),
            Breed = dto.Breed,
            BirthDate = dto.BirthDate,
            Gender = dto.Gender,
            Color = dto.Color,
            IsNeutered = dto.IsNeutered,
            Notes = dto.Notes
        };

        await uow.Cats.AddAsync(cat);
        await uow.SaveChangesAsync();

        return MapToDto(cat);
    }

    public async Task<CatDto> UpdateCatAsync(Guid catId, Guid userId, UpdateCatDto dto)
    {
        var cat = await uow.Cats.FirstOrDefaultAsync(c => c.Id == catId && c.UserId == userId)
            ?? throw new KeyNotFoundException("Dost bulunamadı.");

        cat.Name = dto.Name;
        cat.Species = NormalizeSpecies(dto.Species, cat.Species);
        cat.Breed = dto.Breed;
        cat.BirthDate = dto.BirthDate;
        cat.Gender = dto.Gender;
        cat.Color = dto.Color;
        cat.IsNeutered = dto.IsNeutered;
        cat.Notes = dto.Notes;
        cat.UpdatedAt = DateTime.UtcNow;

        uow.Cats.Update(cat);
        await uow.SaveChangesAsync();

        return MapToDto(cat);
    }

    public async Task DeleteCatAsync(Guid catId, Guid userId)
    {
        var cat = await uow.Cats.FirstOrDefaultAsync(c => c.Id == catId && c.UserId == userId)
            ?? throw new KeyNotFoundException("Dost bulunamadı.");

        cat.DeletedAt = DateTime.UtcNow;
        uow.Cats.Update(cat);
        await uow.SaveChangesAsync();
    }

    private const long MaxPhotoBytes = 8 * 1024 * 1024; // 8 MB

    // Uzantı kullanıcının dosya adından alınırsa ".html"/".svg" gibi bir dosya
    // yüklenip /uploads altından servis edilebilirdi (depolanmış XSS). Bu yüzden
    // yalnızca bilinen resim türleri kabul edilir ve uzantı buradan belirlenir.
    private static readonly Dictionary<string, string> AllowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/jpg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
        ["image/heic"] = ".heic",
        ["image/heif"] = ".heic",
    };

    public async Task<string> UpdatePhotoAsync(Guid catId, Guid userId, IFormFile? photo)
    {
        if (photo is null || photo.Length == 0)
            throw new InvalidOperationException("Lütfen bir fotoğraf seçin.");
        if (photo.Length > MaxPhotoBytes)
            throw new InvalidOperationException("Fotoğraf çok büyük (en fazla 8 MB).");
        if (!AllowedImageTypes.TryGetValue(photo.ContentType ?? string.Empty, out var extension))
            throw new InvalidOperationException("Yalnızca JPG, PNG, WEBP veya HEIC fotoğraf yükleyebilirsiniz.");

        var cat = await uow.Cats.FirstOrDefaultAsync(c => c.Id == catId && c.UserId == userId)
            ?? throw new KeyNotFoundException("Dost bulunamadı.");

        var uploadPath = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", "cats");
        Directory.CreateDirectory(uploadPath);

        var fileName = $"{catId}_{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadPath, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await photo.CopyToAsync(stream);
        }

        var previousPhoto = cat.PhotoUrl;

        cat.PhotoUrl = $"/uploads/cats/{fileName}";
        cat.UpdatedAt = DateTime.UtcNow;
        uow.Cats.Update(cat);
        await uow.SaveChangesAsync();

        // Kayıt başarılı olduktan sonra eski dosyayı temizle — yoksa her
        // güncellemede diskte artık dosya birikiyordu.
        DeletePreviousPhoto(previousPhoto);

        return cat.PhotoUrl;
    }

    private void DeletePreviousPhoto(string? photoUrl)
    {
        if (string.IsNullOrWhiteSpace(photoUrl)) return;
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
            // en-iyi-çaba
        }
    }

    private static CatDto MapToDto(Cat cat)
    {
        var latestWeight = cat.WeightLogs
            .OrderByDescending(w => w.LoggedAt)
            .FirstOrDefault()?.WeightKg;

        var nextVaccine = cat.VaccineSchedules
            .Where(v => !v.IsCompleted)
            .OrderBy(v => v.NextDueDate)
            .FirstOrDefault();

        return new CatDto(
            cat.Id, cat.Name, cat.Species, cat.Breed, cat.BirthDate,
            cat.Gender, cat.Color, cat.PhotoUrl, cat.IsNeutered, cat.Notes,
            latestWeight, nextVaccine?.NextDueDate, nextVaccine?.VaccineType
        );
    }

    private static readonly string[] KnownSpecies = ["kedi", "kopek", "kus", "hamster", "tavsan", "diger"];

    private static string NormalizeSpecies(string? raw, string fallback = "kedi")
    {
        var v = raw?.Trim().ToLowerInvariant();
        return v is not null && KnownSpecies.Contains(v) ? v : fallback;
    }
}
