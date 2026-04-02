using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pati.API.DTOs;
using Pati.API.DTOs.Vaccines;
using Pati.API.Services;

namespace Pati.API.Controllers;

[Authorize]
public class VaccinesController(VaccineService vaccineService) : BaseController
{
    [HttpGet("/api/cats/{catId:guid}/vaccines")]
    public async Task<IActionResult> GetAll(Guid catId)
    {
        var vaccines = await vaccineService.GetCatVaccinesAsync(catId, CurrentUserId);
        return Ok(ApiResponse<IEnumerable<VaccineDto>>.Ok(vaccines));
    }

    [HttpPost("/api/cats/{catId:guid}/vaccines")]
    public async Task<IActionResult> Create(Guid catId, [FromBody] CreateVaccineDto dto)
    {
        var vaccine = await vaccineService.CreateVaccineAsync(catId, CurrentUserId, dto);
        return StatusCode(201, ApiResponse<VaccineDto>.Created(vaccine));
    }

    [HttpPut("/api/cats/{catId:guid}/vaccines/{id:guid}")]
    public async Task<IActionResult> Update(Guid catId, Guid id, [FromBody] UpdateVaccineDto dto)
    {
        var vaccine = await vaccineService.UpdateVaccineAsync(catId, id, CurrentUserId, dto);
        return Ok(ApiResponse<VaccineDto>.Ok(vaccine));
    }

    [HttpDelete("/api/cats/{catId:guid}/vaccines/{id:guid}")]
    public async Task<IActionResult> Delete(Guid catId, Guid id)
    {
        await vaccineService.DeleteVaccineAsync(catId, id, CurrentUserId);
        return Ok(ApiResponse.OkEmpty("Aşı kaydı silindi."));
    }

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming([FromQuery] int days = 30)
    {
        var vaccines = await vaccineService.GetUpcomingVaccinesAsync(CurrentUserId, days);
        return Ok(ApiResponse<IEnumerable<VaccineDto>>.Ok(vaccines));
    }
}
