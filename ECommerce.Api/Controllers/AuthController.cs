using Microsoft.AspNetCore.Mvc;
using ECommerce.Application.UseCases.Auth;
using ECommerce.Api.DTOs;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly LoginUseCase _loginUseCase;

    public AuthController(LoginUseCase loginUseCase)
        => _loginUseCase = loginUseCase;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var token = await _loginUseCase.Execute(request.Email, request.Password);

        if (token is null)
            return Unauthorized(new { message = "Credenciales incorrectas." });

        return Ok(new { token });
    }
}

