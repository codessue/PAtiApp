using Microsoft.EntityFrameworkCore;
using Pati.API.Data;
using Pati.API.DTOs.Expenses;
using Pati.API.Entities;
using Pati.API.Repositories;

namespace Pati.API.Services;

public class ExpenseService(IUnitOfWork uow, AppDbContext context)
{
    private static readonly HashSet<string> Categories =
        ["exam", "treatment", "medication", "vaccine", "surgery", "lab", "other"];

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

    public async Task<VetExpenseDto> CreateExpenseAsync(Guid catId, Guid userId, CreateVetExpenseDto dto)
    {
        await EnsureCatOwnership(catId, userId);

        if (string.IsNullOrWhiteSpace(dto.Title))
            throw new ArgumentException("Açıklama zorunludur.");
        if (!Categories.Contains(dto.Category))
            throw new ArgumentException("Geçersiz kategori.");
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

        uow.VetExpenses.Remove(expense);
        await uow.SaveChangesAsync();
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
            e.Id, e.CatId, e.Title, e.Category, e.ClinicName, e.ExpenseDate,
            e.Amount, paid, e.Amount - paid, e.Notes, payments);
    }

    private async Task EnsureCatOwnership(Guid catId, Guid userId)
    {
        var exists = await uow.Cats.AnyAsync(c => c.Id == catId && c.UserId == userId);
        if (!exists) throw new KeyNotFoundException("Kedi bulunamadı.");
    }
}
