using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pati.API.DTOs;
using Pati.API.DTOs.Cats;
using Pati.API.Services;

namespace Pati.API.Controllers;

[Authorize]
public class CatsController(CatService catService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var cats = await catService.GetUserCatsAsync(CurrentUserId);
        return Ok(ApiResponse<IEnumerable<CatDto>>.Ok(cats));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var cat = await catService.GetCatAsync(id, CurrentUserId);
        return Ok(ApiResponse<CatDto>.Ok(cat));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCatDto dto)
    {
        var cat = await catService.CreateCatAsync(CurrentUserId, dto);
        return StatusCode(201, ApiResponse<CatDto>.Created(cat));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCatDto dto)
    {
        var cat = await catService.UpdateCatAsync(id, CurrentUserId, dto);
        return Ok(ApiResponse<CatDto>.Ok(cat));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await catService.DeleteCatAsync(id, CurrentUserId);
        return Ok(ApiResponse.OkEmpty("Kedi silindi."));
    }

    [HttpPost("{id:guid}/photo")]
    public async Task<IActionResult> UploadPhoto(Guid id, IFormFile photo)
    {
        var url = await catService.UpdatePhotoAsync(id, CurrentUserId, photo);
        return Ok(ApiResponse<string>.Ok(url, "Fotoğraf yüklendi."));
    }
}
