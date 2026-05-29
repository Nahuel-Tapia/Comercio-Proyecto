using FluentAssertions;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Exceptions;

namespace ECommerce.Tests.Domain;

public class OrderTests
{
    private static readonly Guid UserId     = Guid.NewGuid();
    private static readonly Guid CategoryId = Guid.NewGuid();

    [Fact]
    public void AddItem_ProductoConStock_AgregaItemYCalculaTotal()
    {
        var order   = new Order(UserId);
        var product = new Product("Mouse", "", 2000m, 5, CategoryId);

        order.AddItem(product, 2);

        order.Items.Should().HaveCount(1);
        order.Total.Amount.Should().Be(4000m);
        product.Stock.Should().Be(3); // stock descontado en el dominio
    }

    [Fact]
    public void AddItem_StockInsuficiente_LanzaInsufficientStockException()
    {
        var order   = new Order(UserId);
        var product = new Product("Mouse", "", 2000m, 1, CategoryId);

        var act = () => order.AddItem(product, 5);

        act.Should().Throw<InsufficientStockException>();
        order.Items.Should().BeEmpty();   // la orden no debe tener items
        order.Total.Amount.Should().Be(0);       // el total no debe haberse modificado
    }

    [Fact]
    public void AddItem_MultiplesProductos_SumaCorrectamenteElTotal()
    {
        var order    = new Order(UserId);
        var product1 = new Product("Mouse",   "", 2000m, 5, CategoryId);
        var product2 = new Product("Teclado", "", 5000m, 5, CategoryId);

        order.AddItem(product1, 2);
        order.AddItem(product2, 1);

        order.Total.Amount.Should().Be(9000m);  // 2*2000 + 1*5000
    }
}
