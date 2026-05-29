using ECommerce.Domain.Exceptions;
using ECommerce.Domain.ValueObjects;

namespace ECommerce.Domain.Entities;

public class Product
{
    public Guid Id { get; private set; }
    public ProductName Name { get; private set; } = null!;
    public string Description { get; private set; } = string.Empty;
    public Money Price { get; private set; } = null!;
    public int Stock { get; private set; }
    public Guid CategoryId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Constructor privado para EF Core
    private Product() { }

    // Constructor de negocio — valida las reglas del dominio
    public Product(string name, string description, decimal price, int stock, Guid categoryId)
    {
        Id          = Guid.NewGuid();
        Name        = new ProductName(name);
        Description = description;
        Price       = new Money(price);
        Stock       = stock >= 0 ? stock : throw new ArgumentException("El stock no puede ser negativo.");
        CategoryId  = categoryId;
        CreatedAt   = DateTime.UtcNow;
    }

    public void UpdatePrice(decimal newPrice)
        => Price = new Money(newPrice);

    // Lanza InsufficientStockException si no hay stock suficiente
    public void Reserve(int quantity)
    {
        if (quantity <= 0)
            throw new DomainRuleException("La cantidad debe ser positiva.");
        if (quantity > Stock)
            throw new InsufficientStockException(quantity, Stock);
        Stock -= quantity;
    }
}
