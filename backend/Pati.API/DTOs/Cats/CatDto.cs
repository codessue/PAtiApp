namespace Pati.API.DTOs.Cats;

public record CatDto(
    Guid Id,
    string Name,
    string? Breed,
    DateOnly? BirthDate,
    string? Gender,
    string? Color,
    string? PhotoUrl,
    bool IsNeutered,
    string? Notes,
    decimal? LatestWeight,
    DateOnly? NextVaccineDate,
    string? NextVaccineType
);

public record CreateCatDto(
    string Name,
    string? Breed,
    DateOnly? BirthDate,
    string? Gender,
    string? Color,
    bool IsNeutered,
    string? Notes
);

public record UpdateCatDto(
    string Name,
    string? Breed,
    DateOnly? BirthDate,
    string? Gender,
    string? Color,
    bool IsNeutered,
    string? Notes
);
