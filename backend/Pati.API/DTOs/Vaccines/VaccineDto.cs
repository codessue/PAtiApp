namespace Pati.API.DTOs.Vaccines;

public record VaccineDto(
    Guid Id,
    Guid CatId,
    string? CatName,
    string VaccineType,
    DateOnly? LastGivenDate,
    DateOnly NextDueDate,
    string? VetName,
    string? ClinicName,
    string? Notes,
    bool IsCompleted,
    int DaysUntilDue
);

public record CreateVaccineDto(
    string VaccineType,
    DateOnly? LastGivenDate,
    DateOnly NextDueDate,
    string? VetName,
    string? ClinicName,
    string? Notes
);

public record UpdateVaccineDto(
    string VaccineType,
    DateOnly? LastGivenDate,
    DateOnly NextDueDate,
    string? VetName,
    string? ClinicName,
    string? Notes,
    bool IsCompleted
);
