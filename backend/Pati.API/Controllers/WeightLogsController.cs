using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pati.API.DTOs;
using Pati.API.DTOs.WeightLogs;
using Pati.API.Services;

namespace Pati.API.Controllers;

[Authorize]
[Route("api/cats/{catId:guid}/weight")]
public class WeightLogsController(WeightService weightService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid catId)
    {
        var logs = await weightService.GetWeightLogsAsync(catId, CurrentUserId);
        return Ok(ApiResponse<IEnumerable<WeightLogDto>>.Ok(logs));
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid catId, [FromBody] CreateWeightLogDto dto)
    {
        var log = await weightService.AddWeightLogAsync(catId, CurrentUserId, dto);
        return StatusCode(201, ApiResponse<WeightLogDto>.Created(log));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid catId, Guid id)
    {
        await weightService.DeleteWeightLogAsync(catId, id, CurrentUserId);
        return Ok(ApiResponse.OkEmpty("Ağırlık kaydı silindi."));
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(Guid catId)
    {
        var summary = await weightService.GetWeightSummaryAsync(catId, CurrentUserId);
        return Ok(ApiResponse<WeightSummaryDto>.Ok(summary));
    }
}
