using Microsoft.EntityFrameworkCore;
using Pati.API.Data;
using Pati.API.DTOs.WeightLogs;
using Pati.API.Entities;
using Pati.API.Repositories;

namespace Pati.API.Services;

public class WeightService(IUnitOfWork uow, AppDbContext context)
{
    public async Task<IEnumerable<WeightLogDto>> GetWeightLogsAsync(Guid catId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var logs = await context.WeightLogs
            .Where(w => w.CatId == catId)
            .OrderByDescending(w => w.LoggedAt)
            .ToListAsync();

        return logs.Select(w => new WeightLogDto(w.Id, w.CatId, w.WeightKg, w.LoggedAt, w.Notes));
    }

    public async Task<WeightLogDto> AddWeightLogAsync(Guid catId, Guid userId, CreateWeightLogDto dto)
    {
        await EnsureCatOwnership(catId, userId);

        var log = new WeightLog
        {
            CatId = catId,
            WeightKg = dto.WeightKg,
            LoggedAt = dto.LoggedAt,
            Notes = dto.Notes
        };

        await uow.WeightLogs.AddAsync(log);
        await uow.SaveChangesAsync();

        return new WeightLogDto(log.Id, log.CatId, log.WeightKg, log.LoggedAt, log.Notes);
    }

    public async Task DeleteWeightLogAsync(Guid catId, Guid weightId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var log = await uow.WeightLogs.FirstOrDefaultAsync(w => w.Id == weightId && w.CatId == catId)
            ?? throw new KeyNotFoundException("Ağırlık kaydı bulunamadı.");

        uow.WeightLogs.Remove(log);
        await uow.SaveChangesAsync();
    }

    public async Task<WeightSummaryDto> GetWeightSummaryAsync(Guid catId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var logs = await context.WeightLogs
            .Where(w => w.CatId == catId)
            .OrderByDescending(w => w.LoggedAt)
            .ToListAsync();

        if (!logs.Any())
            return new WeightSummaryDto(null, null, null, null, "stable");

        var current = logs.First().WeightKg;
        var lowest = logs.Min(w => w.WeightKg);
        var highest = logs.Max(w => w.WeightKg);

        var thirtyDaysAgo = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30));
        var last30 = logs.Where(w => w.LoggedAt >= thirtyDaysAgo).ToList();
        var avg30 = last30.Any() ? last30.Average(w => w.WeightKg) : (decimal?)null;

        var trend = "stable";
        if (logs.Count >= 2)
        {
            var diff = logs[0].WeightKg - logs[1].WeightKg;
            if (diff > 0.1m) trend = "up";
            else if (diff < -0.1m) trend = "down";
        }

        return new WeightSummaryDto(current, lowest, highest, avg30.HasValue ? Math.Round(avg30.Value, 2) : null, trend);
    }

    private async Task EnsureCatOwnership(Guid catId, Guid userId)
    {
        var exists = await uow.Cats.AnyAsync(c => c.Id == catId && c.UserId == userId);
        if (!exists) throw new KeyNotFoundException("Kedi bulunamadı.");
    }
}
