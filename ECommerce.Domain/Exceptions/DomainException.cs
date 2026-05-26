namespace ECommerce.Domain.Exceptions;

// Clase base abstracta — todas las domain exceptions heredan de aquí
public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message) { }
}
