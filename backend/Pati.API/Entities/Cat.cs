namespace Pati.API.Entities;

public class Cat
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Breed { get; set; }
    public DateOnly? BirthDate { get; set; }
    public string? Gender { get; set; }
    public string? Color { get; set; }
    public string? PhotoUrl { get; set; }
    public bool IsNeutered { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<VaccineSchedule> VaccineSchedules { get; set; } = new List<VaccineSchedule>();
    public ICollection<WeightLog> WeightLogs { get; set; } = new List<WeightLog>();
    public ICollection<Medication> Medications { get; set; } = new List<Medication>();
}
