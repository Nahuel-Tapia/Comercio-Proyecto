using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ECommerce.Domain.Entities;

namespace ECommerce.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    // GUIDs FIJOS — NUNCA usar Guid.NewGuid() en HasData()
    private static readonly Guid ElectronicaId = new("a1b2c3d4-0000-0000-0000-000000000001");
    private static readonly Guid RopaId        = new("a1b2c3d4-0000-0000-0000-000000000002");
    private static readonly Guid HogarId       = new("a1b2c3d4-0000-0000-0000-000000000003");

    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.Name).IsRequired().HasMaxLength(100);

        // Relación 1:N con Products
        builder.HasMany(c => c.Products)
               .WithOne()
               .HasForeignKey(p => p.CategoryId)
               .OnDelete(DeleteBehavior.Restrict);

        // Seed con GUIDs hardcodeados — obligatorio
        builder.HasData(
            new { Id = ElectronicaId, Name = "Electrónica" },
            new { Id = RopaId,        Name = "Ropa" },
            new { Id = HogarId,       Name = "Hogar" }
        );
    }
}
