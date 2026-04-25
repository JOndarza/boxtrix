using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.ValueObjects;
using Microsoft.Extensions.Logging;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [g] Extreme Points heuristic (Crainic, Perboli, Tadei 2008). Maintains a
/// frontier of candidate positions; each placement spawns up to three new EPs
/// at the +x, +y, +z faces of the placed box. Picks the lex-smallest EP by
/// (y, z, x) so the floor fills first (gravity), then back-to-front, then
/// left-to-right. Skips EPs that violate area bounds, overlap a placed box
/// or forbidden region, exceed the height cap, or fail stability.
/// </summary>
public sealed class PositionFinderStage : IPipelineStage
{
    private readonly StabilityValidatorStage _stability;
    private readonly ILogger<PositionFinderStage> _logger;

    public PositionFinderStage(StabilityValidatorStage stability, ILogger<PositionFinderStage> logger)
    {
        _stability = stability;
        _logger = logger;
    }

    public PlacedBox? TryPlace(
        RotatedBox candidate,
        Layer layer,
        AreaContext context,
        IReadOnlyList<PlacedBox> areaPlaced,
        double minSupportRatio)
    {
        var orderedEps = layer.ExtremePoints
            .OrderBy(p => p.Y)
            .ThenBy(p => p.Z)
            .ThenBy(p => p.X)
            .ToArray();

        foreach (var ep in orderedEps)
        {
            var placement = TryAt(ep, candidate, context, areaPlaced, minSupportRatio);
            if (placement is null)
            {
                continue;
            }

            CommitPlacement(layer, ep, placement);
            _logger.LogDebug("Placed {Box} at ({X},{Y},{Z}) rotation {Rotation}",
                candidate.Source.Id, ep.X, ep.Y, ep.Z, candidate.Rotation);
            return placement;
        }

        _logger.LogDebug("No valid position found for {Box} ({W}x{H}x{D})",
            candidate.Source.Id, candidate.Size.Width, candidate.Size.Height, candidate.Size.Depth);
        return null;
    }

    private PlacedBox? TryAt(
        Position ep,
        RotatedBox candidate,
        AreaContext context,
        IReadOnlyList<PlacedBox> areaPlaced,
        double minSupportRatio)
    {
        var aabb = Aabb.FromPositionAndSize(ep, candidate.Size);
        var areaAabb = Aabb.FromPositionAndSize(Position.Origin, context.Source.Size);

        if (!areaAabb.Contains(aabb))
        {
            return null;
        }
        if (aabb.Max.Y > context.MaxStackHeight)
        {
            return null;
        }
        foreach (var f in context.Forbidden)
        {
            if (aabb.Overlaps(f))
            {
                return null;
            }
        }
        foreach (var p in areaPlaced)
        {
            if (aabb.Overlaps(p.Aabb))
            {
                return null;
            }
        }
        if (!_stability.IsStable(aabb, areaPlaced, minSupportRatio))
        {
            return null;
        }

        return new PlacedBox(candidate.Source, ep, candidate.Rotation, candidate.Size);
    }

    private static void CommitPlacement(Layer layer, Position usedEp, PlacedBox placed)
    {
        layer.ExtremePoints.Remove(usedEp);
        layer.Placed.Add(placed);

        long w = placed.RotatedSize.Width;
        long h = placed.RotatedSize.Height;
        long d = placed.RotatedSize.Depth;

        layer.ExtremePoints.Add(new Position(placed.Position.X + w, placed.Position.Y, placed.Position.Z));
        layer.ExtremePoints.Add(new Position(placed.Position.X, placed.Position.Y, placed.Position.Z + d));
        layer.ExtremePoints.Add(new Position(placed.Position.X, placed.Position.Y + h, placed.Position.Z));
    }
}
