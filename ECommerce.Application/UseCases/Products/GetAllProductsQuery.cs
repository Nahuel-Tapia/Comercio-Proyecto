using MediatR;
using ECommerce.Domain.Entities;
using ECommerce.Application.Interfaces;

namespace ECommerce.Application.UseCases.Products;

public record GetAllProductsQuery() : IRequest<IEnumerable<Product>>;

public class GetAllProductsQueryHandler
    : IRequestHandler<GetAllProductsQuery, IEnumerable<Product>>
{
    private readonly IProductRepository _repo;

    public GetAllProductsQueryHandler(IProductRepository repo) => _repo = repo;

    public async Task<IEnumerable<Product>> Handle(
        GetAllProductsQuery request, CancellationToken ct)
        => await _repo.GetAllAsync(ct);
}
