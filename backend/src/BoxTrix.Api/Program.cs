using System.Text.Json.Serialization;
using BoxTrix.Api.Dtos;
using BoxTrix.Api.Endpoints;
using BoxTrix.Api.Infrastructure;
using BoxTrix.Api.Validators;
using BoxTrix.Application;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddBoxTrixApplication();
builder.Services.AddExceptionHandler<DomainExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddScoped<IValidator<InputDto>, InputValidator>();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

const string CorsPolicy = "BoxTrixFrontend";
var frontendOrigin = Environment.GetEnvironmentVariable("FRONTEND_ORIGIN") ?? "http://localhost:4400";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy => policy
        .WithOrigins(frontendOrigin)
        .WithMethods("GET", "POST")
        .AllowAnyHeader());
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors(CorsPolicy);
app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/", () => Results.Ok(new { name = "BoxTrix API", version = "1.0.0" }));
app.MapOrganizeEndpoints();
app.MapAreaImportEndpoints();

app.Run();

public partial class Program;
