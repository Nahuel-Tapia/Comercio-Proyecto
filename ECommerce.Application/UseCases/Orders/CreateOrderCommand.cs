using MediatR;

namespace ECommerce.Application.UseCases.Orders;

public record CreateOrderCommand(
    Guid UserId,
    List<OrderItemDto> Items
) : IRequest<Guid>;

