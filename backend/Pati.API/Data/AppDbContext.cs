using Microsoft.EntityFrameworkCore;
using Pati.API.Entities;

namespace Pati.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Cat> Cats => Set<Cat>();
    public DbSet<VaccineSchedule> VaccineSchedules => Set<VaccineSchedule>();
    public DbSet<WeightLog> WeightLogs => Set<WeightLog>();
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<MedicationLog> MedicationLogs => Set<MedicationLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").IsRequired();
            e.Property(x => x.ExpoPushToken).HasColumnName("expo_push_token");
            e.Property(x => x.RefreshToken).HasColumnName("refresh_token");
            e.Property(x => x.RefreshTokenExpiry).HasColumnName("refresh_token_expiry");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<Cat>(e =>
        {
            e.ToTable("cats");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            e.Property(x => x.Breed).HasColumnName("breed").HasMaxLength(100);
            e.Property(x => x.BirthDate).HasColumnName("birth_date");
            e.Property(x => x.Gender).HasColumnName("gender").HasMaxLength(10);
            e.Property(x => x.Color).HasColumnName("color").HasMaxLength(50);
            e.Property(x => x.PhotoUrl).HasColumnName("photo_url");
            e.Property(x => x.IsNeutered).HasColumnName("is_neutered");
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            e.HasOne(x => x.User).WithMany(u => u.Cats).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasQueryFilter(x => x.DeletedAt == null);
        });

        modelBuilder.Entity<VaccineSchedule>(e =>
        {
            e.ToTable("vaccine_schedules");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.CatId).HasColumnName("cat_id");
            e.Property(x => x.VaccineType).HasColumnName("vaccine_type").HasMaxLength(100).IsRequired();
            e.Property(x => x.LastGivenDate).HasColumnName("last_given_date");
            e.Property(x => x.NextDueDate).HasColumnName("next_due_date").IsRequired();
            e.Property(x => x.VetName).HasColumnName("vet_name").HasMaxLength(100);
            e.Property(x => x.ClinicName).HasColumnName("clinic_name").HasMaxLength(100);
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.IsCompleted).HasColumnName("is_completed");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.HasOne(x => x.Cat).WithMany(c => c.VaccineSchedules).HasForeignKey(x => x.CatId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WeightLog>(e =>
        {
            e.ToTable("weight_logs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.CatId).HasColumnName("cat_id");
            e.Property(x => x.WeightKg).HasColumnName("weight_kg").HasColumnType("decimal(4,2)").IsRequired();
            e.Property(x => x.LoggedAt).HasColumnName("logged_at").IsRequired();
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.HasOne(x => x.Cat).WithMany(c => c.WeightLogs).HasForeignKey(x => x.CatId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Medication>(e =>
        {
            e.ToTable("medications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.CatId).HasColumnName("cat_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            e.Property(x => x.Dosage).HasColumnName("dosage").HasMaxLength(100);
            e.Property(x => x.FrequencyType).HasColumnName("frequency_type").HasMaxLength(20).IsRequired();
            e.Property(x => x.FrequencyTimes).HasColumnName("frequency_times");
            e.Property(x => x.ReminderTimes).HasColumnName("reminder_times").HasColumnType("text[]");
            e.Property(x => x.StartDate).HasColumnName("start_date").IsRequired();
            e.Property(x => x.EndDate).HasColumnName("end_date");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            e.HasOne(x => x.Cat).WithMany(c => c.Medications).HasForeignKey(x => x.CatId).OnDelete(DeleteBehavior.Cascade);
            e.HasQueryFilter(x => x.DeletedAt == null);
        });

        modelBuilder.Entity<MedicationLog>(e =>
        {
            e.ToTable("medication_logs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.MedicationId).HasColumnName("medication_id");
            e.Property(x => x.ScheduledTime).HasColumnName("scheduled_time").IsRequired();
            e.Property(x => x.GivenAt).HasColumnName("given_at");
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(10);
            e.Property(x => x.Notes).HasColumnName("notes");
            e.HasOne(x => x.Medication).WithMany(m => m.MedicationLogs).HasForeignKey(x => x.MedicationId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
