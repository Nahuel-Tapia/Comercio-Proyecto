namespace ECommerce.Domain.Entities;

public class Category
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public ICollection<Product> Products { get; private set; } = new List<Product>();

    private Category() { }

    public Category(string name)
    {
        Id   = Guid.NewGuid();
        Name = name;
    }
}
