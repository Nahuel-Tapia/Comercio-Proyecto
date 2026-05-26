# Code Review — ECommerce Backend
## Repositorio: Nahuel-Tapia/Comercio-Proyecto
## Revisado contra: Instructivo Backend 2026 — Prof. Nicolás Ortiz (Unidades 4, 5 y 6)

---

## Resumen general

| Estado | Cantidad |
|---|---|
| ✅ Archivos correctos (verificados) | 18 |
| ⬆️ Mejoras sobre el instructivo | 2 |
| ❌ Problemas a corregir | 3 |
| ⚠️ No leídos por rate limit de GitHub API | 6 |

---

## ✅ LO QUE ESTÁ CORRECTO

### Domain — Entidades

**`ECommerce.Domain/Entities/Product.cs`**
- Constructor privado para EF Core ✓
- Constructor de negocio con validaciones ✓
- `Reserve()` lanza `InsufficientStockException` cuando `quantity > Stock` ✓
- `UpdatePrice()` lanza `DomainRuleException` si precio <= 0 ✓
- `DateTime.UtcNow` (no `DateTime.Now`) ✓

**`ECommerce.Domain/Entities/Order.cs`**
- Enum `OrderStatus` definido correctamente ✓
- `_items` como `List<OrderItem>` privada ✓
- `Items` expuesto como `IReadOnlyCollection<OrderItem>` ✓
- `AddItem()` delega a `product.Reserve()` (regla de negocio en el dominio) ✓

**`ECommerce.Domain/Entities/OrderItem.cs`**
- `Subtotal` es propiedad calculada (`UnitPrice * Quantity`), no campo persistido ✓
- Constructor privado para EF Core ✓

**`ECommerce.Domain/Entities/User.cs`**
- `PasswordHash` nunca expuesto en DTOs ✓
- `Role` con valor default `"User"` ✓
- `DateTime.UtcNow` ✓

**`ECommerce.Domain/Entities/Category.cs`**
- Propiedad de navegación `ICollection<Product>` ✓
- Constructor privado para EF Core ✓

---

### Domain — Exceptions

**Jerarquía correcta (el error más común mencionado en la documentación):**
```
Exception
  └── DomainException (abstract)
        ├── NotFoundException         ← hereda de DomainException, NO de Exception
        ├── InsufficientStockException
        └── DomainRuleException
```

- `DomainException` es `abstract`, hereda de `Exception` ✓
- `NotFoundException` hereda de `DomainException` (no de `Exception` directamente) ✓
- `InsufficientStockException` constructor `(int requested, int available)` ✓
- `DomainRuleException` para reglas de negocio genéricas ✓

> Si `NotFoundException` heredara de `Exception` directamente, el switch del `GlobalExceptionHandler`
> la capturaría como 500 en lugar de 404. Está bien implementado.

---

### Infrastructure — Configuraciones Fluent API

**`ECommerce.Infrastructure/Persistence/Configurations/ProductConfiguration.cs`**
- `ValueGeneratedNever()` para Guid generado en el dominio ✓
- `HasColumnType("decimal(18,2)")` para el precio ✓
- `HasDefaultValue(0)` para Stock ✓
- `HasIndex(p => p.Name)` para búsquedas ✓

**`ECommerce.Infrastructure/Persistence/Configurations/CategoryConfiguration.cs`**
- GUIDs fijos hardcodeados (NO `Guid.NewGuid()`) ✓
- `HasData()` con GUIDs constantes ✓
- `OnDelete(DeleteBehavior.Restrict)` en relación con Products ✓

**`ECommerce.Infrastructure/Persistence/Configurations/OrderConfiguration.cs`**
- Enum guardado como string: `HasConversion<string>().HasMaxLength(20)` ✓
- `OnDelete(DeleteBehavior.Cascade)` para OrderItems ✓
- `decimal(18,2)` en Total ✓

**`ECommerce.Infrastructure/Persistence/Configurations/OrderItemConfiguration.cs`**
- `builder.Ignore(i => i.Subtotal)` — Subtotal NO se persiste en BD ✓
- `ValueGeneratedNever()` ✓
- `decimal(18,2)` en UnitPrice ✓

**`ECommerce.Infrastructure/Persistence/Configurations/UserConfiguration.cs`**
- `HasIndex(u => u.Email).IsUnique()` ✓
- `PasswordHash` requerido ✓

