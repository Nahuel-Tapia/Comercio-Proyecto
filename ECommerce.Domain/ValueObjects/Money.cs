using ECommerce.Domain.Exceptions;

namespace ECommerce.Domain.ValueObjects;

public record Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency = "ARS")
    {
        if (amount < 0)
            throw new DomainRuleException("El monto no puede ser negativo.");
        if (string.IsNullOrWhiteSpace(currency))
            throw new DomainRuleException("La moneda es obligatoria.");

        Amount   = amount;
        Currency = currency.ToUpperInvariant();
    }

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new DomainRuleException($"No se pueden sumar monedas distintas: {Currency} y {other.Currency}.");
        return new Money(Amount + other.Amount, Currency);
    }

    public Money Multiply(int quantity) => new(Amount * quantity, Currency);

    public override string ToString() => $"{Amount:F2} {Currency}";
}
