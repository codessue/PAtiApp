using Microsoft.EntityFrameworkCore;
using Pati.API.Data;
using Pati.API.DTOs.Expenses;
using Pati.API.Entities;
using Pati.API.Repositories;

namespace Pati.API.Services;

public class ExpenseService(IUnitOfWork uow, AppDbContext context, IWebHostEnvironment env)
{
    private static readonly HashSet<string> Categories =
    [
        "food", "litter", "toy", "accessory", "grooming",
        "exam", "treatment", "medication", "vaccine", "surgery", "lab", "other"
    ];

    private static readonly HashSet<string> Places = ["market", "petshop", "online", "vet", "other"];

    private const long MaxReceiptBytes = 8 * 1024 * 1024; // 8 MB

    // Uzantı dosya adından alınmaz (depolanmış XSS riski); yalnızca bilinen resim türleri.
    private static readonly Dictionary<string, string> AllowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/jpg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
        ["image/heic"] = ".heic",
    };

    public async Task<IEnumerable<VetExpenseDto>> GetExpensesAsync(Guid catId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var expenses = await context.VetExpenses
            .Include(e => e.Payments)
            .Where(e => e.CatId == catId)
            .OrderByDescending(e => e.ExpenseDate)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync();

        return expenses.Select(MapToDto);
    }

    public async Task<ExpenseSummaryDto> GetSummaryAsync(Guid catId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var expenses = await context.VetExpenses
            .Include(e => e.Payments)
            .Where(e => e.CatId == catId)
            .ToListAsync();

        var totalAmount = expenses.Sum(e => e.Amount);
        var totalPaid = expenses.Sum(e => e.Payments.Sum(p => p.Amount));
        var unpaidCount = expenses.Count(e => e.Amount - e.Payments.Sum(p => p.Amount) > 0);

        return new ExpenseSummaryDto(totalAmount, totalPaid, totalAmount - totalPaid, expenses.Count, unpaidCount);
    }

    public async Task<OverallExpenseSummaryDto> GetOverallSummaryAsync(Guid userId)
    {
        var expenses = await context.VetExpenses
            .Include(e => e.Cat)
            .Include(e => e.Payments)
            .Where(e => e.Cat.UserId == userId)
            .ToListAsync();

        var cats = expenses
            .GroupBy(e => new { e.CatId, e.Cat.Name })
            .Select(g =>
            {
                var total = g.Sum(e => e.Amount);
                var paid = g.Sum(e => e.Payments.Sum(p => p.Amount));
                return new CatExpenseSummaryDto(g.Key.CatId, g.Key.Name, total, paid, total - paid);
            })
            .OrderByDescending(c => c.TotalRemaining)
            .ThenBy(c => c.CatName)
            .ToList();

        var totalAmount = cats.Sum(c => c.TotalAmount);
        var totalPaid = cats.Sum(c => c.TotalPaid);
        var unpaidCount = expenses.Count(e => e.Amount - e.Payments.Sum(p => p.Amount) > 0);

        return new OverallExpenseSummaryDto(totalAmount, totalPaid, totalAmount - totalPaid, expenses.Count, unpaidCount, cats);
    }

    public async Task<VetExpenseDto> CreateExpenseAsync(Guid catId, Guid userId, CreateVetExpenseDto dto)
    {
        await EnsureCatOwnership(catId, userId);

        if (string.IsNullOrWhiteSpace(dto.Title))
            throw new ArgumentException("Açıklama zorunludur.");
        if (!Categories.Contains(dto.Category))
            throw new ArgumentException("Geçersiz kategori.");
        var place = string.IsNullOrWhiteSpace(dto.Place) ? "vet" : dto.Place;
        if (!Places.Contains(place))
            throw new ArgumentException("Geçersiz alışveriş yeri.");
        if (dto.Amount <= 0)
            throw new ArgumentException("Tutar sıfırdan büyük olmalıdır.");
        if (dto.PaidAmount is < 0)
            throw new ArgumentException("Ödenen tutar negatif olamaz.");
        if (dto.PaidAmount > dto.Amount)
            throw new ArgumentException("Ödenen tutar toplam tutardan büyük olamaz.");

        var expense = new VetExpense
        {
            CatId = catId,
            Title = dto.Title.Trim(),
            Category = dto.Category,
            Place = place,
            ClinicName = dto.ClinicName,
            ExpenseDate = dto.ExpenseDate,
            Amount = dto.Amount,
            Notes = dto.Notes
        };

        if (dto.PaidAmount is > 0)
        {
            expense.Payments.Add(new VetPayment
            {
                ExpenseId = expense.Id,
                Amount = dto.PaidAmount.Value,
                PaidAt = dto.ExpenseDate
            });
        }

        await uow.VetExpenses.AddAsync(expense);
        await uow.SaveChangesAsync();

        return MapToDto(expense);
    }

    public async Task DeleteExpenseAsync(Guid catId, Guid expenseId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var expense = await uow.VetExpenses.FirstOrDefaultAsync(e => e.Id == expenseId && e.CatId == catId)
            ?? throw new KeyNotFoundException("Gider kaydı bulunamadı.");

        var receiptUrl = expense.ReceiptUrl;
        uow.VetExpenses.Remove(expense);
        await uow.SaveChangesAsync();
        DeleteUploadedFile(receiptUrl);
    }

    public async Task<VetExpenseDto> UpdateReceiptAsync(Guid catId, Guid expenseId, Guid userId, IFormFile? receipt)
    {
        if (receipt is null || receipt.Length == 0)
            throw new InvalidOperationException("Lütfen bir fiş veya görsel seçin.");
        if (receipt.Length > MaxReceiptBytes)
            throw new InvalidOperationException("Görsel çok büyük (en fazla 8 MB).");
        if (!AllowedImageTypes.TryGetValue(receipt.ContentType ?? string.Empty, out var extension))
            throw new InvalidOperationException("Yalnızca JPG, PNG, WEBP veya HEIC görsel yükleyebilirsiniz.");

        await EnsureCatOwnership(catId, userId);

        var expense = await context.VetExpenses
            .Include(e => e.Payments)
            .FirstOrDefaultAsync(e => e.Id == expenseId && e.CatId == catId)
            ?? throw new KeyNotFoundException("Gider kaydı bulunamadı.");

        var uploadPath = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", "receipts");
        Directory.CreateDirectory(uploadPath);

        var fileName = $"{expenseId}_{Guid.NewGuid()}{extension}";
        await using (var stream = new FileStream(Path.Combine(uploadPath, fileName), FileMode.Create))
        {
            await receipt.CopyToAsync(stream);
        }

        var previous = expense.ReceiptUrl;
        expense.ReceiptUrl = $"/uploads/receipts/{fileName}";
        await uow.SaveChangesAsync();
        DeleteUploadedFile(previous);

        return MapToDto(expense);
    }

    public async Task<VetExpenseDto> DeleteReceiptAsync(Guid catId, Guid expenseId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var expense = await context.VetExpenses
            .Include(e => e.Payments)
            .FirstOrDefaultAsync(e => e.Id == expenseId && e.CatId == catId)
            ?? throw new KeyNotFoundException("Gider kaydı bulunamadı.");

        var previous = expense.ReceiptUrl;
        expense.ReceiptUrl = null;
        await uow.SaveChangesAsync();
        DeleteUploadedFile(previous);

        return MapToDto(expense);
    }

    public async Task<VetExpenseDto> AddPaymentAsync(Guid catId, Guid expenseId, Guid userId, CreateVetPaymentDto dto)
    {
        await EnsureCatOwnership(catId, userId);

        var expense = await context.VetExpenses
            .Include(e => e.Payments)
            .FirstOrDefaultAsync(e => e.Id == expenseId && e.CatId == catId)
            ?? throw new KeyNotFoundException("Gider kaydı bulunamadı.");

        if (dto.Amount <= 0)
            throw new ArgumentException("Ödeme tutarı sıfırdan büyük olmalıdır.");

        var remaining = expense.Amount - expense.Payments.Sum(p => p.Amount);
        if (dto.Amount > remaining)
            throw new ArgumentException($"Ödeme tutarı kalan borçtan ({remaining:0.00} TL) büyük olamaz.");

        var payment = new VetPayment
        {
            ExpenseId = expense.Id,
            Amount = dto.Amount,
            PaidAt = dto.PaidAt,
            Notes = dto.Notes
        };

        await uow.VetPayments.AddAsync(payment);
        await uow.SaveChangesAsync();

        return MapToDto(expense);
    }

    public async Task DeletePaymentAsync(Guid catId, Guid expenseId, Guid paymentId, Guid userId)
    {
        await EnsureCatOwnership(catId, userId);

        var payment = await context.VetPayments
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.ExpenseId == expenseId && p.Expense.CatId == catId)
            ?? throw new KeyNotFoundException("Ödeme kaydı bulunamadı.");

        uow.VetPayments.Remove(payment);
        await uow.SaveChangesAsync();
    }

    private static VetExpenseDto MapToDto(VetExpense e)
    {
        var paid = e.Payments.Sum(p => p.Amount);
        var payments = e.Payments
            .OrderByDescending(p => p.PaidAt)
            .ThenByDescending(p => p.CreatedAt)
            .Select(p => new VetPaymentDto(p.Id, p.ExpenseId, p.Amount, p.PaidAt, p.Notes));

        return new VetExpenseDto(
            e.Id, e.CatId, e.Title, e.Category, e.Place, e.ClinicName, e.ExpenseDate,
            e.Amount, paid, e.Amount - paid, e.Notes, e.ReceiptUrl, payments);
    }

    private void DeleteUploadedFile(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return;
        try
        {
            var segments = url.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length == 0 || segments.Any(seg => seg == "..")) return;

            var root = Path.GetFullPath(env.WebRootPath ?? "wwwroot");
            var path = Path.GetFullPath(Path.Combine([root, .. segments]));
            if (!path.StartsWith(root, StringComparison.Ordinal)) return;
            if (File.Exists(path)) File.Delete(path);
        }
        catch
        {
            // en-iyi-çaba
        }
    }

    private async Task EnsureCatOwnership(Guid catId, Guid userId)
    {
        var exists = await uow.Cats.AnyAsync(c => c.Id == catId && c.UserId == userId);
        if (!exists) throw new KeyNotFoundException("Kedi bulunamadı.");
    }
}
