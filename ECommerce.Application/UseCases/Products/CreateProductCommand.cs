using MediatR;

namespace ECommerce.Application.UseCases.Products;

public record CreateProductCommand(
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    Guid CategoryId
) : IRequest<Guid>;
