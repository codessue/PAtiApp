using System.Text;
using System.Text.Json;
using Anthropic;
using Anthropic.Models.Messages;
using Pati.API.DTOs.Assistant;

namespace Pati.API.Services;

/// <summary>
/// Kedi semptomları için Claude tabanlı ön-değerlendirme üretir. Teşhis koymaz;
/// aciliyet seviyesi, olası nedenler ve veterinere sorulacak sorular önerir.
/// API anahtarı yalnızca sunucuda tutulur — mobil istemci asla görmez.
/// </summary>
public class AssistantService(IConfiguration config, CatService catService, ILogger<AssistantService> logger)
{
    // Yanıtta her zaman bulunması için uyarı metni modele bırakılmaz, sunucuda eklenir.
    private const string Disclaimer =
        "Bu değerlendirme yalnızca bilgilendirme amaçlıdır ve veteriner muayenesinin " +
        "yerini tutmaz. Endişeniz varsa veya belirtiler ağırlaşıyorsa lütfen vakit " +
        "kaybetmeden bir veteriner hekime başvurun.";

    private const string SystemPrompt =
        """
        Sen "Pati" uygulamasının kedi sağlığı bilgilendirme asistanısın. Bir veteriner
        hekim DEĞİLSİN ve KESİNLİKLE teşhis koymazsın. Görevin, kedi sahibine olası
        nedenler hakkında genel bilgi vermek ve aciliyeti değerlendirmektir.

        Kurallar:
        - Türkçe, sade ve sakin bir dille yaz. Kedi sahibi panik yapmasın ama riski de
          küçümseme.
        - Aciliyeti TEMKİNLİ değerlendir: emin değilsen daha yüksek aciliyet seç.
        - Şu durumlarda aciliyet "acil" olmalı: 24 saatten uzun süre hiç yememe/içmeme,
          nefes alma güçlüğü, idrar yapamama veya ağrılı/sık idrar denemesi (özellikle
          erkek kedide), tekrarlayan kusma, bilinç bulanıklığı/baygınlık, nöbet,
          felç/güçsüzlük, ciddi kanama, zehirlenme şüphesi, yutulan yabancı cisim.
        - Asla ilaç adı, doz veya reçete önerme. İnsan ilaçlarının kediler için tehlikeli
          olabileceğini hatırlat.
        - Liste alanlarını kısa tut (3-5 madde).
        - Yanıtı SADECE istenen JSON şemasına uygun ver.

        Aciliyet seviyeleri:
        - "acil": Mümkün olan en kısa sürede veterinere / acil veterinere git.
        - "yakinda": 24-48 saat içinde veteriner randevusu al.
        - "izle": Evde gözlemle, kötüleşirse veterinere başvur.
        - "bilgi": Acil bir durum değil, genel bilgilendirme.
        """;

    public async Task<SymptomCheckResponseDto> CheckSymptomsAsync(Guid userId, SymptomCheckRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            throw new InvalidOperationException("Lütfen belirtileri kısaca açıklayın.");

        var apiKey = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException(
                "Yapay zekâ asistanı şu anda yapılandırılmamış. (Sunucuda ANTHROPIC_API_KEY tanımlı değil.)");

        var userPrompt = await BuildUserPromptAsync(userId, request);

        var client = new AnthropicClient { ApiKey = apiKey };

        Message response;
        try
        {
            response = await client.Messages.Create(new MessageCreateParams
            {
                Model = Model.ClaudeOpus4_8,
                MaxTokens = 2048,
                System = new List<TextBlockParam> { new() { Text = SystemPrompt } },
                Thinking = new ThinkingConfigAdaptive(),
                OutputConfig = new OutputConfig
                {
                    Effort = Effort.Medium,
                    Format = new JsonOutputFormat { Schema = BuildSchema() },
                },
                Messages = [new() { Role = Role.User, Content = userPrompt }],
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Anthropic isteği başarısız oldu.");
            throw new InvalidOperationException("Asistan şu anda yanıt veremedi. Lütfen birazdan tekrar deneyin.");
        }

        if (response.StopReason == "refusal")
            throw new InvalidOperationException(
                "Asistan bu soruya yanıt veremedi. Lütfen belirtileri farklı bir şekilde anlatmayı deneyin.");

        var text = response.Content
            .Select(b => b.Value)
            .OfType<TextBlock>()
            .Select(t => t.Text)
            .FirstOrDefault(t => !string.IsNullOrWhiteSpace(t));

        if (string.IsNullOrWhiteSpace(text))
            throw new InvalidOperationException("Asistan boş bir yanıt döndürdü. Lütfen tekrar deneyin.");

        ModelOutput? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<ModelOutput>(text, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            });
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "Asistan yanıtı çözümlenemedi: {Text}", text);
            throw new InvalidOperationException("Asistan yanıtı işlenemedi. Lütfen tekrar deneyin.");
        }

