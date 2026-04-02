namespace Pati.API.DTOs.WeightLogs;

public record WeightLogDto(Guid Id, Guid CatId, decimal WeightKg, DateOnly LoggedAt, string? Notes);

public record CreateWeightLogDto(decimal WeightKg, DateOnly LoggedAt, string? Notes);

public record WeightSummaryDto(
    decimal? Current,
    decimal? Lowest,
    decimal? Highest,
    decimal? AvgLast30Days,
    string Trend
);
