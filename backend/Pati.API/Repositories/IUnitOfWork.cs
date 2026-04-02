using Pati.API.Entities;

namespace Pati.API.Repositories;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<User> Users { get; }
    IGenericRepository<Cat> Cats { get; }
    IGenericRepository<VaccineSchedule> VaccineSchedules { get; }
    IGenericRepository<WeightLog> WeightLogs { get; }
    IGenericRepository<Medication> Medications { get; }
    IGenericRepository<MedicationLog> MedicationLogs { get; }
    Task<int> SaveChangesAsync();
}
