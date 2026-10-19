using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Pati.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseController : ControllerBase
{
    /// <summary>
    /// Token'daki kullanıcı kimliği. Claim yoksa ya da Guid'e çevrilemiyorsa 401
    /// döner — Guid.Parse doğrudan çağrılırsa bozuk bir token 500'e yol açardı.
    /// </summary>
    protected Guid CurrentUserId
    {
        get
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (!Guid.TryParse(raw, out var id))
                throw new UnauthorizedAccessException("Kullanıcı kimliği bulunamadı.");
            return id;
        }
    }
}
