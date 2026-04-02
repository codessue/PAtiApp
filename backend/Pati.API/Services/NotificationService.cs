using System.Text;
using System.Text.Json;

namespace Pati.API.Services;

public class NotificationService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<NotificationService> logger)
{
    public async Task SendPushNotificationAsync(string expoPushToken, string title, string body, object? data = null)
    {
        if (string.IsNullOrWhiteSpace(expoPushToken)) return;

        var payload = new
        {
            to = expoPushToken,
            title,
            body,
            data,
            sound = "default",
            priority = "high"
        };

        try
        {
            var client = httpFactory.CreateClient();
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync(config["ExpoApi:PushUrl"] ?? "https://exp.host/--/api/v2/push/send", content);
            response.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Expo push notification gönderilemedi: {Token}", expoPushToken);
        }
    }
}
