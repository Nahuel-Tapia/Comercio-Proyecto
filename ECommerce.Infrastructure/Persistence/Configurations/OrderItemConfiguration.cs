using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ECommerce.Domain.Entities;
using ECommerce.Domain.ValueObjects;

namespace ECommerce.Infrastructure.Persistence.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).ValueGeneratedNever();
        builder.Property(i => i.UnitPrice)
               .HasConversion(
                   money => money.Amount,
                   value => new Money(value, "ARS"))
               .HasColumnType("decimal(18,2)")
               .IsRequired();
        builder.Property(i => i.Quantity).IsRequired();
        builder.Property(i => i.ProductId).IsRequired();
        builder.Property(i => i.OrderId).IsRequired();

        // Subtotal es calculado en C# — NO se persiste en BD
        builder.Ignore(i => i.Subtotal);
    }
}
