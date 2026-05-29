namespace ECommerce.Application.UseCases.Orders;

public record OrderItemDto(Guid ProductId, int Quantity);
