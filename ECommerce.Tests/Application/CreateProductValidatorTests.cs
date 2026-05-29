using FluentAssertions;
using FluentValidation.TestHelper;
using ECommerce.Application.Validators.Products;
using ECommerce.Application.UseCases.Products;

namespace ECommerce.Tests.Application;

public class CreateProductValidatorTests
{
    private readonly CreateProductValidator _validator = new();

    [Fact]
    public void Nombre_Vacio_DebeFallar()
    {
        var command = new CreateProductCommand("", null, 100m, 0, Guid.NewGuid());

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Nombre_MasDe100Caracteres_DebeFallar()
    {
        var nombre  = new string('a', 101);
        var command = new CreateProductCommand(nombre, null, 100m, 0, Guid.NewGuid());

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Theory]
    [InlineData(0)]      // Price = 0 debe fallar (GreaterThan, no GreaterThanOrEqual)
    [InlineData(-1)]
    [InlineData(-100)]
    public void Precio_CeroONegativo_DebeFallar(decimal precio)
    {
        var command = new CreateProductCommand("Teclado", null, precio, 0, Guid.NewGuid());

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Price);
    }

    [Fact]
    public void Stock_Negativo_DebeFallar()
    {
        var command = new CreateProductCommand("Teclado", null, 100m, -1, Guid.NewGuid());

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Stock);
    }

    [Fact]
    public void CategoryId_Vacio_DebeFallar()
    {
        var command = new CreateProductCommand("Teclado", null, 100m, 0, Guid.Empty);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.CategoryId);
    }

    [Fact]
    public void CommandValido_NoDebeTenerErrores()
    {
        var command = new CreateProductCommand("Teclado", "Mecánico", 5000m, 10, Guid.NewGuid());

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }
}
