using System.ComponentModel.DataAnnotations;

namespace Pati.API.DTOs.Auth;

public record RegisterDto(
    [Required(ErrorMessage = "Ad zorunludur.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Ad 2-100 karakter olmalıdır.")]
    string Name,
    [Required(ErrorMessage = "Email zorunludur.")]
    [EmailAddress(ErrorMessage = "Geçerli bir email girin.")]
    [MaxLength(255)]
    string Email,
    [Required(ErrorMessage = "Şifre zorunludur.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "Şifre en az 8 karakter olmalıdır.")]
    string Password);
