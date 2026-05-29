using MediatR;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Exceptions;
using ECommerce.Application.Interfaces;

namespace ECommerce.Application.UseCases.Products;

public record GetProductByIdQuery(Guid Id) : IRequest<Product>;

public class GetProductByIdQueryHandler
    : IRequestHandler<GetProductByIdQuery, Product>
{
    private readonly IProductRepository _repo;

    public GetProductByIdQueryHandler(IProductRepository repo) => _repo = repo;

    public async Task<Product> Handle(
        GetProductByIdQuery request, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(request.Id, ct);

        // La lógica de "no encontrado" vive en Application, no en el controller
        if (product is null)
            throw new NotFoundException(nameof(Product), request.Id);

        return product;
    }
}
