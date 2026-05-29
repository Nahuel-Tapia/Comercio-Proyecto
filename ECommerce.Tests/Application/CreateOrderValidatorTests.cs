using FluentAssertions;
using FluentValidation.TestHelper;
using ECommerce.Application.Validators.Orders;
using ECommerce.Application.UseCases.Orders;

namespace ECommerce.Tests.Application;

public class CreateOrderValidatorTests
{
    private readonly CreateOrderValidator _validator = new();

    [Fact]
    public void Items_ListaVacia_DebeFallar()
    {
        var command = new CreateOrderCommand(Guid.NewGuid(), new List<OrderItemDto>());

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Items);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(101)]  // InclusiveBetween(1, 100) — 101 debe fallar
    public void Item_CantidadFueraDeRango_DebeFallar(int cantidad)
    {
        var command = new CreateOrderCommand(
            Guid.NewGuid(),
            new List<OrderItemDto> { new(Guid.NewGuid(), cantidad) });

        var result = _validator.TestValidate(command);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Item_ProductIdVacio_DebeFallar()
    {
        var command = new CreateOrderCommand(
            Guid.NewGuid(),
            new List<OrderItemDto> { new(Guid.Empty, 1) });

        var result = _validator.TestValidate(command);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CommandValido_NoDebeTenerErrores()
    {
        var command = new CreateOrderCommand(
            Guid.NewGuid(),
            new List<OrderItemDto> { new(Guid.NewGuid(), 2) });

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }
}
