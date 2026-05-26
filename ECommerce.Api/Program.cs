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
