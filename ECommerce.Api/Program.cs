using ECommerce.Infrastructure;
using ECommerce.Application.Repositories;
using ECommerce.Domain.Entities;
using ECommerce.Infrastructure.Persistence;
using ECommerce.Api.Middleware;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddInfrastructure(builder.Configuration);

// Add Swagger services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapPost("/api/users", async (ApplicationDbContext context, CreateUserDto dto, HttpContext httpContext) =>
{
    if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Length < 3)
    {
        return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validación de entrada fallida",
            Detail = "El nombre del usuario es obligatorio y debe tener al menos 3 caracteres.",
            Instance = httpContext.Request.Path
        });
    }

    if (string.IsNullOrWhiteSpace(dto.Email) || !dto.Email.Contains("@") || !dto.Email.Contains("."))
    {
        return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validación de entrada fallida",
            Detail = "El correo electrónico provisto no tiene un formato válido (debe contener '@' y '.').",
            Instance = httpContext.Request.Path
        });
    }

    var emailExists = await context.Users.AsNoTracking().AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
    if (emailExists)
    {
        return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Conflicto de Datos",
            Detail = "El correo electrónico ya se encuentra registrado por otro usuario.",
            Instance = httpContext.Request.Path
        });
    }

    var user = new User { Id = Guid.NewGuid(), Name = dto.Name, Email = dto.Email };
    context.Users.Add(user);
    await context.SaveChangesAsync();
    return Results.Created($"/api/users/{user.Id}", new UserDto(user.Id, user.Name, user.Email));
})
.WithName("CreateUser")
.WithOpenApi();

app.MapGet("/api/users", async (ApplicationDbContext context) =>
    await context.Users.AsNoTracking().Select(u => new UserDto(u.Id, u.Name, u.Email)).ToListAsync())
    .WithName("GetUsers")
    .WithOpenApi();

// --- Categories API ---
app.MapGet("/api/categories", async (ApplicationDbContext context) =>
    await context.Categories.AsNoTracking().Select(c => new CategoryDto(c.Id, c.Name)).ToListAsync())
    .WithName("GetCategories")
    .WithOpenApi();

// --- Products API ---
app.MapGet("/api/products", async (IProductRepository repository) =>
{
    var products = await repository.GetAllAsync();
    return products.Select(p => new ProductDto(p.Id, p.Name, p.Price, p.CategoryId));
})
.WithName("GetProducts")
.WithOpenApi();

app.MapGet("/api/products/{id:guid}", async (Guid id, IProductRepository repository, HttpContext httpContext) =>
{
    var product = await repository.GetByIdAsync(id);
    if (product is null)
    {
        return Results.NotFound(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Recurso no encontrado",
            Detail = $"El producto con ID {id} no existe en el catálogo activo.",
            Instance = httpContext.Request.Path
        });
    }
    return Results.Ok(new ProductDto(product.Id, product.Name, product.Price, product.CategoryId));
})
.WithName("GetProductById")
.WithOpenApi();

app.MapPost("/api/products", async (CreateProductDto dto, IProductRepository repository, ApplicationDbContext context, HttpContext httpContext) =>
{
    if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Length < 3)
    {
        return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validación de entrada fallida",
            Detail = "El nombre del producto es obligatorio y debe tener al menos 3 caracteres.",
            Instance = httpContext.Request.Path
        });
    }

    if (dto.Price <= 0)
    {
        return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validación de entrada fallida",
            Detail = "El precio del producto debe ser mayor a cero.",
            Instance = httpContext.Request.Path
        });
    }

    var categoryExists = await context.Categories.AsNoTracking().AnyAsync(c => c.Id == dto.CategoryId);
    if (!categoryExists)
    {
        return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Relación no encontrada",
            Detail = $"La categoría con ID {dto.CategoryId} no existe.",
            Instance = httpContext.Request.Path
        });
    }

    var product = new Product
    {
        Id = Guid.NewGuid(),
        Name = dto.Name,
        Price = dto.Price,
        CategoryId = dto.CategoryId
    };
    await repository.AddAsync(product);
    return Results.Created($"/api/products/{product.Id}", new ProductDto(product.Id, product.Name, product.Price, product.CategoryId));
})
.WithName("CreateProduct")
.WithOpenApi();

