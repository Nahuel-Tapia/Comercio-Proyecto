namespace ECommerce.Application.UseCases.Orders.Dtos;

public record CreateOrderRequest(
    Guid UserId,
    List<OrderItemDto> Items
);
