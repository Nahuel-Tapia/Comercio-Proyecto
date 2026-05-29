using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using ECommerce.Application.UseCases.Products;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ISender _sender;

    // Un solo constructor, un solo parámetro
    public ProductsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _sender.Send(new GetAllProductsQuery(), ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new GetProductByIdQuery(id), ct));

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductCommand command, CancellationToken ct)
    {
        var productId = await _sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = productId }, new { id = productId });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _sender.Send(new DeleteProductCommand(id), ct);
        return NoContent();
    }
}
