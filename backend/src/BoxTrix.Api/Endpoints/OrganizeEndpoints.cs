using BoxTrix.Api.Dtos;
using BoxTrix.Application.Pipeline;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace BoxTrix.Api.Endpoints;

public static class OrganizeEndpoints
{
    public static IEndpointRouteBuilder MapOrganizeEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/organize").WithTags("Organize");

        group.MapPost("/sort", Sort)
            .WithName("OrganizeSort")
            .WithSummary("Pack boxes into the supplied areas using the pipeline algorithm.");

        return routes;
    }

    private static async Task<Results<Ok<OutputDto>, ValidationProblem>> Sort(
        InputDto input,
        IValidator<InputDto> validator,
        IPacker packer,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(input, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            return TypedResults.ValidationProblem(errors);
        }

        var request = Mappers.ToPipelineRequest(input);
        var response = packer.Pack(request);
        return TypedResults.Ok(Mappers.FromPipelineResponse(response, input.Detail));
    }
}
