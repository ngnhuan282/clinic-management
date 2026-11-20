namespace ClinicManagement.DTOs.Responses.Medicines;

public class MedicineSummaryResponse
{
    public int TotalMedicines { get; set; }

    public int InStockMedicines { get; set; }

    public int LowStockMedicines { get; set; }

    public int OutOfStockMedicines { get; set; }

    public int ExpiringSoonMedicines { get; set; }

    public int ExpiredMedicines { get; set; }
}
