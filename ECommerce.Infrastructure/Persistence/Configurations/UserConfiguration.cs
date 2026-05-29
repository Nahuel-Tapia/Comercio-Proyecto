using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ECommerce.Domain.Entities;
using ECommerce.Domain.ValueObjects;

namespace ECommerce.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).ValueGeneratedNever();
        builder.Property(u => u.Email)
               .HasConversion(
                   email => email.Value,
                   value => new Email(value))
               .IsRequired()
               .HasMaxLength(250);
        builder.Property(u => u.Name).IsRequired().HasMaxLength(200);
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.Role).IsRequired().HasMaxLength(20);
        builder.Property(u => u.CreatedAt).IsRequired();

        // Email único en la tabla
        builder.HasIndex(u => u.Email).IsUnique();

        // Seed de usuarios de prueba
        builder.HasData(
            new
            {
                Id = new Guid("b1c2d3e4-0000-0000-0000-000000000001"),
                Email = new Email("admin@ecommerce.com"),
                Name = "Admin User",
                PasswordHash = "$2a$11$SbkAOhrzuLyR4WHKTkiZoO3kOcgtPJ/zVwWpAc79yFVNzWfRJyLYW",
                Role = "Admin",
                CreatedAt = new DateTime(2026, 5, 29, 0, 0, 0, DateTimeKind.Utc)
            },
            new
            {
                Id = new Guid("b1c2d3e4-0000-0000-0000-000000000002"),
                Email = new Email("user@ecommerce.com"),
                Name = "Normal User",
                PasswordHash = "$2a$11$i0z5n20XCPwKclVG21/zQutZ/eMz9o8hfhA2hrFah5fim0moYJ3iK",
                Role = "User",
                CreatedAt = new DateTime(2026, 5, 29, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
