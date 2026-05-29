namespace ECommerce.Application.UseCases.Orders.Dtos;

public record OrderResponse(
    Guid Id,
    Guid UserId,
    decimal Total,
    DateTime CreatedAt,
    List<OrderItemResponseDto> Items
);
