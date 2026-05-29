using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Interfaces;
using ECommerce.Domain.Entities;
using ECommerce.Infrastructure.Persistence;

namespace ECommerce.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _ctx;

    public ProductRepository(ApplicationDbContext ctx) => _ctx = ctx;

    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _ctx.Products.FindAsync(new object[] { id }, ct);

    // AsNoTracking() en lecturas — reduce consumo de memoria hasta 40%
    public async Task<IEnumerable<Product>> GetAllAsync(CancellationToken ct = default)
        => await _ctx.Products.AsNoTracking().ToListAsync(ct);

    public async Task<IEnumerable<Product>> SearchByNameAsync(
        string term, CancellationToken ct = default)
        => await _ctx.Products
               .AsNoTracking()
               .Where(p => p.Name.Value.Contains(term))
               .ToListAsync(ct);

    public async Task<bool> ExistsAsync(Guid id, CancellationToken ct = default)
        => await _ctx.Products.AnyAsync(p => p.Id == id, ct);

    public async Task AddAsync(Product product, CancellationToken ct = default)
    {
        await _ctx.Products.AddAsync(product, ct);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Product product, CancellationToken ct = default)
    {
        _ctx.Products.Update(product);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _ctx.Products.FindAsync(new object[] { id }, ct);
        if (product is not null)
        {
            _ctx.Products.Remove(product);
            await _ctx.SaveChangesAsync(ct);
        }
    }
}
