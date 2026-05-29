using ECommerce.Domain.Exceptions;

namespace ECommerce.Domain.ValueObjects;

public record Email
{
    public string Value { get; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainRuleException("El email es obligatorio.");
        if (!value.Contains('@') || !value.Contains('.'))
            throw new DomainRuleException($"El email '{value}' no tiene un formato válido.");

        Value = value.Trim().ToLowerInvariant();
    }

    public override string ToString() => Value;
}
