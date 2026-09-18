namespace ClinicManagement.DTOs.Responses;

public class InventorySummaryResponse
{
    public int TotalBatches { get; set; }

    public int TotalQuantity { get; set; }

    public int InStockBatches { get; set; }

    public int LowStockBatches { get; set; }

    public int OutOfStockBatches { get; set; }

    public int ExpiringSoonBatches { get; set; }

    public int ExpiredBatches { get; set; }
}
