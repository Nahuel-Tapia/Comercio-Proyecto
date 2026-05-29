using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using ECommerce.Application.Validators.Orders;
using ECommerce.Application.UseCases.Orders;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Protegido por defecto
public class OrdersController : ControllerBase
{
    private readonly ISender _sender;

    public OrdersController(ISender sender) => _sender = sender;

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateOrderCommand command,
        CancellationToken ct)
    {
        // MediatR ejecuta la validación y luego el Handler
        var orderId = await _sender.Send(command, ct);

        return Created($"/api/orders/{orderId}", new { id = orderId });
    }
}
