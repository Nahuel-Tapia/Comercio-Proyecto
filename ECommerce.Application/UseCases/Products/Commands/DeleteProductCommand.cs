using MediatR;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Exceptions;
using ECommerce.Application.Interfaces;

namespace ECommerce.Application.UseCases.Products.Commands;

public record DeleteProductCommand(Guid Id) : IRequest;

public class DeleteProductCommandHandler
    : IRequestHandler<DeleteProductCommand>
{
    private readonly IProductRepository _repo;

    public DeleteProductCommandHandler(IProductRepository repo) => _repo = repo;

    public async Task Handle(DeleteProductCommand request, CancellationToken ct)
    {
        if (!await _repo.ExistsAsync(request.Id, ct))
            throw new NotFoundException(nameof(Product), request.Id);

        await _repo.DeleteAsync(request.Id, ct);
    }
}
