using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using ECommerce.Application.Interfaces;
using ECommerce.Application.UseCases.Products;
using ECommerce.Application.Validators.Products;
using ECommerce.Domain.Exceptions;
using ECommerce.Domain.Entities;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductRepository _repo;
    private readonly ISender _sender;

    public ProductsController(IProductRepository repo, ISender sender)
    {
        _repo   = repo;
        _sender = sender;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _repo.GetAllAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(id, ct);
        if (product is null)
            throw new NotFoundException(nameof(Product), id);

        return Ok(product);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductCommand command,
        CancellationToken ct)
    {
        // MediatR ejecutará ValidationBehavior automáticamente
        var productId = await _sender.Send(command, ct);

        // Devolver un 201 Created apontando al endpoint GetById
        return CreatedAtAction(nameof(GetById), new { id = productId }, new { id = productId });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (!await _repo.ExistsAsync(id, ct))
            throw new NotFoundException(nameof(Product), id);

        await _repo.DeleteAsync(id, ct);
        return NoContent();
    }
}
