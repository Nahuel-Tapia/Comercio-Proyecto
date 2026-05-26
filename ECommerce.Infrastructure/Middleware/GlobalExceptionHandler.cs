using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using FluentValidation;
using ECommerce.Domain.Exceptions;

namespace ECommerce.Infrastructure.Middleware;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // 1. Siempre loguear con stacktrace completo antes de responder
        _logger.LogError(exception,
            "Unhandled exception: {Message}", exception.Message);

        // 2. Mapear tipo de excepción → HTTP status + título
        // IMPORTANTE: NotFoundException va ANTES de DomainException en el switch
        var (statusCode, title) = exception switch
        {
            NotFoundException ex    => (StatusCodes.Status404NotFound, ex.Message),
            ValidationException ex  => (StatusCodes.Status400BadRequest, "Validation failed"),
            DomainException ex      => (StatusCodes.Status422UnprocessableEntity, ex.Message),
            _                       => (StatusCodes.Status500InternalServerError,
                                        "An unexpected error occurred")
        };

        // 3. Escribir la respuesta en formato ProblemDetails (RFC 7807)
        httpContext.Response.StatusCode = statusCode;
        
        var problemDetails = new ProblemDetails
        {
            Status   = statusCode,
            Title    = title,
            Instance = httpContext.Request.Path
        };

        if (exception /* pattern matching C# 12 */ is ValidationException validationException)
        {
            problemDetails.Extensions["errors"] = validationException.Errors
                .Select(e => new { e.PropertyName, e.ErrorMessage });
        }

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        // 4. Retornar true indica que la excepción fue manejada
        return true;
    }
}
