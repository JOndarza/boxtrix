using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [b] Computes <see cref="AreaContext"/> for each area: corner-driven X/Z
/// flips and the exit-corridor AABB transposed into canonical space.
/// </summary>
public sealed class AreaPreprocessorStage : IPipelineStage
{
    public IReadOnlyList<AreaContext> Preprocess(IReadOnlyList<Area> areas)
    {
        var result = new List<AreaContext>(areas.Count);
        foreach (var area in areas)
        {
            result.Add(AreaContext.FromArea(area, defaultMaxStackHeight: area.Size.Height));
        }
        return result;
    }
}
