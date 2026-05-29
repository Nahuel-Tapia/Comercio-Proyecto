using MediatR;
using ECommerce.Application.Interfaces;
using ECommerce.Application.Validators.Orders;
using ECommerce.Application.UseCases.Orders.Dtos;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Exceptions;

namespace ECommerce.Application.UseCases.Orders.Commands;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IOrderRepository   _orderRepo;
    private readonly IProductRepository _productRepo;
    private readonly IUserRepository    _userRepo;

    public CreateOrderCommandHandler(
        IOrderRepository orderRepo,
        IProductRepository productRepo,
        IUserRepository userRepo)
    {
        _orderRepo   = orderRepo;
        _productRepo = productRepo;
        _userRepo    = userRepo;
    }

    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        // 1. Validar que el usuario exista
        var user = await _userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null)
            throw new NotFoundException(nameof(User), request.UserId);

        // 2. Crear la orden
        var order = new Order(request.UserId);

        // 3. Procesar y agregar cada item
        foreach (var item in request.Items)
        {
            var product = await _productRepo.GetByIdAsync(item.ProductId, cancellationToken);
            if (product is null)
                throw new NotFoundException(nameof(Product), item.ProductId);

            // Reserve se llama dentro de AddItem, descontando el stock
            order.AddItem(product, item.Quantity);

            // Guardar stock actualizado del producto
            await _productRepo.UpdateAsync(product, cancellationToken);
        }

        // 4. Guardar la orden (y sus items por cascada)
        await _orderRepo.AddAsync(order, cancellationToken);

        return order.Id;
    }
}
