using Pati.API.Data;
using Pati.API.Entities;

namespace Pati.API.Repositories;

public class UnitOfWork(AppDbContext context) : IUnitOfWork
{
    private IGenericRepository<User>? _users;
    private IGenericRepository<Cat>? _cats;
    private IGenericRepository<VaccineSchedule>? _vaccineSchedules;
    private IGenericRepository<WeightLog>? _weightLogs;
    private IGenericRepository<Medication>? _medications;
    private IGenericRepository<MedicationLog>? _medicationLogs;
    private IGenericRepository<VetExpense>? _vetExpenses;
    private IGenericRepository<VetPayment>? _vetPayments;

    public IGenericRepository<User> Users => _users ??= new GenericRepository<User>(context);
    public IGenericRepository<Cat> Cats => _cats ??= new GenericRepository<Cat>(context);
    public IGenericRepository<VaccineSchedule> VaccineSchedules => _vaccineSchedules ??= new GenericRepository<VaccineSchedule>(context);
    public IGenericRepository<WeightLog> WeightLogs => _weightLogs ??= new GenericRepository<WeightLog>(context);
    public IGenericRepository<Medication> Medications => _medications ??= new GenericRepository<Medication>(context);
    public IGenericRepository<MedicationLog> MedicationLogs => _medicationLogs ??= new GenericRepository<MedicationLog>(context);
    public IGenericRepository<VetExpense> VetExpenses => _vetExpenses ??= new GenericRepository<VetExpense>(context);
    public IGenericRepository<VetPayment> VetPayments => _vetPayments ??= new GenericRepository<VetPayment>(context);

    public async Task<int> SaveChangesAsync() => await context.SaveChangesAsync();

    // AppDbContext scoped olarak DI tarafından yönetiliyor ve aynı scope'ta
    // CatService/VaccineService gibi sınıflarla paylaşılıyor. Burada Dispose
    // edilirse aynı istek içinde hâlâ kullanılan context kapanabilir; temizliği
    // DI kapsayıcısına bırakıyoruz.
    public void Dispose() => GC.SuppressFinalize(this);
}
