using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [c] Stable sort: heaviest × largest first, then volume, then max dimension.
/// Heavy/large boxes consume the floor first, naturally producing a bottom-up
/// stack when combined with the LayerSlicer.
/// </summary>
public sealed class BoxSorterStage : IPipelineStage
{
    public IReadOnlyList<Box> Sort(IReadOnlyList<Box> boxes) =>
        boxes
            .OrderByDescending(b => b.GravityKey)
            .ThenByDescending(b => b.Size.Volume)
            .ThenByDescending(b => b.Size.MaxDimension)
            .ThenBy(b => b.Id, StringComparer.Ordinal)
            .ToArray();
}
