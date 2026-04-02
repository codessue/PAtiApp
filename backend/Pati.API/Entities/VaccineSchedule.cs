namespace Pati.API.Entities;

public class VaccineSchedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CatId { get; set; }
    public string VaccineType { get; set; } = string.Empty;
    public DateOnly? LastGivenDate { get; set; }
    public DateOnly NextDueDate { get; set; }
    public string? VetName { get; set; }
    public string? ClinicName { get; set; }
    public string? Notes { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Cat Cat { get; set; } = null!;
}
