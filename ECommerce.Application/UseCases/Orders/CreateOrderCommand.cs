using MediatR;

namespace ECommerce.Application.UseCases.Orders;

public record OrderItemDto(Guid ProductId, int Quantity);

public record CreateOrderCommand(
    Guid UserId,
    List<OrderItemDto> Items
) : IRequest<Guid>;
