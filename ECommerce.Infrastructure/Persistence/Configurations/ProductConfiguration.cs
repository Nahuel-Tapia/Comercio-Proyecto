using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ECommerce.Domain.Entities;
using ECommerce.Domain.ValueObjects;

namespace ECommerce.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever(); // Guid generado en Domain

        builder.Property(p => p.Name)
               .HasConversion(
                   name => name.Value,
                   value => new ProductName(value))
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(p => p.Description)
               .HasMaxLength(2000);

        builder.Property(p => p.Price)
               .HasConversion(
                   money => money.Amount,
                   value => new Money(value, "ARS"))
               .IsRequired()
               .HasColumnType("decimal(18,2)");

        builder.Property(p => p.Stock)
               .IsRequired()
               .HasDefaultValue(0);

        builder.Property(p => p.CategoryId).IsRequired();
        builder.Property(p => p.CreatedAt).IsRequired();

        // Índice para búsquedas rápidas por nombre
        builder.HasIndex(p => p.Name);
    }
}
