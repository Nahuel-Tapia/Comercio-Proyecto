namespace ECommerce.Domain.Exceptions;

// Para reglas de negocio genéricas
public class DomainRuleException : DomainException
{
    public DomainRuleException(string message) : base(message) { }
}
