# Instructivo Completo — Backend E-Commerce API
## Tecnicatura Universitaria en Desarrollo de Software · Backend 2026 · Prof. Nicolás Ortiz

---

## Introducción y Arquitectura

Este instructivo cubre el desarrollo completo del backend del e-commerce aplicando **Clean Architecture**. Cada decisión de código respeta las reglas de dependencia entre capas:

```
Domain ← Application ← Infrastructure ← Presentation (API)
```

**Regla fundamental:** Application NUNCA depende de Infrastructure. Si esta regla se viola, se pierde la capacidad de intercambiar implementaciones sin tocar la lógica de negocio.

---

## Parte 1 — Estructura del Proyecto

### 1.1 Crear la solución

```bash
dotnet new sln -n ECommerce
dotnet new classlib -n ECommerce.Domain
dotnet new classlib -n ECommerce.Application
dotnet new classlib -n ECommerce.Infrastructure
dotnet new webapi -n ECommerce.Api

dotnet sln add ECommerce.Domain
dotnet sln add ECommerce.Application
dotnet sln add ECommerce.Infrastructure
dotnet sln add ECommerce.Api

# Referencias entre proyectos
dotnet add ECommerce.Application reference ECommerce.Domain
dotnet add ECommerce.Infrastructure reference ECommerce.Application
dotnet add ECommerce.Api reference ECommerce.Infrastructure
dotnet add ECommerce.Api reference ECommerce.Application
```

### 1.2 Estructura de carpetas obligatoria

```
ECommerce.sln
├── ECommerce.Domain/
│   ├── Entities/
│   │   ├── Product.cs
│   │   ├── Category.cs
│   │   ├── Order.cs
│   │   ├── OrderItem.cs
│   │   └── User.cs
│   └── Exceptions/
│       ├── DomainException.cs
│       ├── NotFoundException.cs
│       ├── InsufficientStockException.cs
│       └── DomainRuleException.cs
│
├── ECommerce.Application/
│   ├── Interfaces/
│   │   ├── IProductRepository.cs
│   │   ├── IOrderRepository.cs
│   │   ├── IUserRepository.cs
│   │   └── ITokenService.cs
│   ├── UseCases/
│   │   ├── Products/
│   │   ├── Orders/
│   │   └── Auth/
│   │       └── LoginUseCase.cs
│   ├── Behaviors/
│   │   └── ValidationBehavior.cs
│   └── Validators/
│       ├── Products/
│       │   └── CreateProductValidator.cs
│       └── Orders/
│           └── CreateOrderValidator.cs
│
├── ECommerce.Infrastructure/
│   ├── Persistence/
│   │   ├── ApplicationDbContext.cs
│   │   ├── Configurations/
│   │   │   ├── ProductConfiguration.cs
│   │   │   ├── CategoryConfiguration.cs
│   │   │   ├── OrderConfiguration.cs
│   │   │   ├── OrderItemConfiguration.cs
│   │   │   └── UserConfiguration.cs
│   │   └── Migrations/          ← generadas automáticamente
│   ├── Repositories/
│   │   ├── ProductRepository.cs
│   │   ├── OrderRepository.cs
│   │   └── UserRepository.cs
│   ├── Services/
│   │   └── JwtTokenService.cs
│   ├── Middleware/
│   │   └── GlobalExceptionHandler.cs
│   └── InfrastructureServiceExtensions.cs
│
└── ECommerce.Api/
    ├── Controllers/
    │   ├── AuthController.cs
    │   ├── ProductsController.cs
    │   └── OrdersController.cs
    ├── appsettings.json
    └── Program.cs
```

---

## Parte 2 — Capa Domain: Entidades y Excepciones

### 2.1 Instalar paquetes en Infrastructure

```bash
cd ECommerce.Infrastructure

dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package BCrypt.Net-Next
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
```

```bash
cd ECommerce.Application

dotnet add package FluentValidation.AspNetCore
dotnet add package MediatR
```

### 2.2 Entidad Product

