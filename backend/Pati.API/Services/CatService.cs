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
            ?? throw new KeyNotFoundException("Kedi bulunamadı.");

        return MapToDto(cat);
    }

    public async Task<CatDto> CreateCatAsync(Guid userId, CreateCatDto dto)
    {
        var cat = new Cat
        {
            UserId = userId,
            Name = dto.Name,
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
            ?? throw new KeyNotFoundException("Kedi bulunamadı.");

        cat.Name = dto.Name;
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
            ?? throw new KeyNotFoundException("Kedi bulunamadı.");

        cat.DeletedAt = DateTime.UtcNow;
        uow.Cats.Update(cat);
        await uow.SaveChangesAsync();
    }

    public async Task<string> UpdatePhotoAsync(Guid catId, Guid userId, IFormFile photo)
    {
        var cat = await uow.Cats.FirstOrDefaultAsync(c => c.Id == catId && c.UserId == userId)
            ?? throw new KeyNotFoundException("Kedi bulunamadı.");

        var uploadPath = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", "cats");
        Directory.CreateDirectory(uploadPath);

        var fileName = $"{catId}_{Guid.NewGuid()}{Path.GetExtension(photo.FileName)}";
        var filePath = Path.Combine(uploadPath, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await photo.CopyToAsync(stream);

        cat.PhotoUrl = $"/uploads/cats/{fileName}";
        cat.UpdatedAt = DateTime.UtcNow;
        uow.Cats.Update(cat);
        await uow.SaveChangesAsync();

        return cat.PhotoUrl;
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
            cat.Id, cat.Name, cat.Breed, cat.BirthDate,
            cat.Gender, cat.Color, cat.PhotoUrl, cat.IsNeutered, cat.Notes,
            latestWeight, nextVaccine?.NextDueDate, nextVaccine?.VaccineType
        );
    }
}