**`ECommerce.Infrastructure/Persistence/ApplicationDbContext.cs`**
- `ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly)` ✓
- Los 5 DbSet declarados: Products, Categories, Orders, OrderItems, Users ✓

---

### Infrastructure — Servicios y DI

**`ECommerce.Infrastructure/InfrastructureServiceExtensions.cs`**
- `DbContext` registrado como `Scoped` (no Singleton) ✓
- `UseSqlite` para desarrollo ✓
- Los 3 repositorios registrados como `Scoped` ✓
- `ITokenService` registrado ✓
- `LoginUseCase` registrado ✓
- `AddExceptionHandler<GlobalExceptionHandler>()` + `AddProblemDetails()` ✓

---

### Application

**`ECommerce.Application/UseCases/Auth/LoginUseCase.cs`**
- `BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)` ✓
- Retorna `null` si credenciales incorrectas (no lanza excepción) ✓
- Genera token con `ITokenService` (contrato de Application) ✓

**`ECommerce.Application/Validators/Products/CreateProductValidator.cs`**
- `NotEmpty()` + `MaximumLength(100)` en Name ✓
- `GreaterThan(0m)` en Price — **excluye el cero** (correcto, Price=0 falla) ✓
- `GreaterThanOrEqualTo(0)` en Stock ✓
- `NotEmpty()` en CategoryId ✓

---

### API

**`ECommerce.Api/Controllers/AuthController.cs`**
- Inyecta `LoginUseCase` ✓
- Retorna `401 Unauthorized` si token es null ✓
- `record LoginRequest(string Email, string Password)` ✓

**`ECommerce.Api/Controllers/ProductsController.cs`**
- `GetById()` lanza `NotFoundException` si producto no existe ✓
- `Delete()` usa `ExistsAsync()` antes de eliminar ✓
- Sin `try/catch` en los controllers ✓
- `[Authorize]` en Create, `[Authorize(Roles = "Admin")]` en Delete ✓

**`ECommerce.Api/Program.cs`**
- Orden del pipeline correcto:
  1. `app.UseExceptionHandler()` ← PRIMERO ✓
  2. `app.UseHttpsRedirection()` ✓
  3. `app.UseAuthentication()` ← antes que Authorization ✓
  4. `app.UseAuthorization()` ✓
  5. `app.MapControllers()` ✓

---

## ⬆️ MEJORAS SOBRE EL INSTRUCTIVO

### 1. GlobalExceptionHandler incluye errores de validación en ProblemDetails

**Archivo:** `ECommerce.Infrastructure/Middleware/GlobalExceptionHandler.cs`

El instructivo no incluía esto, pero el código agrega los errores de FluentValidation
al campo `errors` de ProblemDetails, que es lo que necesita el frontend:

```csharp
// MEJORA: esto no estaba en el instructivo pero es la práctica correcta
if (exception is ValidationException validationException)
{
    problemDetails.Extensions["errors"] = validationException.Errors
        .Select(e => new { e.PropertyName, e.ErrorMessage });
}
```

Resultado: el cliente recibe `400 { errors: { Name: ["..."], Price: ["..."] } }` correctamente.

### 2. ProductsController usa ISender de MediatR

**Archivo:** `ECommerce.Api/Controllers/ProductsController.cs`

El instructivo usaba el repositorio directamente en el controller. El código
usa `ISender` (MediatR) para el endpoint Create, lo que es más correcto para CQRS:

```csharp
// MEJORA: pasa por el pipeline MediatR (ValidationBehavior se ejecuta automáticamente)
private readonly ISender _sender;

[Authorize]
[HttpPost]
public async Task<IActionResult> Create([FromBody] CreateProductCommand command, CancellationToken ct)
{
    var productId = await _sender.Send(command, ct);
    return CreatedAtAction(nameof(GetById), new { id = productId }, new { id = productId });
}
```

---

## ❌ PROBLEMAS A CORREGIR

### PROBLEMA 1 — Middleware legacy no eliminado

**Archivo a eliminar:** `ECommerce.Api/Middleware/GlobalExceptionMiddleware.cs`

**Por qué es un problema:**
Existe un middleware de estilo legacy (patrón `RequestDelegate` con try/catch)
que contradice el diseño correcto basado en `IExceptionHandler` (.NET 8).

El legacy NO está registrado en `Program.cs` (por eso no rompe nada hoy),
pero su existencia en el proyecto es confusa. Si alguien agrega accidentalmente
`app.UseMiddleware<GlobalExceptionMiddleware>()`, habrá dos handlers activos
con comportamientos diferentes.

