using System.Text;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Pati.API.BackgroundJobs;
using Pati.API.Data;
using Pati.API.Middleware;
using Pati.API.Repositories;
using Pati.API.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Veritabanı bağlantı dizesi bulunamadı.");

// appsettings.json'daki "${DB_HOST}" gibi yer tutucular .NET tarafından
// çözülmez; ortam değişkeni verilmediyse uygulama anlaşılmaz bir bağlantı
// hatasıyla değil, net bir mesajla durmalı.
if (connectionString.Contains("${"))
    throw new InvalidOperationException(
        "Veritabanı bağlantı dizesindeki ortam değişkenleri doldurulmamış. " +
        "ConnectionStrings__DefaultConnection ayarlayın (bkz. .env / docker-compose.yml).");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CatService>();
builder.Services.AddScoped<VaccineService>();
builder.Services.AddScoped<WeightService>();
builder.Services.AddScoped<MedicationService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<AssistantService>();
builder.Services.AddMemoryCache(); // asistan günlük sorgu hakları
builder.Services.AddScoped<VaccineReminderJob>();

builder.Services.AddHttpClient();

builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString)));
builder.Services.AddHangfireServer();

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("JWT secret bulunamadı.");

// HMAC-SHA256 en az 256 bit anahtar ister; kısa ya da çözülmemiş ("${JWT_SECRET}")
// bir değer ilk giriş denemesinde 500 olarak patlardı — açılışta yakalıyoruz.
if (jwtSecret.Contains("${") || Encoding.UTF8.GetByteCount(jwtSecret) < 32)
    throw new InvalidOperationException(
        "JWT secret geçersiz: en az 32 karakter olmalı ve Jwt__Secret ortam değişkeniyle verilmeli.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Pati API",
        Version = "v1",
        Description = "Pati Kedi Sağlık Takip Uygulaması API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Bearer token. Örnek: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseSerilogRequestLogging();
app.UseCors();
app.UseStaticFiles();

// Serve uploaded files (cat photos) from {contentRoot}/wwwroot/uploads at /uploads.
// The published image has no wwwroot at startup, so the default UseStaticFiles()
// provider serves nothing — this explicit provider makes /uploads/** reachable.
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads",
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.UseHangfireDashboard("/hangfire");

RecurringJob.AddOrUpdate<VaccineReminderJob>(
    "vaccine-reminders",
    job => job.SendRemindersAsync(),
    "0 6 * * *"
);

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
