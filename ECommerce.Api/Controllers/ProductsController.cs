using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using ECommerce.Application.UseCases.Products;
using ECommerce.Application.UseCases.Products.Commands;
using ECommerce.Application.UseCases.Products.Queries;
using ECommerce.Application.UseCases.Products.Dtos;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ISender _sender;

    public ProductsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var products = await _sender.Send(new GetAllProductsQuery(), ct);
        var response = products.Select(ProductMapper.ToResponse);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var product = await _sender.Send(new GetProductByIdQuery(id), ct);
        return Ok(ProductMapper.ToResponse(product));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductRequest request, CancellationToken ct)
    {
        var command = ProductMapper.ToCommand(request);
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
