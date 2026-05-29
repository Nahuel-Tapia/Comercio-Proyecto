using ECommerce.Domain.Exceptions;

namespace ECommerce.Domain.ValueObjects;

public record ProductName
{
    public string Value { get; }

    public ProductName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainRuleException("El nombre del producto es obligatorio.");
        if (value.Length > 200)
            throw new DomainRuleException("El nombre no puede superar 200 caracteres.");

        Value = value.Trim();
    }

    public override string ToString() => Value;
}
