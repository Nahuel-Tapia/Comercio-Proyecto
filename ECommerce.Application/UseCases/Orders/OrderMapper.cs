using ECommerce.Application.UseCases.Orders.Commands;
using ECommerce.Application.UseCases.Orders.Dtos;
using ECommerce.Domain.Entities;

namespace ECommerce.Application.UseCases.Orders;

public static class OrderMapper
{
    public static CreateOrderCommand ToCommand(CreateOrderRequest request)
    {
        return new CreateOrderCommand(request.UserId, request.Items);
    }

    public static OrderResponse ToResponse(Order order)
    {
        var items = order.Items.Select(item => new OrderItemResponseDto(
            item.ProductId,
            item.UnitPrice.Amount,
            item.Quantity,
            item.Subtotal.Amount
        )).ToList();

        return new OrderResponse(
            order.Id,
            order.UserId,
            order.Total.Amount,
            order.CreatedAt,
            items
        );
    }
}
