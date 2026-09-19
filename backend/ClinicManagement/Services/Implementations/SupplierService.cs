using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class SupplierService : ISupplierService
{
    private readonly ISupplierRepository _supplierRepository;

    public SupplierService(ISupplierRepository supplierRepository)
    {
        _supplierRepository = supplierRepository;
    }

    public async Task<PagedResponse<SupplierResponse>> GetPagedAsync(
        SupplierFilterRequest request)
    {
        var (items, totalItems) =
            await _supplierRepository.GetPagedAsync(request);

        var responses = items
            .Select(x => x.ToResponse())
            .ToList();

        return new PagedResponse<SupplierResponse>(
            responses,
            request.PageNumber,
            request.PageSize,
            totalItems
        );
    }

    public async Task<SupplierSummaryResponse> GetSummaryAsync()
    {
        var suppliers =
            await _supplierRepository.GetAllWithMedicinesAsync();

        return new SupplierSummaryResponse
        {
            TotalSuppliers = suppliers.Count,
            SuppliersInUse = suppliers.Count(x =>
                x.Medicines.Count > 0),
            EmptySuppliers = suppliers.Count(x =>
                x.Medicines.Count == 0),
            TotalLinkedMedicines = suppliers.Sum(x =>
                x.Medicines.Count)
        };
    }

    public async Task<SupplierResponse> GetByIdAsync(
        int supplierId)
    {
        var supplier =
            await _supplierRepository.GetByIdAsync(supplierId);

        if (supplier == null)
        {
            throw new AppException(
                ErrorCode.SUPPLIER_NOT_FOUND
            );
        }

        return supplier.ToResponse();
    }

    public async Task<IReadOnlyList<SupplierOptionResponse>>
        GetOptionsAsync()
    {
        var suppliers =
            await _supplierRepository.GetOptionsAsync();

        return suppliers
            .Select(x => new SupplierOptionResponse
            {
                SupplierId = x.SupplierId,
                SupplierName = x.SupplierName,
                ContactInfo = x.ContactInfo
            })
            .ToList();
    }

    public async Task<SupplierResponse> CreateAsync(
        CreateSupplierRequest request)
    {
        await EnsureSupplierNameAvailableAsync(
            request.SupplierName
        );

        var supplier = new Supplier
        {
            SupplierName = request.SupplierName.Trim(),
            ContactInfo = NormalizeOptionalText(
                request.ContactInfo
            ),
            Address = NormalizeOptionalText(request.Address)
        };

        await _supplierRepository.AddAsync(supplier);
        await _supplierRepository.SaveChangesAsync();

        return await GetByIdAsync(supplier.SupplierId);
    }

    public async Task<SupplierResponse> UpdateAsync(
        int supplierId,
        UpdateSupplierRequest request)
    {
        var supplier =
            await _supplierRepository.GetByIdAsync(supplierId);

        if (supplier == null)
        {
            throw new AppException(
                ErrorCode.SUPPLIER_NOT_FOUND
            );
        }

        await EnsureSupplierNameAvailableAsync(
            request.SupplierName,
            supplierId
        );

        supplier.SupplierName = request.SupplierName.Trim();
        supplier.ContactInfo = NormalizeOptionalText(
            request.ContactInfo
        );
        supplier.Address = NormalizeOptionalText(request.Address);

        await _supplierRepository.SaveChangesAsync();

        return await GetByIdAsync(supplierId);
    }

    public async Task DeleteAsync(int supplierId)
    {
        var supplier =
            await _supplierRepository.GetByIdAsync(supplierId);

        if (supplier == null)
        {
            throw new AppException(
                ErrorCode.SUPPLIER_NOT_FOUND
            );
        }

        if (supplier.Medicines.Count > 0)
        {
            throw new AppException(
                ErrorCode.SUPPLIER_HAS_MEDICINES
            );
        }

        _supplierRepository.Remove(supplier);
        await _supplierRepository.SaveChangesAsync();
    }

    private async Task EnsureSupplierNameAvailableAsync(
        string supplierName,
        int? excludedSupplierId = null)
    {
        var exists =
            await _supplierRepository.ExistsByNameAsync(
                supplierName,
                excludedSupplierId
            );

        if (exists)
        {
            throw new AppException(
                ErrorCode.SUPPLIER_NAME_EXISTED
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
