using ECommerce.Domain.ValueObjects;

namespace ECommerce.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; private set; }
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public Money UnitPrice { get; private set; } = null!;
    public int Quantity { get; private set; }
    public Money Subtotal => UnitPrice.Multiply(Quantity); // calculado, no persistido

    private OrderItem() { }

    public OrderItem(Guid orderId, Guid productId, Money unitPrice, int quantity)
    {
        Id        = Guid.NewGuid();
        OrderId   = orderId;
        ProductId = productId;
        UnitPrice = unitPrice;
        Quantity  = quantity;
    }
}
