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

        var status = NormalizeStatus(dto.Status);

        var log = new MedicationLog
        {
            MedicationId = medId,
            // Hangi doz olduğu ScheduledTime'da taşınır: "08:00" gönderilirse
            // bugünün 08:00'i yazılır. Böylece aynı ilacın farklı saatleri ayrı
            // ayrı işaretlenebilir (önceden hepsi tek duruma bağlıydı).
            ScheduledTime = ResolveScheduledTime(dto.ReminderTime),
            GivenAt = status == "given" ? DateTime.UtcNow : null,
            Status = status,
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

        var medIds = meds.Select(m => m.Id).ToList();
        // DateTime.UtcNow.Date, Kind=Unspecified üretir; Npgsql bunu "timestamp
        // without time zone" olarak gönderir ve PostgreSQL karşılaştırmayı oturumun
        // TimeZone ayarına göre yapar. Sunucu UTC değilse "bugün" penceresi kayardı.
        var dayStart = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var dayEnd = dayStart.AddDays(1);

        var todayLogs = await context.MedicationLogs
            .Where(l => medIds.Contains(l.MedicationId)
                && l.ScheduledTime >= dayStart
                && l.ScheduledTime < dayEnd)
            .ToListAsync();

        // Durum (ilaç, saat) çiftine göre tutulur; saatsiz kaydedilmiş eski
        // kayıtlar ilacın tüm saatleri için yedek durum olarak kullanılır.
        var statusBySlot = todayLogs
            .GroupBy(l => (l.MedicationId, Slot: l.ScheduledTime.ToString("HH:mm")))
            .ToDictionary(g => g.Key, g => g.OrderByDescending(l => l.GivenAt ?? l.ScheduledTime).First().Status);

        return meds.SelectMany(m => m.ReminderTimes.Select(time =>
            new TodayMedicationDto(
                m.Id, m.CatId, m.Cat.Name, m.Name, time,
                statusBySlot.TryGetValue((m.Id, NormalizeTime(time)), out var status) ? status : "pending"
            )));
    }

    private async Task EnsureCatOwnership(Guid catId, Guid userId)
    {
        var exists = await uow.Cats.AnyAsync(c => c.Id == catId && c.UserId == userId);
        if (!exists) throw new KeyNotFoundException("Dost bulunamadı.");
    }

    private static MedicationDto MapToDto(Medication m, string? catName = null) =>
        new(m.Id, m.CatId, catName, m.Name, m.Dosage, m.FrequencyType,
            m.FrequencyTimes, m.ReminderTimes, m.StartDate, m.EndDate, m.IsActive, m.Notes);

    private static readonly string[] KnownStatuses = ["given", "skipped", "pending"];

    private static string NormalizeStatus(string? raw)
    {
        var v = raw?.Trim().ToLowerInvariant();
        return v is not null && KnownStatuses.Contains(v)
            ? v
            : throw new InvalidOperationException("Geçersiz ilaç durumu.");
    }

    /// <summary>"8:5" gibi girdileri "08:05"e çevirir; çözülemezse olduğu gibi bırakır.</summary>
    private static string NormalizeTime(string raw) =>
        TimeOnly.TryParse(raw, System.Globalization.CultureInfo.InvariantCulture, out var t)
            ? t.ToString("HH:mm")
            : raw;

    private static DateTime ResolveScheduledTime(string? reminderTime)
    {
        var now = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(reminderTime)
            && TimeOnly.TryParse(reminderTime, System.Globalization.CultureInfo.InvariantCulture, out var slot))
        {
            return DateTime.SpecifyKind(now.Date.Add(slot.ToTimeSpan()), DateTimeKind.Utc);
        }
        return now;
    }
}
