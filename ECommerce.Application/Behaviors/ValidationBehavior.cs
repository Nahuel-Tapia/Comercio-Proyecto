using FluentValidation;
using MediatR;

namespace ECommerce.Application.Behaviors;

public class ValidationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        => _validators = validators;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // Si no hay validators registrados para este tipo → continuar
        if (!_validators.Any())
            return await next();

        // Ejecutar todos los validators y acumular errores
        var context  = new ValidationContext<TRequest>(request);
        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(result => result.Errors)
            .Where(failure => failure != null)
            .ToList();

        // Si hay errores → lanzar excepción (la captura el GlobalExceptionHandler)
        if (failures.Any())
            throw new ValidationException(failures);

        // Sin errores → pasar al Use Case handler
        // CRÍTICO: nunca olvidar este return, o todos los endpoints devuelven null
        return await next();
    }
}