```csharp
// ECommerce.Domain/Entities/Product.cs
namespace ECommerce.Domain.Entities;

public class Product
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public int Stock { get; private set; }
    public Guid CategoryId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Constructor privado para EF Core
    private Product() { }

    // Constructor de negocio — valida las reglas del dominio
    public Product(string name, string description, decimal price, int stock, Guid categoryId)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("El nombre es obligatorio.");
        if (price < 0)
            throw new ArgumentException("El precio no puede ser negativo.");
        if (stock < 0)
            throw new ArgumentException("El stock no puede ser negativo.");

        Id          = Guid.NewGuid();
        Name        = name;
        Description = description;
        Price       = price;
        Stock       = stock;
        CategoryId  = categoryId;
        CreatedAt   = DateTime.UtcNow;
    }

    public void UpdatePrice(decimal newPrice)
    {
        if (newPrice <= 0)
            throw new DomainRuleException("El precio debe ser mayor a cero.");
        Price = newPrice;
    }

    // Lanza InsufficientStockException si no hay stock suficiente
    public void Reserve(int quantity)
    {
        if (quantity <= 0)
            throw new DomainRuleException("La cantidad debe ser positiva.");
        if (quantity > Stock)
            throw new InsufficientStockException(quantity, Stock);
        Stock -= quantity;
    }
}
```

### 2.3 Entidad Category

```csharp
// ECommerce.Domain/Entities/Category.cs
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
```

### 2.4 Entidades Order y OrderItem

```csharp
// ECommerce.Domain/Entities/Order.cs
namespace ECommerce.Domain.Entities;

public enum OrderStatus { Pending, Confirmed, Shipped, Delivered, Cancelled }

public class Order
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public OrderStatus Status { get; private set; }
    public decimal Total { get; private set; }

    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    private Order() { }

    public Order(Guid userId)
    {
        Id        = Guid.NewGuid();
        UserId    = userId;
        CreatedAt = DateTime.UtcNow;
        Status    = OrderStatus.Pending;
        Total     = 0;
    }

    public void AddItem(Product product, int quantity)
    {
        product.Reserve(quantity); // valida stock y lo descuenta
        var item = new OrderItem(Id, product.Id, product.Price, quantity);
        _items.Add(item);
        Total += item.Subtotal;
    }
}
```

```csharp
// ECommerce.Domain/Entities/OrderItem.cs
namespace ECommerce.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; private set; }
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public decimal Subtotal => UnitPrice * Quantity; // calculado, no persistido

    private OrderItem() { }

    public OrderItem(Guid orderId, Guid productId, decimal unitPrice, int quantity)
    {
        Id        = Guid.NewGuid();
        OrderId   = orderId;
        ProductId = productId;
        UnitPrice = unitPrice;
        Quantity  = quantity;
    }
}
```

### 2.5 Entidad User

```csharp
// ECommerce.Domain/Entities/User.cs
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
```

### 2.6 Jerarquía de Domain Exceptions

> **Principio:** El Domain no sabe nada de HTTP. Sus excepciones solo hablan de negocio. El `GlobalExceptionHandler` las traduce a códigos HTTP.

```csharp
// ECommerce.Domain/Exceptions/DomainException.cs
namespace ECommerce.Domain.Exceptions;

// Clase base abstracta — todas las domain exceptions heredan de aquí
public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message) { }
}
```

```csharp
// ECommerce.Domain/Exceptions/NotFoundException.cs
namespace ECommerce.Domain.Exceptions;

public class NotFoundException : DomainException
{
    public NotFoundException(string entityName, object id)
        : base($"{entityName} with id {id} was not found") { }
}
```

```csharp
// ECommerce.Domain/Exceptions/InsufficientStockException.cs
namespace ECommerce.Domain.Exceptions;

public class InsufficientStockException : DomainException
{
    public InsufficientStockException(int requested, int available)
        : base($"Cannot reserve {requested} units — only {available} available") { }
}
```

```csharp
// ECommerce.Domain/Exceptions/DomainRuleException.cs
namespace ECommerce.Domain.Exceptions;

// Para reglas de negocio genéricas
public class DomainRuleException : DomainException
{
    public DomainRuleException(string message) : base(message) { }
}
```

---

## Parte 3 — Capa Infrastructure: EF Core y Persistencia

### 3.1 Configuraciones Fluent API

> **Por qué Fluent API:** Mantiene las entidades de Domain libres de dependencias de EF Core. Toda la configuración de mapeo vive en Infrastructure.

