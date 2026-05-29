using FluentAssertions;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Exceptions;

namespace ECommerce.Tests.Domain;

public class ProductTests
{
    private static readonly Guid CategoryId = Guid.NewGuid();

    // ── Reserve ──────────────────────────────────────────────────────────

    [Fact]
    public void Reserve_CantidadValida_DescuentaStock()
    {
        var product = new Product("Teclado", "", 5000m, 10, CategoryId);

        product.Reserve(3);

        product.Stock.Should().Be(7);
    }

    [Fact]
    public void Reserve_StockInsuficiente_LanzaInsufficientStockException()
    {
        var product = new Product("Teclado", "", 5000m, 2, CategoryId);

        var act = () => product.Reserve(5);

        act.Should().Throw<InsufficientStockException>()
           .WithMessage("*2 available*");
    }

    [Fact]
    public void Reserve_CantidadCero_LanzaDomainRuleException()
    {
        var product = new Product("Teclado", "", 5000m, 10, CategoryId);

        var act = () => product.Reserve(0);

        act.Should().Throw<DomainRuleException>();
    }

    [Fact]
    public void Reserve_CantidadNegativa_LanzaDomainRuleException()
    {
        var product = new Product("Teclado", "", 5000m, 10, CategoryId);

        var act = () => product.Reserve(-1);

        act.Should().Throw<DomainRuleException>();
    }

    // ── UpdatePrice ──────────────────────────────────────────────────────

    [Fact]
    public void UpdatePrice_PrecioValido_ActualizaElPrecio()
    {
        var product = new Product("Teclado", "", 5000m, 10, CategoryId);

        product.UpdatePrice(7500m);

        product.Price.Amount.Should().Be(7500m);
    }

    [Fact]
    public void UpdatePrice_PrecioNegativo_LanzaDomainRuleException()
    {
        var product = new Product("Teclado", "", 5000m, 10, CategoryId);

        var act = () => product.UpdatePrice(-1);

        act.Should().Throw<DomainRuleException>();
    }

    // ── Constructor ──────────────────────────────────────────────────────

    [Fact]
    public void Constructor_PrecioNegativo_LanzaDomainRuleException()
    {
        var act = () => new Product("Teclado", "", -1m, 10, CategoryId);

        act.Should().Throw<DomainRuleException>(); // Changed from ArgumentException to DomainRuleException to match VO
    }

    [Fact]
    public void Constructor_StockNegativo_LanzaArgumentException()
    {
        var act = () => new Product("Teclado", "", 5000m, -1, CategoryId);

        act.Should().Throw<ArgumentException>();
    }
}
