using MediatR;
using ECommerce.Application.Interfaces;
using ECommerce.Application.Validators.Products;
using ECommerce.Domain.Entities;

namespace ECommerce.Application.UseCases.Products;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Guid>
{
    private readonly IProductRepository _repo;

    public CreateProductCommandHandler(IProductRepository repo)
        => _repo = repo;

    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var product = new Product(
            request.Name,
            request.Description ?? string.Empty,
            request.Price,
            request.Stock,
            request.CategoryId);

        await _repo.AddAsync(product, cancellationToken);
        return product.Id;
    }
}
