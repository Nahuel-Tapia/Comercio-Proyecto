# ECommerce Project (Clean Architecture & DDD)

Este es un proyecto de demostración de un ECommerce implementado bajo los principios de **Clean Architecture** y **Domain-Driven Design (DDD)** utilizando .NET 8, EF Core, Sqlite, MediatR y FluentValidation.

## Estructura del Proyecto

El proyecto está dividido en las siguientes capas arquitectónicas:

*   **ECommerce.Domain:** Contiene las entidades de negocio (`Product`, `Order`, `User`), objetos de valor (`Money`, `Email`, `ProductName`) y excepciones de dominio. Está libre de cualquier dependencia externa o tecnológica.
*   **ECommerce.Application:** Contiene los casos de uso (Commands/Queries) organizados bajo subcarpetas estructuradas, la definición de interfaces/puertos, DTOs de comunicación (`ProductResponse`, `CreateProductRequest`, etc.), mappers, validadores de FluentValidation y comportamientos de pipeline (`ValidationBehavior`).
*   **ECommerce.Infrastructure:** Contiene las implementaciones tecnológicas de acceso a datos (Entity Framework Core con SQLite, repositorios), el servicio de autenticación JWT (`JwtTokenService`) y middlewares globales como el manejador de excepciones.
*   **ECommerce.Api:** Capa de presentación que expone la API Web a través de controladores y configura la UI de Swagger.
*   **ECommerce.Tests:** Suite de pruebas unitarias y de aplicación.

---

## Usuarios de Prueba (Seed Data)

La base de datos incluye dos usuarios pre-cargados para realizar pruebas de autenticación y control de accesos por roles en los diferentes endpoints:

| Usuario | Email | Contraseña | Rol | Descripción / Permisos |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `admin@ecommerce.com` | `Admin123!` | `Admin` | Permite gestionar el catálogo completo (ej. eliminar productos en `DELETE /api/products/{id}`). |
| **Usuario Común** | `user@ecommerce.com` | `User123!` | `User` | Permite la navegación básica y la creación de órdenes (`POST /api/orders`). |

---

## Ejecución del Proyecto

### Requisitos Previos
El proyecto utiliza un SDK de .NET local configurado en la carpeta `.dotnet`. Para ejecutar comandos locales de dotnet en la terminal, asegúrate de utilizar la ruta correcta (ej. `.\.dotnet\dotnet.exe` en Windows).

### 1. Compilar el proyecto:
```bash
.\.dotnet\dotnet.exe build
```

### 2. Actualizar la base de datos (Migrations):
Las migraciones ya están inicializadas. Si necesitas volver a aplicar o recrear la base de datos:
```powershell
$env:DOTNET_ROOT = "C:\Users\Docente\Desktop\Comercio Proyecto\.dotnet"
$env:PATH = "C:\Users\Docente\Desktop\Comercio Proyecto\.dotnet;" + $env:PATH
.\.dotnet\dotnet.exe ef database update --project ECommerce.Infrastructure --startup-project ECommerce.Api
```

### 3. Levantar la API y acceder a Swagger:
```bash
.\.dotnet\dotnet.exe run --project ECommerce.Api
```
Una vez iniciado, abre tu navegador e ingresa a la siguiente URL para explorar y probar los endpoints:
👉 **[http://localhost:5199/swagger](http://localhost:5199/swagger)**

---

## Pruebas de Integración y Unitarias

Para ejecutar el conjunto de pruebas automatizadas:
```bash
.\.dotnet\dotnet.exe test
```
Actualmente, el proyecto cuenta con **26 pruebas automatizadas** que validan la lógica interna del dominio y las reglas de validación en los casos de uso.
