using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [k] Divides every scaled-integer dimension by 10^5 and applies the inverse
/// X/Z flip per area so that placed boxes land in the area's user-facing
/// coordinate system, anchored to the corner the user picked.
/// </summary>
public sealed class DenormalizerStage : IPipelineStage
{
    public PipelineResponse Denormalize(
        string id,
        string? name,
        IReadOnlyList<OrganizedArea> areas,
        IReadOnlyDictionary<string, AreaContext> contexts)
    {
        var responseAreas = new List<ResponseArea>(areas.Count);
        foreach (var organised in areas)
        {
            contexts.TryGetValue(organised.Source.Id, out var ctx);
            var bounds = organised.Source.Size;

            var boxes = new List<ResponseBox>(organised.Boxes.Count);
            foreach (var p in organised.Boxes)
            {
                var pos = p.Position;
                if (ctx is not null)
                {
                    pos = ApplyInverseFlip(pos, p.RotatedSize, bounds, ctx.FlipX, ctx.FlipZ);
                }

                boxes.Add(new ResponseBox(
                    p.Source.Id,
                    p.Source.Name,
                    p.Source.Detail,
                    NormalizerStage.UnscalePosition(pos),
                    p.Rotation,
                    NormalizerStage.UnscaleMeasurements(p.RotatedSize)));
            }

            responseAreas.Add(new ResponseArea(
                organised.Source.Id,
                organised.Source.Name,
                organised.Source.Detail,
                NormalizerStage.UnscaleMeasurements(organised.Source.Size),
                NormalizerStage.UnscalePosition(organised.Source.Position),
                NormalizerStage.UnscaleMeasurements(organised.FixedSize),
                organised.Unplaced,
                boxes));
        }

        return new PipelineResponse(id, name, responseAreas, ComputeStats(responseAreas));
    }

    private static PipelineStats ComputeStats(IReadOnlyList<ResponseArea> areas)
    {
        decimal availableVolume = 0m;
        decimal occupiedVolume = 0m;
        decimal unplacedVolume = 0m;
        int placedCount = 0;
        int unplacedCount = 0;

        foreach (var area in areas)
        {
            if (area.Unplaced)
            {
                unplacedCount += area.Boxes.Count;
                foreach (var box in area.Boxes)
                    unplacedVolume += box.RotatedSize.Width * box.RotatedSize.Height * box.RotatedSize.Depth;
            }
            else
            {
                availableVolume += area.Size.Width * area.Size.Height * area.Size.Depth;
                placedCount += area.Boxes.Count;
                foreach (var box in area.Boxes)
                    occupiedVolume += box.RotatedSize.Width * box.RotatedSize.Height * box.RotatedSize.Depth;
            }
        }

        var wastedVolume = availableVolume - occupiedVolume;
        var efficiencyPct = availableVolume > 0
            ? Math.Round(occupiedVolume / availableVolume * 100m, 1)
            : 0m;

        return new PipelineStats(availableVolume, occupiedVolume, unplacedVolume,
            wastedVolume, efficiencyPct, placedCount, unplacedCount);
    }

    private static Position ApplyInverseFlip(Position pos, Measurements size, Measurements bounds, bool flipX, bool flipZ)
    {
        long x = flipX ? bounds.Width - pos.X - size.Width : pos.X;
        long z = flipZ ? bounds.Depth - pos.Z - size.Depth : pos.Z;
        return new Position(x, pos.Y, z);
    }
}