app.MapPut("/api/products/{id:guid}", async (Guid id, UpdateProductDto dto, IProductRepository repository, ApplicationDbContext context, HttpContext httpContext) =>
{
    var product = await repository.GetByIdAsync(id);
    if (product is null)
    {
        return Results.NotFound(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Recurso no encontrado",
            Detail = $"El producto con ID {id} no existe en el catálogo activo.",
            Instance = httpContext.Request.Path
        });
    }

    if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Length < 3)
    {
        return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validación de entrada fallida",
            Detail = "El nombre del producto es obligatorio y debe tener al menos 3 caracteres.",
            Instance = httpContext.Request.Path
        });
    }

    if (dto.Price <= 0)
    {
        return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validación de entrada fallida",
            Detail = "El precio del producto debe ser mayor a cero.",
            Instance = httpContext.Request.Path
        });
    }

    var categoryExists = await context.Categories.AsNoTracking().AnyAsync(c => c.Id == dto.CategoryId);
    if (!categoryExists)
    {
        return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Relación no encontrada",
            Detail = $"La categoría con ID {dto.CategoryId} no existe.",
            Instance = httpContext.Request.Path
        });
    }

    product.Name = dto.Name;
    product.Price = dto.Price;
    product.CategoryId = dto.CategoryId;

    await repository.UpdateAsync(product);
    return Results.NoContent();
})
.WithName("UpdateProduct")
.WithOpenApi();

app.MapDelete("/api/products/{id:guid}", async (Guid id, IProductRepository repository, HttpContext httpContext) =>
{
    var product = await repository.GetByIdAsync(id);
    if (product is null)
    {
        return Results.NotFound(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Recurso no encontrado",
            Detail = $"El producto con ID {id} no existe o ya fue eliminado.",
            Instance = httpContext.Request.Path
        });
    }

    await repository.DeleteAsync(id);
    return Results.NoContent();
})
.WithName("DeleteProduct")
.WithOpenApi();

// --- Orders API ---
app.MapGet("/api/orders", async (IOrderRepository repository) =>
{
    var orders = await repository.GetAllAsync();
    return orders.Select(o => new OrderDto(
        o.Id,
        o.UserId,
        o.OrderDate,
        o.Total,
        o.Items.Select(oi => new OrderItemDto(oi.ProductId, oi.UnitPrice, oi.Quantity)).ToList()
    ));
})
.WithName("GetOrders")
.WithOpenApi();

app.MapGet("/api/orders/{id:guid}", async (Guid id, IOrderRepository repository) =>
{
    var o = await repository.GetByIdAsync(id);
    return o is not null
        ? Results.Ok(new OrderDto(
            o.Id,
            o.UserId,
            o.OrderDate,
            o.Total,
            o.Items.Select(oi => new OrderItemDto(oi.ProductId, oi.UnitPrice, oi.Quantity)).ToList()
          ))
        : Results.NotFound();
})
.WithName("GetOrderById")
.WithOpenApi();

