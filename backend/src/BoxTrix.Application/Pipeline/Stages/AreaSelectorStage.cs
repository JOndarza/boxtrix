using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Functions;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [d] Iterates areas largest-volume-first (FFD), running the per-area sub
/// pipeline (LayerSlicer + Compactor) and accumulating unfitted boxes for
/// the UnfittedCollector.
/// </summary>
public sealed class AreaSelectorStage : IPipelineStage
{
    private readonly LayerSlicerStage _slicer;
    private readonly CompactorStage _compactor;

    public AreaSelectorStage(LayerSlicerStage slicer, CompactorStage compactor)
    {
        _slicer = slicer;
        _compactor = compactor;
    }

    public AreaSelectorResult Distribute(
        IReadOnlyList<AreaContext> contexts,
        IReadOnlyList<Box> sortedBoxes,
        double minSupportRatio)
    {
        var ordered = contexts.OrderByDescending(c => c.Source.Size.Volume).ToArray();
        var organised = new List<OrganizedArea>(ordered.Length);
        var remaining = new List<Box>(sortedBoxes);

        foreach (var ctx in ordered)
        {
            var slicerResult = _slicer.Pack(remaining, ctx, minSupportRatio);
            var compacted = _compactor.Compact(slicerResult.Placed, ctx, minSupportRatio);
            var fixedSize = GeometryFunctions.ComputeFixedSize(compacted);

            organised.Add(new OrganizedArea(ctx.Source, compacted, fixedSize, Unplaced: false));
            remaining = slicerResult.Unfitted.ToList();
        }

        return new AreaSelectorResult(organised, remaining);
    }
}

public sealed record AreaSelectorResult(IReadOnlyList<OrganizedArea> Areas, IReadOnlyList<Box> Unfitted);
