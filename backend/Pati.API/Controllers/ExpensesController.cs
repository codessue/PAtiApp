using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pati.API.DTOs;
using Pati.API.DTOs.Expenses;
using Pati.API.Services;

namespace Pati.API.Controllers;

[Authorize]
[Route("api/cats/{catId:guid}/expenses")]
public class ExpensesController(ExpenseService expenseService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid catId)
    {
        var expenses = await expenseService.GetExpensesAsync(catId, CurrentUserId);
        return Ok(ApiResponse<IEnumerable<VetExpenseDto>>.Ok(expenses));
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(Guid catId)
    {
        var summary = await expenseService.GetSummaryAsync(catId, CurrentUserId);
        return Ok(ApiResponse<ExpenseSummaryDto>.Ok(summary));
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid catId, [FromBody] CreateVetExpenseDto dto)
    {
        var expense = await expenseService.CreateExpenseAsync(catId, CurrentUserId, dto);
        return StatusCode(201, ApiResponse<VetExpenseDto>.Created(expense));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid catId, Guid id)
    {
        await expenseService.DeleteExpenseAsync(catId, id, CurrentUserId);
        return Ok(ApiResponse.OkEmpty("Gider kaydı silindi."));
    }

    [HttpPost("{id:guid}/payments")]
    public async Task<IActionResult> AddPayment(Guid catId, Guid id, [FromBody] CreateVetPaymentDto dto)
    {
        var expense = await expenseService.AddPaymentAsync(catId, id, CurrentUserId, dto);
        return StatusCode(201, ApiResponse<VetExpenseDto>.Created(expense, "Ödeme kaydedildi."));
    }

    [HttpDelete("{id:guid}/payments/{paymentId:guid}")]
    public async Task<IActionResult> DeletePayment(Guid catId, Guid id, Guid paymentId)
    {
        await expenseService.DeletePaymentAsync(catId, id, paymentId, CurrentUserId);
        return Ok(ApiResponse.OkEmpty("Ödeme kaydı silindi."));
    }
}
