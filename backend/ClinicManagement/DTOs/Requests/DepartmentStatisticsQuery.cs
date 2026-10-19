using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace ClinicManagement.DTOs.Requests;

public sealed class DepartmentStatisticsQuery
{
    [DisplayFormat(ConvertEmptyStringToNull = false)]
    [FromQuery(Name = "fromDate")]
    public string? FromDate { get; set; }

    [DisplayFormat(ConvertEmptyStringToNull = false)]
    [FromQuery(Name = "toDate")]
    public string? ToDate { get; set; }
}
