using ClinicManagement.Data.Entities;
using ClinicManagement.DTOs.Requests;
using ClinicManagement.DTOs.Responses;
using ClinicManagement.Exceptions;
using ClinicManagement.Mappings;
using ClinicManagement.Repositories.Interfaces;
using ClinicManagement.Services.Interfaces;

namespace ClinicManagement.Services.Implementations;

public class MedicineCategoryService : IMedicineCategoryService
{
    private readonly IMedicineCategoryRepository _categoryRepository;

    public MedicineCategoryService(
        IMedicineCategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<PagedResponse<MedicineCategoryResponse>>
        GetPagedAsync(MedicineCategoryFilterRequest request)
    {
        var (items, totalItems) =
            await _categoryRepository.GetPagedAsync(request);

        var responses = items
            .Select(x => x.ToResponse())
            .ToList();

        return new PagedResponse<MedicineCategoryResponse>(
            responses,
            request.PageNumber,
            request.PageSize,
            totalItems
        );
    }

    public async Task<MedicineCategorySummaryResponse>
        GetSummaryAsync()
    {
        var categories =
            await _categoryRepository.GetAllWithMedicinesAsync();

        return new MedicineCategorySummaryResponse
        {
            TotalCategories = categories.Count,
            CategoriesInUse = categories.Count(x =>
                x.Medicines.Count > 0),
            EmptyCategories = categories.Count(x =>
                x.Medicines.Count == 0),
            TotalMedicines = categories.Sum(x =>
                x.Medicines.Count)
        };
    }

    public async Task<MedicineCategoryResponse> GetByIdAsync(
        int categoryId)
    {
        var category =
            await _categoryRepository.GetByIdAsync(categoryId);

        if (category == null)
        {
            throw new AppException(
                ErrorCode.MEDICINE_CATEGORY_NOT_FOUND
            );
        }

        return category.ToResponse();
    }

    public async Task<IReadOnlyList<MedicineCategoryOptionResponse>>
        GetOptionsAsync()
    {
        var categories =
            await _categoryRepository.GetOptionsAsync();

        return categories
            .Select(x => new MedicineCategoryOptionResponse
            {
                CategoryId = x.CategoryId,
                CategoryName = x.CategoryName
            })
            .ToList();
    }

    public async Task<MedicineCategoryResponse> CreateAsync(
        CreateMedicineCategoryRequest request)
    {
        await EnsureCategoryNameAvailableAsync(
            request.CategoryName
        );

        var category = new MedicineCategory
        {
            CategoryName = request.CategoryName.Trim()
        };

        await _categoryRepository.AddAsync(category);
        await _categoryRepository.SaveChangesAsync();

        return await GetByIdAsync(category.CategoryId);
    }

    public async Task<MedicineCategoryResponse> UpdateAsync(
        int categoryId,
        UpdateMedicineCategoryRequest request)
    {
        var category =
            await _categoryRepository.GetByIdAsync(categoryId);

        if (category == null)
        {
            throw new AppException(
                ErrorCode.MEDICINE_CATEGORY_NOT_FOUND
            );
        }

        await EnsureCategoryNameAvailableAsync(
            request.CategoryName,
            categoryId
        );

        category.CategoryName = request.CategoryName.Trim();

        await _categoryRepository.SaveChangesAsync();

        return await GetByIdAsync(categoryId);
    }

    public async Task DeleteAsync(int categoryId)
    {
        var category =
            await _categoryRepository.GetByIdAsync(categoryId);

        if (category == null)
        {
            throw new AppException(
                ErrorCode.MEDICINE_CATEGORY_NOT_FOUND
            );
        }

        if (category.Medicines.Count > 0)
        {
            throw new AppException(
                ErrorCode.MEDICINE_CATEGORY_HAS_MEDICINES
            );
        }

        _categoryRepository.Remove(category);
        await _categoryRepository.SaveChangesAsync();
    }

    private async Task EnsureCategoryNameAvailableAsync(
        string categoryName,
        int? excludedCategoryId = null)
    {
        var exists =
            await _categoryRepository.ExistsByNameAsync(
                categoryName,
                excludedCategoryId
            );

        if (exists)
        {
            throw new AppException(
                ErrorCode.MEDICINE_CATEGORY_NAME_EXISTED
            );
        }
    }
}
