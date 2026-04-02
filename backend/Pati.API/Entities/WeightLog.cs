namespace Pati.API.Entities;

public class WeightLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CatId { get; set; }
    public decimal WeightKg { get; set; }
    public DateOnly LoggedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Cat Cat { get; set; } = null!;
}
