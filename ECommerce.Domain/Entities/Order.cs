using ECommerce.Domain.ValueObjects;

namespace ECommerce.Domain.Entities;

public enum OrderStatus { Pending, Confirmed, Shipped, Delivered, Cancelled }

public class Order
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public OrderStatus Status { get; private set; }
    public Money Total { get; private set; } = null!;

    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    private Order() { }

    public Order(Guid userId)
    {
        Id        = Guid.NewGuid();
        UserId    = userId;
        CreatedAt = DateTime.UtcNow;
        Status    = OrderStatus.Pending;
        Total     = new Money(0);
    }

    public void AddItem(Product product, int quantity)
    {
        product.Reserve(quantity); // valida stock y lo descuenta
        var item = new OrderItem(Id, product.Id, product.Price, quantity);
        _items.Add(item);
        Total = Total.Add(item.Subtotal);
    }
}
