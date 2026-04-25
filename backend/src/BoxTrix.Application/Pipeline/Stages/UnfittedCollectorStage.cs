using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.Functions;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [j] When the area-selection pass leaves boxes unplaced, builds a synthetic
/// area large enough to host them all and packs them through a relaxed
/// pipeline (no exit corridor, no stack-height cap, no stability validation).
/// The synthetic area is flagged <c>Unplaced = true</c> so the frontend can
/// render it differently.
/// </summary>
public sealed class UnfittedCollectorStage : IPipelineStage
{
    public const string UnfittedAreaId = "UNFITTED";

    private readonly LayerSlicerStage _slicer;
    private readonly CompactorStage _compactor;

    public UnfittedCollectorStage(LayerSlicerStage slicer, CompactorStage compactor)
    {
        _slicer = slicer;
        _compactor = compactor;
    }

    public OrganizedArea? Collect(IReadOnlyList<Box> unfitted)
    {
        if (unfitted.Count == 0)
        {
            return null;
        }

        var size = ComputeContainerSize(unfitted);
        var area = new Area(
            UnfittedAreaId,
            UnfittedAreaId,
            "Boxes that did not fit in any declared area",
            size,
            Position.Origin,
            Corner.BottomFrontLeft,
            ExitCorridor: null,
            MaxStackHeight: null);

        var ctx = AreaContext.FromArea(area, defaultMaxStackHeight: size.Height);
        var slicerResult = _slicer.Pack(unfitted, ctx, minSupportRatio: 0);
        var compacted = _compactor.Compact(slicerResult.Placed, ctx, minSupportRatio: 0);
        var fixedSize = GeometryFunctions.ComputeFixedSize(compacted);

        return new OrganizedArea(area, compacted, fixedSize, Unplaced: true);
    }

    private static Measurements ComputeContainerSize(IReadOnlyList<Box> boxes)
    {
        double totalVolume = 0;
        long maxW = 0;
        long maxH = 0;
        long maxD = 0;
        foreach (var b in boxes)
        {
            totalVolume += b.Size.Volume;
            maxW = Math.Max(maxW, b.Size.MaxDimension);
            maxH = Math.Max(maxH, b.Size.MaxDimension);
            maxD = Math.Max(maxD, b.Size.MaxDimension);
        }

        long side = (long)Math.Ceiling(Math.Cbrt(totalVolume) * 1.4);   // headroom for waste
        return new Measurements(
            Math.Max(side, maxW),
            Math.Max(side, maxH),
            Math.Max(side, maxD));
    }
}
