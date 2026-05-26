using ECommerce.Application.Interfaces;

namespace ECommerce.Application.UseCases.Auth;

public class LoginUseCase
{
    private readonly IUserRepository _userRepo;
    private readonly ITokenService   _tokenService;

    public LoginUseCase(IUserRepository userRepo, ITokenService tokenService)
    {
        _userRepo     = userRepo;
        _tokenService = tokenService;
    }

    public async Task<string?> Execute(string email, string password)
    {
        var user = await _userRepo.GetByEmailAsync(email);
        if (user is null)
            return null;

        // Verificar contraseña: comparar texto plano con el hash guardado
        // NUNCA se guarda la contraseña en texto plano
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;

        return _tokenService.GenerateToken(user);
    }
}
