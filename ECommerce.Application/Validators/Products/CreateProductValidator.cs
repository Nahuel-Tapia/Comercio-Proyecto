using FluentValidation;
using ECommerce.Application.UseCases.Products.Commands;

namespace ECommerce.Application.Validators.Products;

public class CreateProductValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("El nombre del producto es obligatorio.")
            .MaximumLength(100)
            .WithMessage("El nombre no puede superar 100 caracteres.");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .WithMessage("La descripción no puede superar 500 caracteres.");

        RuleFor(x => x.Price)
            .GreaterThan(0m)
            .WithMessage("El precio debe ser mayor a cero.");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0)
            .WithMessage("El stock no puede ser negativo.");

        RuleFor(x => x.CategoryId)
            .NotEmpty()
            .WithMessage("La categoría es obligatoria.");
    }
}