**El correcto:** `ECommerce.Infrastructure/Middleware/GlobalExceptionHandler.cs` ← MANTENER

**El que sobra:**
```csharp
// ECommerce.Api/Middleware/GlobalExceptionMiddleware.cs — ELIMINAR
// Este es el patrón VIEJO, no usa IExceptionHandler
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next; // ← patrón legacy
    public async Task InvokeAsync(HttpContext context)
    {
        try { await _next(context); }
        catch (Exception ex) { ... } // ← try/catch manual, no usa IExceptionHandler
    }
}
```

**Acción:**
```bash
# Eliminar el archivo
git rm ECommerce.Api/Middleware/GlobalExceptionMiddleware.cs
# Si hay carpeta Middleware en Api y quedó vacía:
git rm -r ECommerce.Api/Middleware/
```

---

### PROBLEMA 2 — Interfaces de repositorios duplicadas

**Por qué es un problema:**
Las interfaces `IProductRepository` e `IOrderRepository` están definidas
en **dos carpetas distintas** dentro de `ECommerce.Application`:

```
ECommerce.Application/
├── Interfaces/
│   ├── IProductRepository.cs   ← versión correcta
│   ├── IOrderRepository.cs     ← versión correcta
│   ├── ITokenService.cs
│   └── IUserRepository.cs
└── Repositories/               ← carpeta duplicada, ELIMINAR
    ├── IProductRepository.cs   ← duplicado
    └── IOrderRepository.cs     ← duplicado
```

El instructivo define los contratos en `Application/Interfaces/`. La carpeta
`Repositories/` dentro de Application no debería existir.

Riesgo: si Infrastructure implementa la interfaz de `Repositories/` y Application
usa la de `Interfaces/`, el contenedor de DI puede no resolver correctamente.

**Acción:**
```bash
# Eliminar la carpeta duplicada
git rm ECommerce.Application/Repositories/IProductRepository.cs
git rm ECommerce.Application/Repositories/IOrderRepository.cs
git rm -r ECommerce.Application/Repositories/

# Verificar que todos los using apuntan a ECommerce.Application.Interfaces
# y no a ECommerce.Application.Repositories
```

**Verificar en todos los archivos que usan estas interfaces:**
```csharp
// CORRECTO — debe decir Interfaces, no Repositories
using ECommerce.Application.Interfaces;
```

---

### PROBLEMA 3 — Migraciones en dos carpetas

**Por qué es un problema:**
Hay archivos de migración en dos ubicaciones distintas:

```
ECommerce.Infrastructure/
├── Migrations/                          ← carpeta 1 (4 archivos)
│   ├── 20260522134219_InitialCreate.cs
│   ├── 20260522135954_AddAuditingAndSoftDelete.cs
│   └── ApplicationDbContextModelSnapshot.cs
└── Persistence/
    └── Migrations/                      ← carpeta 2 (1 archivo) ← CORRECTA
        └── 20260526120501_InitialMigration.cs
```

El instructivo especifica que las migraciones van en `Persistence/Migrations/`.
Tener dos sets activos puede generar conflictos de schema o aplicar migraciones
en orden incorrecto.

**Acción — diagnóstico primero:**
```bash
# Ver qué MigrationsAssembly está configurado en InfrastructureServiceExtensions
# Buscar en el código si hay .MigrationsAssembly(...) configurado

dotnet ef migrations list \
  --project ECommerce.Infrastructure \
  --startup-project ECommerce.Api
# Este comando muestra qué migraciones reconoce EF y desde qué carpeta
```

**Luego limpiar:**
```bash
# Si las migraciones válidas son las de Persistence/Migrations/:
git rm ECommerce.Infrastructure/Migrations/20260522134219_InitialCreate.cs
git rm ECommerce.Infrastructure/Migrations/20260522134219_InitialCreate.Designer.cs
git rm ECommerce.Infrastructure/Migrations/20260522135954_AddAuditingAndSoftDelete.cs
git rm ECommerce.Infrastructure/Migrations/20260522135954_AddAuditingAndSoftDelete.Designer.cs
git rm ECommerce.Infrastructure/Migrations/ApplicationDbContextModelSnapshot.cs
git rm -r ECommerce.Infrastructure/Migrations/

# Regenerar desde cero si hay duda:
dotnet ef database drop --project ECommerce.Infrastructure --startup-project ECommerce.Api
dotnet ef migrations add InitialCreate \
  --project ECommerce.Infrastructure \
  --startup-project ECommerce.Api
dotnet ef database update \
  --project ECommerce.Infrastructure \
  --startup-project ECommerce.Api
```