```csharp
// ECommerce.Infrastructure/Persistence/Configurations/ProductConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ECommerce.Domain.Entities;

namespace ECommerce.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever(); // Guid generado en Domain

        builder.Property(p => p.Name)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(p => p.Description)
               .HasMaxLength(2000);

        builder.Property(p => p.Price)
               .IsRequired()
               .HasColumnType("decimal(18,2)");

        builder.Property(p => p.Stock)
               .IsRequired()
               .HasDefaultValue(0);

        builder.Property(p => p.CategoryId).IsRequired();
        builder.Property(p => p.CreatedAt).IsRequired();

        // Índice para búsquedas rápidas por nombre
        builder.HasIndex(p => p.Name);
    }
}
```

```csharp
// ECommerce.Infrastructure/Persistence/Configurations/CategoryConfiguration.cs
public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    // GUIDs FIJOS — NUNCA usar Guid.NewGuid() en HasData()
    private static readonly Guid ElectronicaId = new("a1b2c3d4-0000-0000-0000-000000000001");
    private static readonly Guid RopaId        = new("a1b2c3d4-0000-0000-0000-000000000002");
    private static readonly Guid HogarId       = new("a1b2c3d4-0000-0000-0000-000000000003");

    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.Name).IsRequired().HasMaxLength(100);

        // Relación 1:N con Products
        builder.HasMany(c => c.Products)
               .WithOne()
               .HasForeignKey(p => p.CategoryId)
               .OnDelete(DeleteBehavior.Restrict);

        // Seed con GUIDs hardcodeados — obligatorio
        builder.HasData(
            new { Id = ElectronicaId, Name = "Electrónica" },
            new { Id = RopaId,        Name = "Ropa" },
            new { Id = HogarId,       Name = "Hogar" }
        );
    }
}
```

```csharp
// ECommerce.Infrastructure/Persistence/Configurations/OrderConfiguration.cs
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).ValueGeneratedNever();
        builder.Property(o => o.UserId).IsRequired();
        builder.Property(o => o.CreatedAt).IsRequired();
        builder.Property(o => o.Total)
               .IsRequired()
               .HasColumnType("decimal(18,2)");

        // Guardar el enum como string legible, no como número
        builder.Property(o => o.Status)
               .HasConversion<string>()
               .HasMaxLength(20);

        // Relación 1:N con OrderItems — cascade delete
        builder.HasMany(o => o.Items)
               .WithOne()
               .HasForeignKey(i => i.OrderId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
```

```csharp
// ECommerce.Infrastructure/Persistence/Configurations/OrderItemConfiguration.cs
public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).ValueGeneratedNever();
        builder.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(i => i.Quantity).IsRequired();
        builder.Property(i => i.ProductId).IsRequired();
        builder.Property(i => i.OrderId).IsRequired();

        // Subtotal es calculado en C# — NO se persiste en BD
        builder.Ignore(i => i.Subtotal);
    }
}
```

```csharp
// ECommerce.Infrastructure/Persistence/Configurations/UserConfiguration.cs
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).ValueGeneratedNever();
        builder.Property(u => u.Email).IsRequired().HasMaxLength(250);
        builder.Property(u => u.Name).IsRequired().HasMaxLength(200);
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.Role).IsRequired().HasMaxLength(20);
        builder.Property(u => u.CreatedAt).IsRequired();

        // Email único en la tabla
        builder.HasIndex(u => u.Email).IsUnique();
    }
}
```

### 3.2 ApplicationDbContext

```csharp
// ECommerce.Infrastructure/Persistence/ApplicationDbContext.cs
using Microsoft.EntityFrameworkCore;
using ECommerce.Domain.Entities;

namespace ECommerce.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<Product>   Products   { get; set; } = null!;
    public DbSet<Category>  Categories { get; set; } = null!;
    public DbSet<Order>     Orders     { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;
    public DbSet<User>      Users      { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Aplica automáticamente todas las IEntityTypeConfiguration<T> del assembly
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}
```

### 3.3 Repositorios

#### Interfaz en Application (contrato)

```csharp
// ECommerce.Application/Interfaces/IProductRepository.cs
namespace ECommerce.Application.Interfaces;

public interface IProductRepository
{
    Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<Product>> GetAllAsync(CancellationToken ct = default);
    Task<IEnumerable<Product>> SearchByNameAsync(string term, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Product product, CancellationToken ct = default);
    Task UpdateAsync(Product product, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
```

