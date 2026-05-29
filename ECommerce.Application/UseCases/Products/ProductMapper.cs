using ECommerce.Application.UseCases.Products.Commands;
using ECommerce.Application.UseCases.Products.Dtos;
using ECommerce.Domain.Entities;

namespace ECommerce.Application.UseCases.Products;

public static class ProductMapper
{
    public static CreateProductCommand ToCommand(CreateProductRequest request)
    {
        return new CreateProductCommand(
            request.Name,
            request.Description,
            request.Price,
            request.Stock,
            request.CategoryId
        );
    }

    public static ProductResponse ToResponse(Product product)
    {
        return new ProductResponse(
            product.Id,
            product.Name.Value,
            product.Description,
            product.Price.Amount,
            product.Stock,
            product.CategoryId,
            product.CreatedAt
        );
    }
}
