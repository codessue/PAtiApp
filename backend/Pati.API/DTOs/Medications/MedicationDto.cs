namespace Pati.API.DTOs.Medications;

public record MedicationDto(
    Guid Id,
    Guid CatId,
    string? CatName,
    string Name,
    string? Dosage,
    string FrequencyType,
    int FrequencyTimes,
    List<string> ReminderTimes,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsActive,
    string? Notes
);

public record CreateMedicationDto(
    string Name,
    string? Dosage,
    string FrequencyType,
    int FrequencyTimes,
    List<string> ReminderTimes,
    DateOnly StartDate,
    DateOnly? EndDate,
    string? Notes
);

public record UpdateMedicationDto(
    string Name,
    string? Dosage,
    string FrequencyType,
    int FrequencyTimes,
    List<string> ReminderTimes,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsActive,
    string? Notes
);

public record LogMedicationDto(string Status, string? Notes);

public record TodayMedicationDto(
    Guid MedicationId,
    Guid CatId,
    string CatName,
    string MedicationName,
    string ReminderTime,
    string Status
);