app.MapPost("/api/orders", async (CreateOrderDto dto, IOrderRepository repository, ApplicationDbContext context, HttpContext httpContext) =>
{
    var userExists = await context.Users.AsNoTracking().AnyAsync(u => u.Id == dto.UserId);
    if (!userExists)
    {
        return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validación de negocio fallida",
            Detail = $"El usuario comprador con ID {dto.UserId} no existe.",
            Instance = httpContext.Request.Path
        });
    }

    if (dto.Items == null || !dto.Items.Any())
    {
        return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validación de entrada fallida",
            Detail = "La orden debe contener al menos un ítem/producto.",
            Instance = httpContext.Request.Path
        });
    }

    var orderId = Guid.NewGuid();
    var orderItems = new List<OrderItem>();
    decimal total = 0;

    foreach (var itemDto in dto.Items)
    {
        var product = await context.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == itemDto.ProductId);
        if (product == null)
        {
            return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Recurso no encontrado",
                Detail = $"El producto con ID {itemDto.ProductId} no existe o ha sido eliminado del catálogo.",
                Instance = httpContext.Request.Path
            });
        }

        var qty = itemDto.Quantity;
        if (qty <= 0)
        {
            return Results.BadRequest(new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validación de entrada fallida",
                Detail = $"La cantidad para el producto '{product.Name}' ({itemDto.ProductId}) debe ser mayor a cero.",
                Instance = httpContext.Request.Path
            });
        }

        var unitPrice = product.Price;
        var itemTotal = unitPrice * qty;
        total += itemTotal;

        orderItems.Add(new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            ProductId = itemDto.ProductId,
            UnitPrice = unitPrice,
            Quantity = qty,
            TotalPrice = itemTotal
        });
    }

    var order = new Order
    {
        Id = orderId,
        UserId = dto.UserId,
        OrderDate = DateTime.UtcNow,
        Total = total,
        Items = orderItems
    };

    await repository.AddAsync(order);

    return Results.Created($"/api/orders/{order.Id}", new OrderDto(
        order.Id,
        order.UserId,
        order.OrderDate,
        order.Total,
        order.Items.Select(oi => new OrderItemDto(oi.ProductId, oi.UnitPrice, oi.Quantity)).ToList()
    ));
})
.WithName("CreateOrder")
.WithOpenApi();

app.MapDelete("/api/orders/{id:guid}", async (Guid id, IOrderRepository repository, HttpContext httpContext) =>
{
    var order = await repository.GetByIdAsync(id);
    if (order is null)
    {
        return Results.NotFound(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Recurso no encontrado",
            Detail = $"La orden con ID {id} no existe o ya fue eliminada.",
            Instance = httpContext.Request.Path
        });
    }

    await repository.DeleteAsync(id);
    return Results.NoContent();
})
.WithName("DeleteOrder")
.WithOpenApi();

// --- Diagnostics API (Ignore Global Filters) ---
app.MapGet("/api/diagnostics/products-raw", async (ApplicationDbContext context) =>
{
    var products = await context.Products
        .IgnoreQueryFilters()
        .AsNoTracking()
        .Select(p => new
        {
            p.Id,
            p.Name,
            p.Price,
            p.CategoryId,
            CreatedDate = EF.Property<DateTime>(p, "CreatedDate"),
            LastModifiedDate = EF.Property<DateTime?>(p, "LastModifiedDate"),
            IsDeleted = EF.Property<bool>(p, "IsDeleted")
        })
        .ToListAsync();
    return Results.Ok(products);
})
.WithName("GetRawProducts")
.WithOpenApi();

app.MapGet("/api/diagnostics/orders-raw", async (ApplicationDbContext context) =>
{
    var orders = await context.Orders
        .IgnoreQueryFilters()
        .AsNoTracking()
        .Select(o => new
        {
            o.Id,
            o.UserId,
            o.OrderDate,
            o.Total,
            CreatedDate = EF.Property<DateTime>(o, "CreatedDate"),
            LastModifiedDate = EF.Property<DateTime?>(o, "LastModifiedDate"),
            IsDeleted = EF.Property<bool>(o, "IsDeleted"),
            Items = o.Items.Select(oi => new { oi.ProductId, oi.UnitPrice, oi.Quantity }).ToList()
        })
        .ToListAsync();
    return Results.Ok(orders);
})
.WithName("GetRawOrders")
.WithOpenApi();

app.MapGet("/api/test-error", () => { throw new InvalidOperationException("Esta es una excepción de prueba para verificar el middleware global."); })
    .WithName("TestError")
    .WithOpenApi();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

// DTOs for avoiding circular dependencies and clean contract definitions
public record UserDto(Guid Id, string Name, string Email);
public record CreateUserDto(string Name, string Email);
public record CategoryDto(Guid Id, string Name);
public record ProductDto(Guid Id, string Name, decimal Price, Guid CategoryId);
public record CreateProductDto(string Name, decimal Price, Guid CategoryId);
public record UpdateProductDto(string Name, decimal Price, Guid CategoryId);
public record OrderItemDto(Guid ProductId, decimal UnitPrice, int Quantity);
public record OrderDto(Guid Id, Guid UserId, DateTime OrderDate, decimal Total, List<OrderItemDto> Items);
public record CreateOrderDto(Guid UserId, List<OrderItemDto> Items);
