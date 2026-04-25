using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.Functions;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [f] Yields the six rotations of a box ordered by stability: rotations with
/// a larger base (footprint) and smaller height come first, encouraging
/// bottom-heavy placement. The PositionFinder iterates them in order and
/// commits the first one that fits.
/// </summary>
public sealed class RotationOptimizerStage : IPipelineStage
{
    private static readonly Rotation[] AllRotations =
    {
        Rotation.WHD, Rotation.HWD, Rotation.HDW, Rotation.DHW, Rotation.DWH, Rotation.WDH,
    };

    public IEnumerable<RotatedBox> Candidates(Box box, long heightCap)
    {
        return AllRotations
            .Select(r => new RotatedBox(box, r, GeometryFunctions.Rotate(box.Size, r)))
            .Where(rb => rb.Size.Height <= heightCap)
            .OrderByDescending(rb => (double)rb.Size.Width * rb.Size.Depth)   // larger base = more stable
            .ThenBy(rb => rb.Size.Height);                                     // shorter = lower CoG
    }
}

public sealed record RotatedBox(Box Source, Rotation Rotation, Measurements Size);
