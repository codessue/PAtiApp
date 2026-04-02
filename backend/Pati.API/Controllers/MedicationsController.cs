using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pati.API.DTOs;
using Pati.API.DTOs.Medications;
using Pati.API.Services;

namespace Pati.API.Controllers;

[Authorize]
public class MedicationsController(MedicationService medicationService) : BaseController
{
    [HttpGet("/api/cats/{catId:guid}/medications")]
    public async Task<IActionResult> GetAll(Guid catId)
    {
        var meds = await medicationService.GetMedicationsAsync(catId, CurrentUserId);
        return Ok(ApiResponse<IEnumerable<MedicationDto>>.Ok(meds));
    }

    [HttpPost("/api/cats/{catId:guid}/medications")]
    public async Task<IActionResult> Create(Guid catId, [FromBody] CreateMedicationDto dto)
    {
        var med = await medicationService.CreateMedicationAsync(catId, CurrentUserId, dto);
        return StatusCode(201, ApiResponse<MedicationDto>.Created(med));
    }

    [HttpPut("/api/cats/{catId:guid}/medications/{id:guid}")]
    public async Task<IActionResult> Update(Guid catId, Guid id, [FromBody] UpdateMedicationDto dto)
    {
        var med = await medicationService.UpdateMedicationAsync(catId, id, CurrentUserId, dto);
        return Ok(ApiResponse<MedicationDto>.Ok(med));
    }

    [HttpDelete("/api/cats/{catId:guid}/medications/{id:guid}")]
    public async Task<IActionResult> Delete(Guid catId, Guid id)
    {
        await medicationService.DeleteMedicationAsync(catId, id, CurrentUserId);
        return Ok(ApiResponse.OkEmpty("İlaç devre dışı bırakıldı."));
    }

    [HttpPost("/api/cats/{catId:guid}/medications/{id:guid}/log")]
    public async Task<IActionResult> LogDose(Guid catId, Guid id, [FromBody] LogMedicationDto dto)
    {
        var log = await medicationService.LogDoseAsync(catId, id, CurrentUserId, dto);
        return Ok(ApiResponse<object>.Ok(new { log.Id, log.Status, log.GivenAt }));
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        var today = await medicationService.GetTodayMedicationsAsync(CurrentUserId);
        return Ok(ApiResponse<IEnumerable<TodayMedicationDto>>.Ok(today));
    }
}
