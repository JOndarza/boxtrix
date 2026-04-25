using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Functions;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [d] Two-phase area assignment:
///
/// Phase 1 — flat-area affinity: areas whose height ≤ FlatAreaThreshold are
/// packed first, but only with items whose minimum dimension ≤ area.H × FlatItemRatio.
/// This routes genuinely flat items (comics, art books, dividers) to shallow areas
/// (drawers, flat shelves) before the main shelf claims them.
///
/// Phase 2 — FFD: remaining areas are filled largest-volume-first with all
/// remaining items (standard First Fit Decreasing).
///
/// Items that don't fit in their phase-1 target fall back into the phase-2 pool.
/// </summary>
public sealed class AreaSelectorStage : IPipelineStage
{
    // 20 cm in scaled-integer space (NormalizerStage.Scale = 100_000)
    private const long FlatAreaThreshold = 20L * 100_000;
    // A box is "flat" for an area if its minimum dimension ≤ area height × this ratio
    private const double FlatItemRatio = 0.7;

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
        var flatContexts = contexts
            .Where(c => c.Source.Size.Height <= FlatAreaThreshold)
            .OrderByDescending(c => c.Source.Size.Volume)
            .ToArray();

        var tallContexts = contexts
            .Where(c => c.Source.Size.Height > FlatAreaThreshold)
            .OrderByDescending(c => c.Source.Size.Volume)
            .ToArray();

        var organised = new List<OrganizedArea>(contexts.Count);
        var remaining = new List<Box>(sortedBoxes);

        // Phase 1 — flat areas receive only genuinely flat items
        foreach (var ctx in flatContexts)
        {
            long flatThreshold = (long)(ctx.Source.Size.Height * FlatItemRatio);
            var flatItems = remaining.Where(b => b.Size.MinDimension <= flatThreshold).ToList();

            var slicerResult = _slicer.Pack(flatItems, ctx, minSupportRatio);
            var compacted = _compactor.Compact(slicerResult.Placed, ctx, minSupportRatio);
            organised.Add(new OrganizedArea(
                ctx.Source, compacted,
                GeometryFunctions.ComputeFixedSize(compacted),
                Unplaced: false));

            // Remove placed items from the remaining pool; unfitted flat items
            // re-enter the pool so they can fall back to phase-2 areas.
            var placedIds = slicerResult.Placed.Select(p => p.Source.Id).ToHashSet();
            remaining = remaining.Where(b => !placedIds.Contains(b.Id)).ToList();
        }

        // Phase 2 — tall areas, FFD with all remaining items
        foreach (var ctx in tallContexts)
        {
            var slicerResult = _slicer.Pack(remaining, ctx, minSupportRatio);
            var compacted = _compactor.Compact(slicerResult.Placed, ctx, minSupportRatio);
            organised.Add(new OrganizedArea(
                ctx.Source, compacted,
                GeometryFunctions.ComputeFixedSize(compacted),
                Unplaced: false));
            remaining = slicerResult.Unfitted.ToList();
        }

        return new AreaSelectorResult(organised, remaining);
    }
}

public sealed record AreaSelectorResult(IReadOnlyList<OrganizedArea> Areas, IReadOnlyList<Box> Unfitted);
