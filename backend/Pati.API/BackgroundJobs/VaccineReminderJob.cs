using Microsoft.EntityFrameworkCore;
using Pati.API.Data;
using Pati.API.Services;

namespace Pati.API.BackgroundJobs;

public class VaccineReminderJob(AppDbContext context, NotificationService notificationService, ILogger<VaccineReminderJob> logger)
{
    public async Task SendRemindersAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var targetDays = new[] { 1, 7, 30 };

        foreach (var days in targetDays)
        {
            var targetDate = today.AddDays(days);

            var vaccines = await context.VaccineSchedules
                .Include(v => v.Cat)
                    .ThenInclude(c => c.User)
                .Where(v => v.NextDueDate == targetDate && !v.IsCompleted)
                .ToListAsync();

            foreach (var vaccine in vaccines)
            {
                var pushToken = vaccine.Cat.User.ExpoPushToken;
                if (string.IsNullOrEmpty(pushToken)) continue;

                var message = days == 1
                    ? $"💉 {vaccine.Cat.Name}'ın {vaccine.VaccineType} aşısı yarın! Randevunuzu almayı unutmayın."
                    : $"💉 {vaccine.Cat.Name}'ın {vaccine.VaccineType} aşısı {days} gün sonra! Randevunuzu almayı unutmayın.";

                await notificationService.SendPushNotificationAsync(
                    pushToken,
                    "Aşı Hatırlatması",
                    message,
                    new { vaccineId = vaccine.Id, catId = vaccine.CatId }
                );

                logger.LogInformation("Aşı hatırlatması gönderildi: {CatName} - {VaccineType} - {Days} gün",
                    vaccine.Cat.Name, vaccine.VaccineType, days);
            }
        }
    }
}
