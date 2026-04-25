using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [e] Owns the per-area layer stack. For each box: tries existing layers in
/// bottom-up order; if none fit, opens a new layer above the current top
/// (provided the cap allows it). Returns the boxes that could not be placed.
/// </summary>
public sealed class LayerSlicerStage : IPipelineStage
{
    private readonly RotationOptimizerStage _rotations;
    private readonly PositionFinderStage _finder;

    public LayerSlicerStage(RotationOptimizerStage rotations, PositionFinderStage finder)
    {
        _rotations = rotations;
        _finder = finder;
    }

    public LayerSlicerResult Pack(
        IReadOnlyList<Box> boxes,
        AreaContext context,
        double minSupportRatio)
    {
        var seeds = SeedPointsAroundForbidden(context, yBase: 0);
        var layers = new List<Layer> { new(yBase: 0, seedPoints: seeds) };
        var allPlaced = new List<PlacedBox>();
        var unfitted = new List<Box>();

        foreach (var box in boxes)
        {
            if (TryPlaceInLayers(box, layers, context, allPlaced, minSupportRatio))
            {
                continue;
            }

            long topY = layers[^1].YTop;
            if (topY >= context.MaxStackHeight)
            {
                unfitted.Add(box);
                continue;
            }

            var newLayer = new Layer(yBase: topY, seedPoints: SeedPointsAroundForbidden(context, topY));
            layers.Add(newLayer);

            if (!TryPlaceInLayers(box, [newLayer], context, allPlaced, minSupportRatio))
            {
                unfitted.Add(box);
            }
        }

        return new LayerSlicerResult(layers, allPlaced, unfitted);
    }

    private bool TryPlaceInLayers(
        Box box,
        IReadOnlyList<Layer> layers,
        AreaContext context,
        List<PlacedBox> allPlaced,
        double minSupportRatio)
    {
        // Minimum dimension of the box across all six rotations — the smallest
        // headroom any rotation could ever need.
        long minBoxHeight = box.Size.MinDimension;

        foreach (var layer in layers)
        {
            long heightCap = context.MaxStackHeight - layer.YBase;

            // Skip layer if even the flattest rotation cannot fit height-wise,
            // or if the layer has no extreme points to try.
            if (heightCap <= 0 || heightCap < minBoxHeight || layer.ExtremePoints.Count == 0)
                continue;

            foreach (var rotated in _rotations.Candidates(box, heightCap))
            {
                var placed = _finder.TryPlace(rotated, layer, context, allPlaced, minSupportRatio);
                if (placed is not null)
                {
                    allPlaced.Add(placed);
                    return true;
                }
            }
        }
        return false;
    }

    /// <summary>
    /// When forbidden regions cover the canonical origin, the default EP at
    /// (0, yBase, 0) is unreachable. Seed extra EPs at the +x and +z exit
    /// corners of every forbidden AABB so the search has somewhere to start.
    /// </summary>
    private static IReadOnlyList<Domain.ValueObjects.Position> SeedPointsAroundForbidden(AreaContext context, long yBase)
    {
        var seeds = new List<Domain.ValueObjects.Position>();
        foreach (var f in context.Forbidden)
        {
            seeds.Add(new Domain.ValueObjects.Position(f.Max.X, yBase, 0));
            seeds.Add(new Domain.ValueObjects.Position(0, yBase, f.Max.Z));
            seeds.Add(new Domain.ValueObjects.Position(f.Max.X, yBase, f.Max.Z));
        }
        return seeds;
    }
}

public sealed record LayerSlicerResult(
    IReadOnlyList<Layer> Layers,
    IReadOnlyList<PlacedBox> Placed,
    IReadOnlyList<Box> Unfitted);
