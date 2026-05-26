using FluentValidation;

namespace ECommerce.Application.Validators.Orders;

public record OrderItemDto(Guid ProductId, int Quantity);
public record CreateOrderCommand(Guid UserId, List<OrderItemDto> Items);

public class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("El ID de usuario es obligatorio.");

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("La orden debe tener al menos un producto.");

        // Validar cada elemento de la lista con índice: Items[0].Quantity, etc.
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId)
                .NotEmpty()
                .WithMessage("El ID de producto es obligatorio.");

            item.RuleFor(i => i.Quantity)
                .InclusiveBetween(1, 100)
                .WithMessage("La cantidad debe estar entre 1 y 100.");
        });
    }
}