```csharp
// ECommerce.Application/Interfaces/IOrderRepository.cs
public interface IOrderRepository
{
    Task<Order?> GetByIdWithItemsAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<Order>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task AddAsync(Order order, CancellationToken ct = default);
}
```

```csharp
// ECommerce.Application/Interfaces/IUserRepository.cs
public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task AddAsync(User user, CancellationToken ct = default);
}
```

#### Implementaciones en Infrastructure

```csharp
// ECommerce.Infrastructure/Repositories/ProductRepository.cs
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Interfaces;
using ECommerce.Domain.Entities;
using ECommerce.Infrastructure.Persistence;

namespace ECommerce.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _ctx;

    public ProductRepository(ApplicationDbContext ctx) => _ctx = ctx;

    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _ctx.Products.FindAsync(new object[] { id }, ct);

    // AsNoTracking() en lecturas — reduce consumo de memoria hasta 40%
    public async Task<IEnumerable<Product>> GetAllAsync(CancellationToken ct = default)
        => await _ctx.Products.AsNoTracking().ToListAsync(ct);

    public async Task<IEnumerable<Product>> SearchByNameAsync(
        string term, CancellationToken ct = default)
        => await _ctx.Products
               .AsNoTracking()
               .Where(p => p.Name.Contains(term))
               .ToListAsync(ct);

    public async Task<bool> ExistsAsync(Guid id, CancellationToken ct = default)
        => await _ctx.Products.AnyAsync(p => p.Id == id, ct);

    public async Task AddAsync(Product product, CancellationToken ct = default)
    {
        await _ctx.Products.AddAsync(product, ct);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Product product, CancellationToken ct = default)
    {
        _ctx.Products.Update(product);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _ctx.Products.FindAsync(new object[] { id }, ct);
        if (product is not null)
        {
            _ctx.Products.Remove(product);
            await _ctx.SaveChangesAsync(ct);
        }
    }
}
```

```csharp
// ECommerce.Infrastructure/Repositories/OrderRepository.cs
public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _ctx;

    public OrderRepository(ApplicationDbContext ctx) => _ctx = ctx;

    // Eager loading: traer la orden con sus items (JOIN explícito)
    public async Task<Order?> GetByIdWithItemsAsync(Guid id, CancellationToken ct = default)
        => await _ctx.Orders
               .Include(o => o.Items)
               .FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<IEnumerable<Order>> GetByUserIdAsync(
        Guid userId, CancellationToken ct = default)
        => await _ctx.Orders
               .AsNoTracking()
               .Where(o => o.UserId == userId)
               .OrderByDescending(o => o.CreatedAt)
               .ToListAsync(ct);

    public async Task AddAsync(Order order, CancellationToken ct = default)
    {
        await _ctx.Orders.AddAsync(order, ct);
        await _ctx.SaveChangesAsync(ct);
    }
}
```

```csharp
// ECommerce.Infrastructure/Repositories/UserRepository.cs
public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _ctx;

    public UserRepository(ApplicationDbContext ctx) => _ctx = ctx;

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _ctx.Users.FindAsync(new object[] { id }, ct);

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
        => await _ctx.Users
               .AsNoTracking()
               .FirstOrDefaultAsync(u => u.Email == email, ct);

    public async Task AddAsync(User user, CancellationToken ct = default)
    {
        await _ctx.Users.AddAsync(user, ct);
        await _ctx.SaveChangesAsync(ct);
    }
}
```

---

## Parte 4 — Capa Application: Validaciones y Manejo de Errores

### 4.1 GlobalExceptionHandler

> **Posición en el pipeline:** DEBE ser el primer middleware para envolver toda la cadena y capturar cualquier excepción.

```csharp
// ECommerce.Infrastructure/Middleware/GlobalExceptionHandler.cs
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
        await httpContext.Response.WriteAsJsonAsync(
            new ProblemDetails
            {
                Status   = statusCode,
                Title    = title,
                Instance = httpContext.Request.Path
            },
            cancellationToken);

        // 4. Retornar true indica que la excepción fue manejada
        return true;
    }
}
```

### 4.2 Validators con FluentValidation

