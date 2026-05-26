namespace ECommerce.Domain.Entities;

public class User
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty; // nunca en DTOs
    public string Role { get; private set; } = "User"; // "User" | "Admin"
    public DateTime CreatedAt { get; private set; }

    private User() { }

    public User(string email, string name, string passwordHash)
    {
        Id           = Guid.NewGuid();
        Email        = email;
        Name         = name;
        PasswordHash = passwordHash;
        CreatedAt    = DateTime.UtcNow;
    }
}
