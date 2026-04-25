using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Functions;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [h] Rejects placements that would not be physically stable: support ratio
/// below the configured threshold (default 0.7) or centre of gravity outside
/// the union of supporting rectangles. Floor placements (y == 0) always pass.
/// Set <see cref="NormalizedOptions.MinSupportRatio"/> to 0 to disable.
/// </summary>
public sealed class StabilityValidatorStage : IPipelineStage
{
    public bool IsStable(Aabb candidate, IReadOnlyList<PlacedBox> placed, double minSupportRatio)
    {
        if (minSupportRatio <= 0)
        {
            return true;
        }

        if (GeometryFunctions.SupportRatio(candidate, placed) < minSupportRatio)
        {
            return false;
        }

        return GeometryFunctions.CentreOfGravityInsideSupport(candidate, placed);
    }
}
