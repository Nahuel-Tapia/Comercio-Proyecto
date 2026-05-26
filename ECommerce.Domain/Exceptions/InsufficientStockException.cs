namespace ECommerce.Domain.Exceptions;

public class InsufficientStockException : DomainException
{
    public InsufficientStockException(int requested, int available)
        : base($"Cannot reserve {requested} units — only {available} available") { }
}