```csharp
// ECommerce.Application/Validators/Products/CreateProductValidator.cs
using FluentValidation;

namespace ECommerce.Application.Validators.Products;

// Representa el command/DTO de creación de producto
public record CreateProductCommand(
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    Guid CategoryId
);

public class CreateProductValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("El nombre del producto es obligatorio.")
            .MaximumLength(100)
            .WithMessage("El nombre no puede superar 100 caracteres.");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .WithMessage("La descripción no puede superar 500 caracteres.");

        RuleFor(x => x.Price)
            .GreaterThan(0m)
            .WithMessage("El precio debe ser mayor a cero.");  // Price = 0 falla

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0)
            .WithMessage("El stock no puede ser negativo.");

        RuleFor(x => x.CategoryId)
            .NotEmpty()
            .WithMessage("La categoría es obligatoria.");
    }
}
```

```csharp
// ECommerce.Application/Validators/Orders/CreateOrderValidator.cs
public record OrderItemDto(Guid ProductId, int Quantity);
public record CreateOrderCommand(Guid UserId, List<OrderItemDto> Items);

public class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("El ID de usuario es obligatorio.");

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("La orden debe tener al menos un producto.");

        // Validar cada elemento de la lista con índice: Items[0].Quantity, etc.
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId)
                .NotEmpty()
                .WithMessage("El ID de producto es obligatorio.");

            item.RuleFor(i => i.Quantity)
                .InclusiveBetween(1, 100)
                .WithMessage("La cantidad debe estar entre 1 y 100.");
        });
    }
}
```

### 4.3 ValidationBehavior para MediatR

```csharp
// ECommerce.Application/Behaviors/ValidationBehavior.cs
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
```

---

## Parte 5 — Seguridad con JWT

### 5.1 Interfaz del servicio de token (Application)

```csharp
// ECommerce.Application/Interfaces/ITokenService.cs
using ECommerce.Domain.Entities;

namespace ECommerce.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
}
```

### 5.2 Implementación JwtTokenService (Infrastructure)

```csharp
// ECommerce.Infrastructure/Services/JwtTokenService.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ECommerce.Application.Interfaces;
using ECommerce.Domain.Entities;

namespace ECommerce.Infrastructure.Services;

public class JwtTokenService : ITokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config) => _config = config;

    public string GenerateToken(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role)
            // NUNCA agregar: password, tarjeta de crédito ni datos sensibles
        };

        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer:             _config["Jwt:Issuer"],
            audience:           _config["Jwt:Audience"],
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(
                                    int.Parse(_config["Jwt:ExpirationHours"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

### 5.3 LoginUseCase

```csharp
// ECommerce.Application/UseCases/Auth/LoginUseCase.cs
using ECommerce.Application.Interfaces;

namespace ECommerce.Application.UseCases.Auth;

public class LoginUseCase
{
    private readonly IUserRepository _userRepo;
    private readonly ITokenService   _tokenService;

    public LoginUseCase(IUserRepository userRepo, ITokenService tokenService)
    {
        _userRepo     = userRepo;
        _tokenService = tokenService;
    }

    public async Task<string?> Execute(string email, string password)
    {
        var user = await _userRepo.GetByEmailAsync(email);
        if (user is null)
            return null;

        // Verificar contraseña: comparar texto plano con el hash guardado
        // NUNCA se guarda la contraseña en texto plano
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;

        return _tokenService.GenerateToken(user);
    }
}
```

---

## Parte 6 — Registro de Servicios (Dependency Injection)

### 6.1 InfrastructureServiceExtensions

```csharp
// ECommerce.Infrastructure/InfrastructureServiceExtensions.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ECommerce.Application.Interfaces;
using ECommerce.Application.UseCases.Auth;
using ECommerce.Infrastructure.Middleware;
using ECommerce.Infrastructure.Persistence;
using ECommerce.Infrastructure.Repositories;
using ECommerce.Infrastructure.Services;

