using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Domain.Entities;

/// <summary>
/// A box committed to a position with a chosen rotation. RotatedSize already
/// reflects the rotation, so consumers do not need to re-apply the swap.
/// </summary>
public sealed record PlacedBox(
    Box Source,
    Position Position,
    Rotation Rotation,
    Measurements RotatedSize)
{
    public Aabb Aabb => Aabb.FromPositionAndSize(Position, RotatedSize);
}
