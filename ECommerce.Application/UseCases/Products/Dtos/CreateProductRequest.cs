namespace ECommerce.Application.UseCases.Products.Dtos;

public record CreateProductRequest(
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    Guid CategoryId
);
