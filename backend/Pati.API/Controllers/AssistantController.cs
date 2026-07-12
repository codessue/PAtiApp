using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pati.API.DTOs;
using Pati.API.DTOs.Assistant;
using Pati.API.Services;

namespace Pati.API.Controllers;

[Authorize]
public class AssistantController(AssistantService assistantService) : BaseController
{
    [HttpPost("/api/assistant/symptom-check")]
    public async Task<IActionResult> SymptomCheck([FromBody] SymptomCheckRequestDto dto)
    {
        var result = await assistantService.CheckSymptomsAsync(CurrentUserId, dto);
        return Ok(ApiResponse<SymptomCheckResponseDto>.Ok(result));
    }
}
