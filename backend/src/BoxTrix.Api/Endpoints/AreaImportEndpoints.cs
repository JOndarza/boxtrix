using BoxTrix.Api.Dtos;
using BoxTrix.Application.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace BoxTrix.Api.Endpoints;

public static class AreaImportEndpoints
{
    public static IEndpointRouteBuilder MapAreaImportEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/areas").WithTags("Areas");

        group.MapPost("/import-dxf", ImportDxf)
            .WithName("ImportDxf")
            .WithSummary("Parse a DXF file and return detected closed-polyline areas with their dimensions.")
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery();

        return routes;
    }

    private static async Task<Results<Ok<IReadOnlyList<AreaImportResultDto>>, BadRequest<string>>> ImportDxf(
        HttpRequest request,
        DxfAreaParserService parser)
    {
        if (!request.HasFormContentType)
            return TypedResults.BadRequest("Request must be multipart/form-data.");

        var form = await request.ReadFormAsync();

        var file = form.Files.GetFile("file");
        if (file is null || file.Length == 0)
            return TypedResults.BadRequest("A DXF file is required.");

        if (!decimal.TryParse(form["defaultHeight"], System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var defaultHeight)
            || defaultHeight <= 0)
            return TypedResults.BadRequest("defaultHeight must be a positive number.");

        try
        {
            using var stream = file.OpenReadStream();
            var results = parser.Parse(stream, defaultHeight);
            var dtos = results
                .Select(r => new AreaImportResultDto(r.Name, r.Width, r.Depth, r.Height))
                .ToList();
            return TypedResults.Ok<IReadOnlyList<AreaImportResultDto>>(dtos);
        }
        catch (Exception)
        {
            return TypedResults.BadRequest("Could not parse the DXF file. Ensure it is a valid ASCII or binary DXF.");
        }
    }
}
