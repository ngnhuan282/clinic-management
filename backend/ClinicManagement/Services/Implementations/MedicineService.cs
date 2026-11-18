using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class MedicineService : IMedicineService
{
    private readonly IMedicineRepository _medicineRepository;
    private readonly IMedicineCategoryRepository _categoryRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly ClinicSettingsService? _clinicSettings;

    public MedicineService(
        IMedicineRepository medicineRepository,
        IMedicineCategoryRepository categoryRepository,
        ISupplierRepository supplierRepository,
        ClinicSettingsService? clinicSettings = null)
    {
        _medicineRepository = medicineRepository;
        _categoryRepository = categoryRepository;
        _supplierRepository = supplierRepository;
        _clinicSettings = clinicSettings;
    }

    private async Task<(int LowStock, int NearExpiry)> GetThresholdsAsync()
    {
        if (_clinicSettings is null)
            return (MedicineMapping.LowStockThreshold, MedicineMapping.ExpiringSoonDays);
        var s = await _clinicSettings.GetSnapshotAsync();
        return (s.LowStockThreshold > 0 ? s.LowStockThreshold : MedicineMapping.LowStockThreshold,
            s.NearExpiryDays > 0 ? s.NearExpiryDays : MedicineMapping.ExpiringSoonDays);
    }

    public async Task<PagedResponse<MedicineResponse>> GetPagedAsync(
        MedicineFilterRequest request)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var (lowStock, nearExpiry) = await GetThresholdsAsync();

        var (items, totalItems) =
            await _medicineRepository.GetPagedAsync(request);

        var responses = items
            .Select(x => x.ToResponse(today, lowStock, nearExpiry))
            .ToList();

        return new PagedResponse<MedicineResponse>(
            responses,
            request.PageNumber,
            request.PageSize,
            totalItems
        );
    }

    public async Task<MedicineSummaryResponse> GetSummaryAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var (lowStock, nearExpiry) = await GetThresholdsAsync();
        var medicines =
            await _medicineRepository.GetAllWithInventoryAsync();

        var responses = medicines
            .Select(x => x.ToResponse(today, lowStock, nearExpiry))
            .ToList();

        return new MedicineSummaryResponse
        {
            TotalMedicines = responses.Count,
            InStockMedicines = responses.Count(x =>
                x.StockStatus == "InStock"),
            LowStockMedicines = responses.Count(x =>
                x.StockStatus == "LowStock"),
            OutOfStockMedicines = responses.Count(x =>
                x.StockStatus == "OutOfStock"),
            ExpiringSoonMedicines = responses.Count(x =>
                x.StockStatus == "ExpiringSoon"),
            ExpiredMedicines = responses.Count(x =>
                x.StockStatus == "Expired")
        };
    }

    public async Task<IReadOnlyList<MedicineOptionResponse>> GetOptionsAsync()
    {
        var medicines =
            await _medicineRepository.GetAllWithInventoryAsync();

        return medicines
            .Select(x => x.ToOptionResponse())
            .ToList();
    }

    public async Task<MedicineResponse> GetByIdAsync(
        int medicineId)
    {
        var medicine =
            await _medicineRepository.GetByIdAsync(
                medicineId
            );

        if (medicine == null)
        {
            throw new AppException(
                ErrorCode.MEDICINE_NOT_FOUND
            );
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var (lowStock, nearExpiry) = await GetThresholdsAsync();

        return medicine.ToResponse(today, lowStock, nearExpiry);
    }

    public async Task<MedicineResponse> CreateAsync(
        CreateMedicineRequest request)
    {
        await EnsureCategoryExistsAsync(request.CategoryId);
        await EnsureSupplierExistsAsync(request.SupplierId);
        await EnsureMedicineNameAvailableAsync(
            request.MedicineName
        );

        var medicine = new Medicine
        {
            MedicineName = request.MedicineName.Trim(),
            CategoryId = request.CategoryId,
            SupplierId = request.SupplierId,
            Unit = request.Unit.Trim(),
            UnitPrice = request.UnitPrice,
            Description = NormalizeOptionalText(
                request.Description
            )
        };

        await _medicineRepository.AddAsync(medicine);
        await _medicineRepository.SaveChangesAsync();

        return await GetByIdAsync(medicine.MedicineId);
    }

    public async Task<MedicineResponse> UpdateAsync(
        int medicineId,
        UpdateMedicineRequest request)
    {
        var medicine =
            await _medicineRepository.GetByIdAsync(
                medicineId
            );

        if (medicine == null)
        {
            throw new AppException(
                ErrorCode.MEDICINE_NOT_FOUND
            );
        }

        await EnsureCategoryExistsAsync(request.CategoryId);
        await EnsureSupplierExistsAsync(request.SupplierId);
        await EnsureMedicineNameAvailableAsync(
            request.MedicineName,
            medicineId
        );

        medicine.MedicineName = request.MedicineName.Trim();
        medicine.CategoryId = request.CategoryId;
        medicine.SupplierId = request.SupplierId;
        medicine.Unit = request.Unit.Trim();
        medicine.UnitPrice = request.UnitPrice;
        medicine.Description = NormalizeOptionalText(
            request.Description
        );

        await _medicineRepository.SaveChangesAsync();

        return await GetByIdAsync(medicineId);
    }

    public async Task DeleteAsync(int medicineId)
    {
        var medicine =
            await _medicineRepository.GetByIdAsync(
                medicineId
            );

        if (medicine == null)
        {
            throw new AppException(
                ErrorCode.MEDICINE_NOT_FOUND
            );
        }

        if (medicine.Inventories.Count > 0)
        {
            throw new AppException(
                ErrorCode.MEDICINE_HAS_INVENTORY
            );
        }

        if (await _medicineRepository.IsReferencedAsync(medicineId))
        {
            throw new AppException(
                ErrorCode.MEDICINE_IN_USE
            );
        }

        _medicineRepository.Remove(medicine);
        await _medicineRepository.SaveChangesAsync();
    }

    private async Task EnsureCategoryExistsAsync(int categoryId)
    {
        var exists =
            await _categoryRepository.ExistsAsync(categoryId);

        if (!exists)
        {
            throw new AppException(
                ErrorCode.MEDICINE_CATEGORY_NOT_FOUND
            );
        }
    }

    private async Task EnsureSupplierExistsAsync(int? supplierId)
    {
        if (!supplierId.HasValue)
        {
            return;
        }

        var exists =
            await _supplierRepository.ExistsAsync(
                supplierId.Value
            );

        if (!exists)
        {
            throw new AppException(
                ErrorCode.SUPPLIER_NOT_FOUND
            );
        }
    }

    private async Task EnsureMedicineNameAvailableAsync(
        string medicineName,
        int? excludedMedicineId = null)
    {
        var exists =
            await _medicineRepository.ExistsByNameAsync(
                medicineName,
                excludedMedicineId
            );

        if (exists)
        {
            throw new AppException(
                ErrorCode.MEDICINE_NAME_EXISTED
            );
        }
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}