        if (parsed is null)
            throw new InvalidOperationException("Asistan yanıtı işlenemedi. Lütfen tekrar deneyin.");

        return new SymptomCheckResponseDto(
            Urgency: NormalizeUrgency(parsed.Urgency),
            Summary: parsed.Summary ?? string.Empty,
            PossibleCauses: parsed.PossibleCauses ?? [],
            Recommendations: parsed.Recommendations ?? [],
            VetQuestions: parsed.VetQuestions ?? [],
            Disclaimer: Disclaimer
        );
    }

    // appsettings'teki "${ANTHROPIC_API_KEY}" yer tutucusu çözülmemişse gerçek
    // ortam değişkenine düş.
    private string? ResolveApiKey()
    {
        var key = config["Anthropic:ApiKey"];
        if (string.IsNullOrWhiteSpace(key) || key.StartsWith("${"))
            key = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        return key;
    }

    private async Task<string> BuildUserPromptAsync(Guid userId, SymptomCheckRequestDto request)
    {
        var sb = new StringBuilder();

        if (request.CatId is { } catId)
        {
            // GetCatAsync sahiplik kontrolünü de yapar; başkasının kedisi 404 döner.
            var cat = await catService.GetCatAsync(catId, userId);
            sb.AppendLine("Kedinin bilgileri:");
            sb.AppendLine($"- İsim: {cat.Name}");
            if (!string.IsNullOrWhiteSpace(cat.Breed)) sb.AppendLine($"- Irk: {cat.Breed}");
            if (cat.BirthDate is { } birth) sb.AppendLine($"- Yaş: {DescribeAge(birth)}");
            if (!string.IsNullOrWhiteSpace(cat.Gender))
                sb.AppendLine($"- Cinsiyet: {(cat.Gender == "male" ? "Erkek" : "Dişi")}");
            sb.AppendLine($"- Kısırlaştırılmış mı: {(cat.IsNeutered ? "Evet" : "Hayır")}");
            if (cat.LatestWeight is { } w) sb.AppendLine($"- Son ölçülen kilo: {w:0.0} kg");
            if (!string.IsNullOrWhiteSpace(cat.Notes)) sb.AppendLine($"- Sahibinin notları: {cat.Notes}");
            sb.AppendLine();
        }

        if (request.DurationDays is { } days && days > 0)
            sb.AppendLine($"Belirtilerin süresi: yaklaşık {days} gün.");

        sb.AppendLine("Sahibinin anlattığı belirtiler:");
        sb.AppendLine(request.Message.Trim());

        return sb.ToString();
    }

    private static string DescribeAge(DateOnly birth)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var months = (today.Year - birth.Year) * 12 + today.Month - birth.Month;
        if (today.Day < birth.Day) months--;
        if (months < 0) months = 0;
        return months >= 12 ? $"{months / 12} yaş" : $"{months} aylık";
    }

    private static string NormalizeUrgency(string? raw)
    {
        var v = raw?.Trim().ToLowerInvariant();
        return v is "acil" or "yakinda" or "izle" or "bilgi" ? v : "izle";
    }

    private static Dictionary<string, JsonElement> BuildSchema()
    {
        var schema = new
        {
            type = "object",
            properties = new
            {
                urgency = new { type = "string", @enum = new[] { "acil", "yakinda", "izle", "bilgi" } },
                summary = new { type = "string", description = "Durumun 1-2 cümlelik özeti." },
                possibleCauses = new { type = "array", items = new { type = "string" } },
                recommendations = new { type = "array", items = new { type = "string" } },
                vetQuestions = new { type = "array", items = new { type = "string" } },
            },
            required = new[] { "urgency", "summary", "possibleCauses", "recommendations", "vetQuestions" },
            additionalProperties = false,
        };

        // JsonOutputFormat.Schema -> Dictionary<string, JsonElement>
        var json = JsonSerializer.SerializeToElement(schema);
        return json.EnumerateObject().ToDictionary(p => p.Name, p => p.Value);
    }

    private sealed record ModelOutput(
        string? Urgency,
        string? Summary,
        List<string>? PossibleCauses,
        List<string>? Recommendations,
        List<string>? VetQuestions
    );
}
