namespace ECommerce.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; private set; }
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public decimal Subtotal => UnitPrice * Quantity; // calculado, no persistido

    private OrderItem() { }

    public OrderItem(Guid orderId, Guid productId, decimal unitPrice, int quantity)
    {
        Id        = Guid.NewGuid();
        OrderId   = orderId;
        ProductId = productId;
        UnitPrice = unitPrice;
        Quantity  = quantity;
    }
}
