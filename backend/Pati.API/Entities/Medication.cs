namespace Pati.API.Entities;

public class Medication
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CatId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public string FrequencyType { get; set; } = "daily";
    public int FrequencyTimes { get; set; } = 1;
    public List<string> ReminderTimes { get; set; } = new();
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    public Cat Cat { get; set; } = null!;
    public ICollection<MedicationLog> MedicationLogs { get; set; } = new List<MedicationLog>();
}
