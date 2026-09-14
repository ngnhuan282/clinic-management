namespace ClinicManagement.DTOs.Responses;

public class PagedResponse<T>
{
    public IEnumerable<T> Items { get; set; } = [];

    public int PageNumber { get; set; }

    public int PageSize { get; set; }

    public int TotalItems { get; set; }

    public int TotalPages { get; set; }

    public bool HasPreviousPage =>
        PageNumber > 1;

    public bool HasNextPage =>
        PageNumber < TotalPages;

    public PagedResponse(
        IEnumerable<T> items,
        int pageNumber,
        int pageSize,
        int totalItems)
    {
        Items = items;
        PageNumber = pageNumber;
        PageSize = pageSize;
        TotalItems = totalItems;

        TotalPages = (int)Math.Ceiling(
            totalItems / (double)pageSize
        );
    }
}