namespace ECommerce.Infrastructure;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // DbContext — Scoped: una instancia por request HTTP
        // NUNCA Singleton: EF Core no es thread-safe
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(
                configuration.GetConnectionString("DefaultConnection")));
        // En producción: options.UseSqlServer(...)

        // Repositorios — Scoped
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        // Servicio JWT — Scoped
        services.AddScoped<ITokenService, JwtTokenService>();

        // Use Cases
        services.AddScoped<LoginUseCase>();

        // GlobalExceptionHandler
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddProblemDetails();

        return services;
    }
}
```

### 6.2 appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=ecommerce.db"
  },
  "Jwt": {
    "Key": "mi-clave-super-secreta-de-al-menos-32-caracteres-aqui",
    "Issuer": "ecommerce-api",
    "Audience": "ecommerce-cliente",
    "ExpirationHours": 1
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

> **⚠️ CRÍTICO:** La `Jwt:Key` **NUNCA** debe quedar en el repositorio de Git. En producción usar variables de entorno o Azure Key Vault.

### 6.3 Program.cs completo

```csharp
// ECommerce.Api/Program.cs
using System.Text;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using ECommerce.Application.Behaviors;
using ECommerce.Application.Validators.Products;
using ECommerce.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
var config  = builder.Configuration;

// Controladores
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Infrastructure (DbContext + Repositorios + JWT + ExceptionHandler)
builder.Services.AddInfrastructure(config);

// FluentValidation — registrar todos los validators del assembly de Application
builder.Services.AddValidatorsFromAssemblyContaining<CreateProductValidator>();

// MediatR + ValidationBehavior
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblyContaining<CreateProductValidator>();
    // El behavior se ejecuta ANTES de cada handler automáticamente
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
});

// Autenticación JWT
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidIssuer              = config["Jwt:Issuer"],
            ValidateAudience         = true,
            ValidAudience            = config["Jwt:Audience"],
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = new SymmetricSecurityKey(
                                           Encoding.UTF8.GetBytes(config["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// ════════════════════════════════════════════════════
// ORDEN DEL PIPELINE — CRÍTICO, no cambiar el orden
// ════════════════════════════════════════════════════
app.UseExceptionHandler();    // 1° PRIMERO: captura toda excepción no manejada
app.UseHttpsRedirection();    // 2°
app.UseAuthentication();      // 3° ¿Quién sos?
app.UseAuthorization();       // 4° ¿Qué podés hacer?
// UseAuthentication SIEMPRE antes que UseAuthorization

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.Run();
```

---

## Parte 7 — Controladores

### 7.1 AuthController

```csharp
// ECommerce.Api/Controllers/AuthController.cs
using Microsoft.AspNetCore.Mvc;
using ECommerce.Application.UseCases.Auth;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly LoginUseCase _loginUseCase;

    public AuthController(LoginUseCase loginUseCase)
        => _loginUseCase = loginUseCase;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var token = await _loginUseCase.Execute(request.Email, request.Password);

        if (token is null)
            return Unauthorized(new { message = "Credenciales incorrectas." });

        return Ok(new { token });
    }
}

public record LoginRequest(string Email, string Password);
```

### 7.2 ProductsController

```csharp
// ECommerce.Api/Controllers/ProductsController.cs
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerce.Application.Interfaces;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Exceptions;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductRepository _repo;

    public ProductsController(IProductRepository repo) => _repo = repo;

    // Público — no requiere token
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _repo.GetAllAsync(ct));

    // Público — no requiere token
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var product = await _repo.GetByIdAsync(id, ct);

        // El repositorio devuelve null; el controller lanza la excepción tipada
        // El GlobalExceptionHandler la convierte en 404 ProblemDetails
        if (product is null)
            throw new NotFoundException(nameof(Product), id);

        return Ok(product);
    }

    // Solo usuarios autenticados — requiere token válido
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductRequest request,
        CancellationToken ct)
    {
        // La validación ya fue ejecutada por ValidationBehavior antes de llegar aquí
        var product = new Product(
            request.Name,
            request.Description ?? string.Empty,
            request.Price,
            request.Stock,
            request.CategoryId);

        await _repo.AddAsync(product, ct);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    // Solo Admins — requiere token con rol Admin
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (!await _repo.ExistsAsync(id, ct))
            throw new NotFoundException(nameof(Product), id);

        await _repo.DeleteAsync(id, ct);
        return NoContent();
    }
}

public record CreateProductRequest(
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    Guid CategoryId
);
```

### 7.3 Leer datos del usuario autenticado

```csharp
// Dentro de cualquier endpoint protegido con [Authorize]:

// Obtener el ID del usuario desde el token (sin ir a la BD)
var userId   = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
var userName = User.Identity?.Name;
var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
bool isAdmin = User.IsInRole("Admin");
```

---

## Parte 8 — Migraciones: Flujo Completo

### 8.1 Instalar la herramienta (una sola vez)

```bash
dotnet tool install --global dotnet-ef
dotnet ef --version  # verificar instalación
```

### 8.2 Flujo de trabajo: desde cero

```bash
# Paso 1 — Restaurar paquetes NuGet
dotnet restore

# Paso 2 — Crear la migración inicial
dotnet ef migrations add InitialCreate \
  --project ECommerce.Infrastructure \
  --startup-project ECommerce.Api

# Paso 3 — Revisar el SQL generado ANTES de aplicar
dotnet ef migrations script \
  --project ECommerce.Infrastructure \
  --startup-project ECommerce.Api

# Paso 4 — Aplicar (crea el archivo ecommerce.db automáticamente con SQLite)
dotnet ef database update \
  --project ECommerce.Infrastructure \
  --startup-project ECommerce.Api

# Paso 5 — Arrancar el proyecto
dotnet run --project ECommerce.Api
```

### 8.3 Flujo para agregar cambios al modelo

```bash
# Ejemplo: agregar campo IsActive a Product
# 1. Modificar la entidad en Domain
# 2. Actualizar la configuración Fluent API en Infrastructure
# 3. Crear migración con nombre DESCRIPTIVO
dotnet ef migrations add AddIsActiveToProduct \
  --project ECommerce.Infrastructure \
  --startup-project ECommerce.Api

# 4. Aplicar
dotnet ef database update \
  --project ECommerce.Infrastructure \
  --startup-project ECommerce.Api
```

### 8.4 Referencia completa de comandos

| Comando | Qué hace | Cuándo usarlo |
|---|---|---|
| `migrations add NombreMigracion` | Crea un nuevo archivo de migración | Después de modificar entidades |
| `database update` | Aplica todas las pendientes | Para actualizar la BD |
| `migrations list` | Lista todas y su estado | Para ver qué está aplicado |
| `migrations remove` | Elimina la última | Solo si NO fue aplicada aún |
| `database update NombreMigracion` | Aplica hasta una específica | Para ir a un estado específico |
| `database update 0` | Revierte TODAS | Para resetear la BD completa |
| `migrations script` | Genera SQL sin ejecutarlo | Revisión antes de producción |
| `database drop` | Elimina la BD | Para empezar desde cero |

---

## Parte 9 — Verificación Final

### 9.1 Los 6 casos en Swagger

| Caso | Request | Status esperado |
|---|---|---|
| 1 | `GET /api/products/{guid-inexistente}` | 404 Not Found + ProblemDetails |
| 2 | `POST /api/products` con `{ name:'', price:-1 }` | 400 con 2 errores en `errors` |
| 3 | `POST /api/products` con `{ price:0 }` | 400 (GreaterThan excluye el cero) |
| 4 | `POST /api/orders` con stock insuficiente | 422 Unprocessable Entity |
| 5 | `POST /api/orders` con `{ items:[] }` | 400 con error de items vacíos |
| 6 | `POST /api/products` con datos válidos + token | 201 Created |

### 9.2 Probar autenticación con Postman

```
# Paso 1 — Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json
{ "email": "admin@test.com", "password": "Admin123!" }

# Respuesta esperada:
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }

# Paso 2 — Request protegido
GET http://localhost:5000/api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Paso 3 — Sin token (debe dar 401)
GET http://localhost:5000/api/products
# Sin header Authorization → HTTP 401 Unauthorized

