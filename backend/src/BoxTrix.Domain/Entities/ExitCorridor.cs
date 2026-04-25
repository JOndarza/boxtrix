using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Domain.Entities;

/// <summary>
/// Forbidden region within an area. Position is relative to the area's
/// declared origin (not the chosen corner — AreaPreprocessor handles that).
/// </summary>
public sealed record ExitCorridor(Position Origin, Measurements Size)
{
    public Aabb Aabb => Aabb.FromPositionAndSize(Origin, Size);
}
