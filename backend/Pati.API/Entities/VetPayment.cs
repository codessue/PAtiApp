namespace Pati.API.Entities;

public class VetPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ExpenseId { get; set; }
    public decimal Amount { get; set; }
    public DateOnly PaidAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public VetExpense Expense { get; set; } = null!;
}
