using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace BoxTrix.Api.Infrastructure;

/// <summary>
/// Maps ArgumentException (thrown by NormalizerStage for invalid domain input)
/// and ArgumentOutOfRangeException to 422 Unprocessable Entity ProblemDetails
/// instead of the default 500. All other exceptions fall through to the default handler.
/// </summary>
internal sealed class DomainExceptionHandler : IExceptionHandler
{
    private readonly ILogger<DomainExceptionHandler> _logger;

    public DomainExceptionHandler(ILogger<DomainExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not (ArgumentException or ArgumentOutOfRangeException))
        {
            return false;
        }

        _logger.LogWarning(exception, "Domain validation error: {Message}", exception.Message);

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status422UnprocessableEntity,
            Title = "Unprocessable input",
            Detail = exception.Message,
            Instance = httpContext.Request.Path,
        };

        httpContext.Response.StatusCode = StatusCodes.Status422UnprocessableEntity;
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
        return true;
    }
}
