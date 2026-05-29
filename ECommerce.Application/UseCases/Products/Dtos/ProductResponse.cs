namespace ECommerce.Application.UseCases.Products.Dtos;

public record ProductResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    Guid CategoryId,
    DateTime CreatedAt
);