---

## ⚠️ ARCHIVOS NO VERIFICADOS (rate limit de GitHub API)

Los siguientes archivos no pudieron leerse. Por el patrón del resto del código
es probable que estén correctos, pero conviene revisarlos manualmente:

| Archivo | Qué verificar |
|---|---|
| `ECommerce.Application/Validators/Orders/CreateOrderValidator.cs` | `RuleForEach(x => x.Items).ChildRules(...)`, `InclusiveBetween(1, 100)` en Quantity |
| `ECommerce.Application/Behaviors/ValidationBehavior.cs` | `return await next()` al final (si falta, todos los endpoints devuelven null) |
| `ECommerce.Infrastructure/Services/JwtTokenService.cs` | `DateTime.UtcNow`, sin datos sensibles en el payload |
| `ECommerce.Application/Validators/Products/CreateProductCommand.cs` | Propiedades: Name, Description, Price, Stock, CategoryId |
| `ECommerce.Application/UseCases/Orders/CreateOrderCommandHandler.cs` | Valida stock, lanza NotFoundException si producto no existe |
| `ECommerce.Api/appsettings.json` | Sección `Jwt` con Key, Issuer, Audience, ExpirationHours |

### Checklist de verificación manual

```csharp
// ValidationBehavior.cs — verificar que termina con esto:
return await next(); // ← si falta, TODOS los endpoints devuelven null en 200

// JwtTokenService.cs — verificar que NO incluye:
new Claim("password", user.Password),    // NUNCA
new Claim("creditCard", user.CardNumber) // NUNCA

// JwtTokenService.cs — verificar que usa:
expires: DateTime.UtcNow.AddHours(...) // UTC, no DateTime.Now

// appsettings.json — verificar que existe la sección:
"Jwt": {
  "Key": "...",           // mínimo 32 caracteres
  "Issuer": "...",
  "Audience": "...",
  "ExpirationHours": 1
}
```

---

## CHECKLIST FINAL DE ENTREGA

### Domain ✓
- [x] `DomainException` abstract en `Domain/Exceptions/`
- [x] `NotFoundException` hereda de `DomainException`
- [x] `InsufficientStockException` hereda de `DomainException`
- [x] `DomainRuleException` hereda de `DomainException`
- [x] `Product.Reserve()` lanza `InsufficientStockException`
- [x] Constructor privado en todas las entidades
- [x] `Subtotal` en `OrderItem` es propiedad calculada

### Infrastructure — EF Core ✓
- [x] Configuraciones Fluent API separadas por entidad
- [x] `ValueGeneratedNever()` en todos los GUIDs del dominio
- [x] `decimal(18,2)` en Price, Total y UnitPrice
- [x] `AsNoTracking()` en métodos de solo lectura
- [x] `OrderStatus` guardado como string
- [x] `Subtotal` ignorado en `OrderItemConfiguration`
- [x] `ApplyConfigurationsFromAssembly` en `OnModelCreating`
- [x] GUIDs fijos en seed (no `Guid.NewGuid()`)

### Application — Validaciones ✓
- [x] `CreateProductValidator` con reglas correctas
- [ ] `CreateOrderValidator` con `RuleForEach` — **VERIFICAR MANUALMENTE**
- [ ] `ValidationBehavior` con `return await next()` — **VERIFICAR MANUALMENTE**
- [x] Validators registrados con `AddValidatorsFromAssemblyContaining`
- [x] `ValidationBehavior` registrado con `cfg.AddBehavior`

### Seguridad ✓
- [x] `ITokenService` en Application
- [ ] `JwtTokenService` sin datos sensibles y con `DateTime.UtcNow` — **VERIFICAR**
- [x] `LoginUseCase` usa `BCrypt.Verify()`
- [x] Pipeline: `UseAuthentication` antes que `UseAuthorization`
- [x] `UseExceptionHandler()` como primer middleware

### Pendiente (Problemas detectados) ❌
- [ ] Eliminar `ECommerce.Api/Middleware/GlobalExceptionMiddleware.cs`
- [ ] Eliminar `ECommerce.Application/Repositories/` (interfaces duplicadas)
- [ ] Resolver migraciones en dos carpetas (`Migrations/` vs `Persistence/Migrations/`)

---

*Revisión realizada el 26/05/2026 — Backend 2026 — UCCuyo*
