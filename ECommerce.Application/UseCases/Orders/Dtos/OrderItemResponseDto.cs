namespace ECommerce.Application.UseCases.Orders.Dtos;

public record OrderItemResponseDto(
    Guid ProductId,
    decimal UnitPrice,
    int Quantity,
    decimal Subtotal
);
