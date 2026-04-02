using Microsoft.EntityFrameworkCore;
using Pati.API.Data;
using Pati.API.DTOs.Vaccines;
using Pati.API.Entities;
using Pati.API.Repositories;

namespace Pati.API.Services;

public class VaccineService(IUnitOfWork uow, AppDbContext context)
{
    public async Task<IEnumerable<VaccineDto>> GetCatVaccinesAsync(Guid catId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var vaccines = await context.VaccineSchedules
            .Where(v => v.CatId == catId)
            .OrderBy(v => v.NextDueDate)
            .ToListAsync();

        return vaccines.Select(v => MapToDto(v));
    }

    public async Task<VaccineDto> CreateVaccineAsync(Guid catId, Guid userId, CreateVaccineDto dto)
    {
        await EnsureCatOwnership(catId, userId);

        var vaccine = new VaccineSchedule
        {
            CatId = catId,
            VaccineType = dto.VaccineType,
            LastGivenDate = dto.LastGivenDate,
            NextDueDate = dto.NextDueDate,
            VetName = dto.VetName,
            ClinicName = dto.ClinicName,
            Notes = dto.Notes
        };

        await uow.VaccineSchedules.AddAsync(vaccine);
        await uow.SaveChangesAsync();

        return MapToDto(vaccine);
    }

    public async Task<VaccineDto> UpdateVaccineAsync(Guid catId, Guid vaccineId, Guid userId, UpdateVaccineDto dto)
    {
        await EnsureCatOwnership(catId, userId);

        var vaccine = await uow.VaccineSchedules.FirstOrDefaultAsync(v => v.Id == vaccineId && v.CatId == catId)
            ?? throw new KeyNotFoundException("Aşı kaydı bulunamadı.");

        vaccine.VaccineType = dto.VaccineType;
        vaccine.LastGivenDate = dto.LastGivenDate;
        vaccine.NextDueDate = dto.NextDueDate;
        vaccine.VetName = dto.VetName;
        vaccine.ClinicName = dto.ClinicName;
        vaccine.Notes = dto.Notes;
        vaccine.IsCompleted = dto.IsCompleted;

        uow.VaccineSchedules.Update(vaccine);
        await uow.SaveChangesAsync();

        return MapToDto(vaccine);
    }

    public async Task DeleteVaccineAsync(Guid catId, Guid vaccineId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var vaccine = await uow.VaccineSchedules.FirstOrDefaultAsync(v => v.Id == vaccineId && v.CatId == catId)
            ?? throw new KeyNotFoundException("Aşı kaydı bulunamadı.");

        uow.VaccineSchedules.Remove(vaccine);
        await uow.SaveChangesAsync();
    }

    public async Task<IEnumerable<VaccineDto>> GetUpcomingVaccinesAsync(Guid userId, int days = 30)
    {
        var targetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(days));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var vaccines = await context.VaccineSchedules
            .Include(v => v.Cat)
            .Where(v => v.Cat.UserId == userId && !v.IsCompleted && v.NextDueDate <= targetDate)
            .OrderBy(v => v.NextDueDate)
            .ToListAsync();

        return vaccines.Select(v => MapToDto(v, v.Cat.Name));
    }

    private async Task EnsureCatOwnership(Guid catId, Guid userId)
    {
        var exists = await uow.Cats.AnyAsync(c => c.Id == catId && c.UserId == userId);
        if (!exists) throw new KeyNotFoundException("Kedi bulunamadı.");
    }

    private static VaccineDto MapToDto(VaccineSchedule v, string? catName = null)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysUntil = v.NextDueDate.DayNumber - today.DayNumber;
        return new VaccineDto(v.Id, v.CatId, catName, v.VaccineType, v.LastGivenDate,
            v.NextDueDate, v.VetName, v.ClinicName, v.Notes, v.IsCompleted, daysUntil);
    }
}
