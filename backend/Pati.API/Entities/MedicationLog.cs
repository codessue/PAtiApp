namespace Pati.API.Entities;

public class MedicationLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MedicationId { get; set; }
    public DateTime ScheduledTime { get; set; }
    public DateTime? GivenAt { get; set; }
    public string Status { get; set; } = "pending";
    public string? Notes { get; set; }

    public Medication Medication { get; set; } = null!;
}
