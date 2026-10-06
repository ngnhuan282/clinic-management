using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClinicManagement.Data.Configurations;

public class PatientConfiguration : IEntityTypeConfiguration<Patient>
{
    public void Configure(EntityTypeBuilder<Patient> entity)
    {
        entity.HasKey(x => x.PatientId);
        entity.Property(x => x.FullName).HasMaxLength(100).IsRequired();
        entity.Property(x => x.Phone).HasMaxLength(15).IsRequired();
        entity.Property(x => x.IdentityNumber).HasMaxLength(20);
        entity.Property(x => x.InsuranceCode).HasMaxLength(30);
        entity.HasIndex(x => x.IdentityNumber).IsUnique().HasFilter("[IdentityNumber] IS NOT NULL");
        entity.HasIndex(x => x.Phone);
        entity.HasIndex(x => x.UserId).IsUnique().HasFilter("[UserId] IS NOT NULL");
        entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class PatientBookConfiguration : IEntityTypeConfiguration<PatientBook>
{
    public void Configure(EntityTypeBuilder<PatientBook> entity)
    {
        entity.HasKey(x => x.PatientBookId);
        entity.Property(x => x.BookNumber).HasMaxLength(40).IsRequired();
        entity.Property(x => x.Status).HasMaxLength(20).IsRequired();
        entity.HasIndex(x => x.BookNumber).IsUnique();
        entity.HasIndex(x => x.BookInvoiceId).IsUnique().HasFilter("[BookInvoiceId] IS NOT NULL");
        entity.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(x => x.BookInvoice).WithOne(x => x.PatientBook).HasForeignKey<PatientBook>(x => x.BookInvoiceId)
            .OnDelete(DeleteBehavior.Restrict);
        entity.ToTable(x => x.HasCheckConstraint("CK_PatientBooks_Status", "[Status] IN ('Pending','Issued','Lost','Replaced')"));
    }
}

public class BookInvoiceConfiguration : IEntityTypeConfiguration<BookInvoice>
{
    public void Configure(EntityTypeBuilder<BookInvoice> entity)
    {
        entity.HasKey(x => x.BookInvoiceId);
        entity.Property(x => x.Amount).HasPrecision(18, 2);
        entity.Property(x => x.Status).HasMaxLength(20).IsRequired();
        entity.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
        entity.ToTable(x =>
        {
            x.HasCheckConstraint("CK_BookInvoices_Amount", "[Amount] > 0");
            x.HasCheckConstraint("CK_BookInvoices_Status", "[Status] IN ('Unpaid','Paid')");
            x.HasCheckConstraint("CK_BookInvoices_PaymentTime",
                "([Status] = 'Unpaid' AND [PaidAt] IS NULL) OR ([Status] = 'Paid' AND [PaidAt] IS NOT NULL)");
        });
    }
}
