namespace Pati.API.DTOs.Assistant;

/// <summary>
/// Kullanıcının semptom asistanına gönderdiği istek. <see cref="CatId"/> verilirse
/// kedinin profili (yaş, ırk, kilo vb.) bağlam olarak modele eklenir.
/// </summary>
public record SymptomCheckRequestDto(
    Guid? CatId,
    string Message,
    int? DurationDays
);

/// <summary>
/// Modelin döndürdüğü yapılandırılmış ön-değerlendirme. Bu bir teşhis değildir;
/// <see cref="Disclaimer"/> her zaman sunucu tarafında doldurulur.
/// </summary>
public record SymptomCheckResponseDto(
    string Urgency,                       // "acil" | "yakinda" | "izle" | "bilgi"
    string Summary,
    IReadOnlyList<string> PossibleCauses,
    IReadOnlyList<string> Recommendations,
    IReadOnlyList<string> VetQuestions,
    string Disclaimer
);
