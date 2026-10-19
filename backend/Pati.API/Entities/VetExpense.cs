namespace Pati.API.Entities;

public class VetExpense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CatId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "other";
    /// <summary>Alışverişin yapıldığı yer: market, petshop, online, vet, other.</summary>
    public string Place { get; set; } = "vet";
    public string? ClinicName { get; set; }
    public DateOnly ExpenseDate { get; set; }
    public decimal Amount { get; set; }
    public string? Notes { get; set; }
    /// <summary>Fiş / ürün görseli (/uploads/receipts/...).</summary>
    public string? ReceiptUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Cat Cat { get; set; } = null!;
    public ICollection<VetPayment> Payments { get; set; } = new List<VetPayment>();
}
