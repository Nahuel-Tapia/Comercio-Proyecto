using ECommerce.Domain.Entities;

namespace ECommerce.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
}
