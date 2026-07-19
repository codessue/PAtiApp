using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Pati.API.DTOs.Assistant;

namespace Pati.API.Services;

/// <summary>
/// Kedi semptomları için Google Gemini tabanlı ön-değerlendirme üretir. Teşhis
/// koymaz; aciliyet seviyesi, olası nedenler ve veterinere sorulacak sorular önerir.
/// Gemini'nin ücretsiz katmanı kullanılır (aistudio.google.com — kart gerekmez);
/// toplam kullanım ücretsiz limitte kalsın diye kullanıcı başına günlük sorgu
/// sınırı uygulanır. API anahtarı yalnızca sunucuda tutulur.
/// </summary>
public class AssistantService(
    IConfiguration config,
    CatService catService,
    IHttpClientFactory httpFactory,
    IMemoryCache cache,
    ILogger<AssistantService> logger)
{
    private const int DefaultDailyLimit = 5;
    // Benchmark (19 Tem 2026): 3.5-flash ~30sn, 3.1-flash-lite ~1.5sn — lite hem
    // hızlı hem ücretsiz katmanı geniş; kalite bu kullanım için fazlasıyla yeterli.
    private const string DefaultModel = "gemini-3.1-flash-lite";

    // Yanıtta her zaman bulunması için uyarı metni modele bırakılmaz, sunucuda eklenir.
    private const string Disclaimer =
        "Bu değerlendirme yalnızca bilgilendirme amaçlıdır ve veteriner muayenesinin " +
        "yerini tutmaz. Endişeniz varsa veya belirtiler ağırlaşıyorsa lütfen vakit " +
        "kaybetmeden bir veteriner hekime başvurun.";

    private const string SystemPrompt =
        """
        Sen "Pati" uygulamasının evcil hayvan sağlığı bilgilendirme asistanısın. Kedi,
        köpek, kuş, hamster, tavşan gibi evcil hayvanlar hakkında bilgi verirsin. Bir
        veteriner hekim DEĞİLSİN ve KESİNLİKLE teşhis koymazsın. Görevin, hayvan
        sahibine olası nedenler hakkında genel bilgi vermek ve aciliyeti değerlendirmektir.

        Kurallar:
        - Türkçe, sade ve sakin bir dille yaz. Hayvan sahibi panik yapmasın ama riski de
          küçümseme.
        - Değerlendirmeni hayvanın TÜRÜNE göre yap: aynı belirti türden türe çok farklı
          anlam taşıyabilir (örn. kuş ve hamster gibi küçük hayvanlar hastalığı gizler,
          durumları çok hızlı kötüleşir — onlarda eşiği daha da temkinli tut).
        - Aciliyeti TEMKİNLİ değerlendir: emin değilsen daha yüksek aciliyet seç.
        - Şu durumlarda aciliyet "acil" olmalı: uzun süre hiç yememe/içmeme (küçük
          hayvanlarda birkaç saat bile kritik olabilir), nefes alma güçlüğü, idrar
          yapamama (özellikle erkek kedide tıkanma), tekrarlayan kusma/ishal, bilinç
          bulanıklığı/baygınlık, nöbet, felç/güçsüzlük, ciddi kanama, zehirlenme
          şüphesi, yutulan yabancı cisim, ciddi travma/düşme.
        - Asla ilaç adı, doz veya reçete önerme. İnsan ilaçlarının evcil hayvanlar için
          tehlikeli olabileceğini hatırlat.
        - Tür belirtilmemişse genel konuş ve gerekiyorsa türe göre farkları kısaca not et.
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
                "Yapay zekâ asistanı şu anda yapılandırılmamış. (Sunucuda GEMINI_API_KEY tanımlı değil.)");

        // Günlük ücretsiz hak kontrolü — hak yalnızca başarılı yanıtta düşülür.
        var dailyLimit = config.GetValue("Assistant:DailyLimit", DefaultDailyLimit);
        var quotaKey = $"assistant-quota:{userId}:{DateTime.UtcNow:yyyyMMdd}";
        var used = cache.TryGetValue(quotaKey, out int u) ? u : 0;
        if (used >= dailyLimit)
            throw new InvalidOperationException(
                $"Bugünlük ücretsiz değerlendirme hakkın doldu ({dailyLimit}/{dailyLimit}). Yarın tekrar deneyebilirsin.");

        var userPrompt = await BuildUserPromptAsync(userId, request);
        var text = await CallGeminiAsync(apiKey, userPrompt);

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

        // Başarılı yanıt — günlük hakkı şimdi düş (UTC gece yarısına kadar geçerli).
        cache.Set(quotaKey, used + 1, DateTime.UtcNow.Date.AddDays(1));

        return new SymptomCheckResponseDto(
            Urgency: NormalizeUrgency(parsed.Urgency),
            Summary: parsed.Summary ?? string.Empty,
            PossibleCauses: parsed.PossibleCauses ?? [],
            Recommendations: parsed.Recommendations ?? [],
            VetQuestions: parsed.VetQuestions ?? [],
            Disclaimer: Disclaimer
        );
    }

    private async Task<string> CallGeminiAsync(string apiKey, string userPrompt)
    {
        var model = config["Gemini:Model"] ?? DefaultModel;
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";

        var body = new
        {
            systemInstruction = new { parts = new[] { new { text = SystemPrompt } } },
            contents = new[]
            {
                new { role = "user", parts = new[] { new { text = userPrompt } } },
            },
            generationConfig = new
            {
                responseMimeType = "application/json",
                responseSchema = BuildSchema(),
                maxOutputTokens = 4096,
                temperature = 0.4,
            },
        };

        HttpResponseMessage response;
        string responseBody;
        try
        {
            var client = httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(45);
            using var req = new HttpRequestMessage(HttpMethod.Post, url);
            req.Headers.Add("x-goog-api-key", apiKey);
            req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
            response = await client.SendAsync(req);
            responseBody = await response.Content.ReadAsStringAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Gemini isteği gönderilemedi.");
            throw new InvalidOperationException("Asistan şu anda yanıt veremedi. Lütfen birazdan tekrar deneyin.");
        }

        if ((int)response.StatusCode == 429)
            throw new InvalidOperationException(
                "Asistan şu anda çok yoğun (ücretsiz kullanım sınırı). Lütfen bir dakika sonra tekrar dene.");

        if (!response.IsSuccessStatusCode)
        {
            logger.LogError("Gemini hata döndürdü ({Status}): {Body}", (int)response.StatusCode, responseBody);
            throw new InvalidOperationException("Asistan şu anda yanıt veremedi. Lütfen birazdan tekrar deneyin.");
        }

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrWhiteSpace(text))
                throw new InvalidOperationException("Asistan boş bir yanıt döndürdü. Lütfen tekrar deneyin.");

            return text;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            // Aday üretilmemiş olabilir (ör. güvenlik filtresi) — gövdeyi logla.
            logger.LogError(ex, "Gemini yanıtı beklenen biçimde değil: {Body}", responseBody);
            throw new InvalidOperationException(
                "Asistan bu soruya yanıt veremedi. Lütfen belirtileri farklı bir şekilde anlatmayı deneyin.");
        }
    }

    // appsettings'teki "${GEMINI_API_KEY}" yer tutucusu çözülmemişse gerçek
    // ortam değişkenine düş.
    private string? ResolveApiKey()
    {
        var key = config["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(key) || key.StartsWith("${"))
            key = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        return key;
    }

    private async Task<string> BuildUserPromptAsync(Guid userId, SymptomCheckRequestDto request)
    {
        var sb = new StringBuilder();

        if (request.CatId is { } catId)
        {
            // GetCatAsync sahiplik kontrolünü de yapar; başkasının hayvanı 404 döner.
            var cat = await catService.GetCatAsync(catId, userId);
            sb.AppendLine("Evcil hayvanın bilgileri:");
            sb.AppendLine($"- Tür: {SpeciesLabel(cat.Species)}");
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

    private static string SpeciesLabel(string species) => species switch
    {
        "kedi" => "Kedi",
        "kopek" => "Köpek",
        "kus" => "Kuş",
        "hamster" => "Hamster",
        "tavsan" => "Tavşan",
        _ => "Diğer",
    };

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

    // Gemini responseSchema — OpenAPI alt kümesi (additionalProperties desteklenmez).
    private static object BuildSchema() => new
    {
        type = "object",
        properties = new
        {
            urgency = new
            {
                type = "string",
                @enum = new[] { "acil", "yakinda", "izle", "bilgi" },
            },
            summary = new { type = "string", description = "Durumun 1-2 cümlelik özeti." },
            possibleCauses = new { type = "array", items = new { type = "string" } },
            recommendations = new { type = "array", items = new { type = "string" } },
            vetQuestions = new { type = "array", items = new { type = "string" } },
        },
        required = new[] { "urgency", "summary", "possibleCauses", "recommendations", "vetQuestions" },
    };

    private sealed record ModelOutput(
        string? Urgency,
        string? Summary,
        List<string>? PossibleCauses,
        List<string>? Recommendations,
        List<string>? VetQuestions
    );
}
