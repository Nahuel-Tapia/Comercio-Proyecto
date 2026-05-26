using ECommerce.Domain.Exceptions;

namespace ECommerce.Domain.Entities;

public class Product
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public int Stock { get; private set; }
    public Guid CategoryId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Constructor privado para EF Core
    private Product() { }

    // Constructor de negocio — valida las reglas del dominio
    public Product(string name, string description, decimal price, int stock, Guid categoryId)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("El nombre es obligatorio.");
        if (price < 0)
            throw new ArgumentException("El precio no puede ser negativo.");
        if (stock < 0)
            throw new ArgumentException("El stock no puede ser negativo.");

        Id          = Guid.NewGuid();
        Name        = name;
        Description = description;
        Price       = price;
        Stock       = stock;
        CategoryId  = categoryId;
        CreatedAt   = DateTime.UtcNow;
    }

    public void UpdatePrice(decimal newPrice)
    {
        if (newPrice <= 0)
            throw new DomainRuleException("El precio debe ser mayor a cero.");
        Price = newPrice;
    }

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
