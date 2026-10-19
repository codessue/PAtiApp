namespace Pati.API.DTOs.Expenses;

public record VetPaymentDto(Guid Id, Guid ExpenseId, decimal Amount, DateOnly PaidAt, string? Notes);

public record VetExpenseDto(
    Guid Id,
    Guid CatId,
    string Title,
    string Category,
    string Place,
    string? ClinicName,
    DateOnly ExpenseDate,
    decimal Amount,
    decimal PaidAmount,
    decimal RemainingAmount,
    string? Notes,
    string? ReceiptUrl,
    IEnumerable<VetPaymentDto> Payments
);

public record CreateVetExpenseDto(
    string Title,
    string Category,
    string? Place,
    string? ClinicName,
    DateOnly ExpenseDate,
    decimal Amount,
    decimal? PaidAmount,
    string? Notes
);

public record CreateVetPaymentDto(decimal Amount, DateOnly PaidAt, string? Notes);

public record ExpenseSummaryDto(
    decimal TotalAmount,
    decimal TotalPaid,
    decimal TotalRemaining,
    int ExpenseCount,
    int UnpaidCount
);

public record CatExpenseSummaryDto(
    Guid CatId,
    string CatName,
    decimal TotalAmount,
    decimal TotalPaid,
    decimal TotalRemaining
);

public record OverallExpenseSummaryDto(
    decimal TotalAmount,
    decimal TotalPaid,
    decimal TotalRemaining,
    int ExpenseCount,
    int UnpaidCount,
    IEnumerable<CatExpenseSummaryDto> Cats
);