# Paso 4 — Sin rol Admin (debe dar 403)
DELETE http://localhost:5000/api/products/1
Authorization: Bearer <token-de-usuario-sin-rol-admin>
# → HTTP 403 Forbidden
```

---

## Checklist de Entrega

### Domain ✓
- [ ] `DomainException` (abstract) en `Domain/Exceptions/`
- [ ] `NotFoundException` hereda de `DomainException` — constructor `(entityName, id)`
- [ ] `InsufficientStockException` hereda de `DomainException`
- [ ] `DomainRuleException` hereda de `DomainException`
- [ ] `Product.Reserve()` lanza `InsufficientStockException` cuando `quantity > Stock`
- [ ] Constructor privado en todas las entidades (para EF Core)
- [ ] `Subtotal` en `OrderItem` es propiedad calculada (no persistida)

### Infrastructure — EF Core ✓
- [ ] Configuraciones Fluent API separadas por entidad en `Configurations/`
- [ ] `ValueGeneratedNever()` en todos los GUIDs generados en el dominio
- [ ] `HasColumnType("decimal(18,2)")` en todos los campos monetarios
- [ ] `AsNoTracking()` en todos los métodos de solo lectura
- [ ] Enum `OrderStatus` guardado como string con `HasConversion<string>()`
- [ ] `Subtotal` ignorado en `OrderItemConfiguration` con `.Ignore()`
- [ ] `ApplyConfigurationsFromAssembly` en `OnModelCreating`
- [ ] GUIDs fijos (no `Guid.NewGuid()`) en el seed de `HasData()`

### Application — Validaciones y Errores ✓
- [ ] `CreateProductValidator` con reglas Name, Price, Stock, CategoryId
- [ ] `CreateOrderValidator` con `RuleForEach` para los OrderItems
- [ ] `ValidationBehavior` implementando `IPipelineBehavior<TRequest, TResponse>`
- [ ] `return await next()` al final de `ValidationBehavior` (crítico)
- [ ] Validators y `ValidationBehavior` registrados en `Program.cs`

### Infrastructure — Seguridad ✓
- [ ] `ITokenService` en Application (interfaz/contrato)
- [ ] `JwtTokenService` en Infrastructure (implementación)
- [ ] `DateTime.UtcNow` (no `DateTime.Now`) en la generación del token
- [ ] Token con expiración configurada
- [ ] Sin datos sensibles en el Payload del JWT
- [ ] `LoginUseCase` usa `BCrypt.Verify()` para validar la contraseña

### API — Pipeline ✓
- [ ] `GlobalExceptionHandler` implementando `IExceptionHandler`
- [ ] `app.UseExceptionHandler()` como **primer** middleware del pipeline
- [ ] `app.UseAuthentication()` **antes** que `app.UseAuthorization()`
- [ ] `AddExceptionHandler<GlobalExceptionHandler>()` + `AddProblemDetails()` en services
- [ ] Ningún controller tiene `try/catch`
- [ ] DbContext registrado como **Scoped** (nunca Singleton)

---

## Tabla de Errores Comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| 500 en lugar de 404 | `NotFoundException` no hereda de `DomainException` | Verificar jerarquía: `Exception → DomainException → NotFoundException` |
| 500 con stacktrace expuesto | `UseExceptionHandler()` después de `MapControllers()` | Moverlo como primer middleware del pipeline |
| Content-Type: `application/json` en errores | Falta `.AddProblemDetails()` | Agregar `builder.Services.AddProblemDetails()` |
| Validator no se ejecuta | `ValidationBehavior` no registrado en MediatR | `cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>))` |
| 400 sin campo `errors` | `ValidationException` sin lista de Failures | Verificar `throw new ValidationException(failures.ToList())` |
| Todos los endpoints devuelven null | Falta `return await next()` en `ValidationBehavior` | Agregar como último statement |
| 422 en lugar de 404 | `NotFoundException` matchea `DomainException` en el switch | Poner `NotFoundException` **antes** que `DomainException` en el switch |
| `dotnet ef: command not found` | Herramienta no instalada | `dotnet tool install --global dotnet-ef` |
| `NullReferenceException` al acceder a `order.Items` | Relación no cargada | Usar `.Include(o => o.Items)` — eager loading explícito |
| GUID diferente en cada migración de seed | `Guid.NewGuid()` en `HasData()` | Hardcodear GUIDs fijos: `new Guid("...")` |
| `InvalidOperationException: A second operation` | DbContext compartido entre hilos | Verificar que DbContext sea Scoped, no Singleton |
| 401 en lugar de 403 | `UseAuthorization()` antes de `UseAuthentication()` | Invertir el orden — Authentication siempre primero |

---

*Instructivo generado para Backend 2026 — Prof. Nicolás Ortiz — UCCuyo*
