using ClinicManagement.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClinicManagement.Data.Configurations;

public class PrescriptionStockReviewDecisionConfiguration : IEntityTypeConfiguration<PrescriptionStockReviewDecision>
{
    public void Configure(EntityTypeBuilder<PrescriptionStockReviewDecision> builder)
    {
        builder.HasKey(x => x.PrescriptionStockReviewDecisionId);
        builder.Property(x => x.Action).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Outcome).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(2000).IsRequired();
        builder.HasOne(x => x.Review).WithMany(x => x.Decisions)
            .HasForeignKey(x => x.PrescriptionStockReviewId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.DoctorUser).WithMany().HasForeignKey(x => x.DoctorUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
