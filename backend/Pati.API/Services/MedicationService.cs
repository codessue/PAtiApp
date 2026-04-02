using Microsoft.EntityFrameworkCore;
using Pati.API.Data;
using Pati.API.DTOs.Medications;
using Pati.API.Entities;
using Pati.API.Repositories;

namespace Pati.API.Services;

public class MedicationService(IUnitOfWork uow, AppDbContext context)
{
    public async Task<IEnumerable<MedicationDto>> GetMedicationsAsync(Guid catId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var meds = await context.Medications
            .Where(m => m.CatId == catId)
            .OrderByDescending(m => m.IsActive)
            .ThenBy(m => m.Name)
            .ToListAsync();

        return meds.Select(m => MapToDto(m));
    }

    public async Task<MedicationDto> CreateMedicationAsync(Guid catId, Guid userId, CreateMedicationDto dto)
    {
        await EnsureCatOwnership(catId, userId);

        var med = new Medication
        {
            CatId = catId,
            Name = dto.Name,
            Dosage = dto.Dosage,
            FrequencyType = dto.FrequencyType,
            FrequencyTimes = dto.FrequencyTimes,
            ReminderTimes = dto.ReminderTimes,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Notes = dto.Notes
        };

        await uow.Medications.AddAsync(med);
        await uow.SaveChangesAsync();

        return MapToDto(med);
    }

    public async Task<MedicationDto> UpdateMedicationAsync(Guid catId, Guid medId, Guid userId, UpdateMedicationDto dto)
    {
        await EnsureCatOwnership(catId, userId);

        var med = await uow.Medications.FirstOrDefaultAsync(m => m.Id == medId && m.CatId == catId)
            ?? throw new KeyNotFoundException("İlaç kaydı bulunamadı.");

        med.Name = dto.Name;
        med.Dosage = dto.Dosage;
        med.FrequencyType = dto.FrequencyType;
        med.FrequencyTimes = dto.FrequencyTimes;
        med.ReminderTimes = dto.ReminderTimes;
        med.StartDate = dto.StartDate;
        med.EndDate = dto.EndDate;
        med.IsActive = dto.IsActive;
        med.Notes = dto.Notes;

        uow.Medications.Update(med);
        await uow.SaveChangesAsync();

        return MapToDto(med);
    }

    public async Task DeleteMedicationAsync(Guid catId, Guid medId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var med = await uow.Medications.FirstOrDefaultAsync(m => m.Id == medId && m.CatId == catId)
            ?? throw new KeyNotFoundException("İlaç kaydı bulunamadı.");

        med.DeletedAt = DateTime.UtcNow;
        med.IsActive = false;
        uow.Medications.Update(med);
        await uow.SaveChangesAsync();
    }

    public async Task<MedicationLog> LogDoseAsync(Guid catId, Guid medId, Guid userId, LogMedicationDto dto)
    {
        await EnsureCatOwnership(catId, userId);

        var med = await uow.Medications.FirstOrDefaultAsync(m => m.Id == medId && m.CatId == catId)
            ?? throw new KeyNotFoundException("İlaç kaydı bulunamadı.");

        var log = new MedicationLog
        {
            MedicationId = medId,
            ScheduledTime = DateTime.UtcNow,
            GivenAt = dto.Status == "given" ? DateTime.UtcNow : null,
            Status = dto.Status,
            Notes = dto.Notes
        };

        await uow.MedicationLogs.AddAsync(log);
        await uow.SaveChangesAsync();

        return log;
    }

    public async Task<IEnumerable<TodayMedicationDto>> GetTodayMedicationsAsync(Guid userId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var meds = await context.Medications
            .Include(m => m.Cat)
            .Where(m => m.Cat.UserId == userId
                && m.IsActive
                && m.StartDate <= today
                && (m.EndDate == null || m.EndDate >= today))
            .ToListAsync();

        return meds.SelectMany(m => m.ReminderTimes.Select(time =>
        {
            var todayLogs = context.MedicationLogs
                .Where(l => l.MedicationId == m.Id
                    && l.ScheduledTime.Date == DateTime.UtcNow.Date)
                .OrderByDescending(l => l.ScheduledTime)
                .FirstOrDefault();

            return new TodayMedicationDto(
                m.Id, m.CatId, m.Cat.Name, m.Name, time,
                todayLogs?.Status ?? "pending"
            );
        }));
    }

    private async Task EnsureCatOwnership(Guid catId, Guid userId)
    {
        var exists = await uow.Cats.AnyAsync(c => c.Id == catId && c.UserId == userId);
        if (!exists) throw new KeyNotFoundException("Kedi bulunamadı.");
    }

    private static MedicationDto MapToDto(Medication m, string? catName = null) =>
        new(m.Id, m.CatId, catName, m.Name, m.Dosage, m.FrequencyType,
            m.FrequencyTimes, m.ReminderTimes, m.StartDate, m.EndDate, m.IsActive, m.Notes);
}
