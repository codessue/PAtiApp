using System.ComponentModel.DataAnnotations;

namespace Pati.API.DTOs.Auth;

public record LoginDto(
    [Required(ErrorMessage = "Email zorunludur.")] string Email,
    [Required(ErrorMessage = "Şifre zorunludur.")] string Password);
