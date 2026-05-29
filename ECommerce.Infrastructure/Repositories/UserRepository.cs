using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Interfaces;
using ECommerce.Domain.Entities;
using ECommerce.Infrastructure.Persistence;

namespace ECommerce.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _ctx;

    public UserRepository(ApplicationDbContext ctx) => _ctx = ctx;

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _ctx.Users.FindAsync(new object[] { id }, ct);

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        try
        {
            var emailVo = new ECommerce.Domain.ValueObjects.Email(email);
            return await _ctx.Users
                   .AsNoTracking()
                   .FirstOrDefaultAsync(u => u.Email == emailVo, ct);
        }
        catch (ECommerce.Domain.Exceptions.DomainRuleException)
        {
            return null;
        }
    }

    public async Task AddAsync(User user, CancellationToken ct = default)
    {
        await _ctx.Users.AddAsync(user, ct);
        await _ctx.SaveChangesAsync(ct);
    }
}
