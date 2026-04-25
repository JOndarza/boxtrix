using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Domain.Entities;

/// <summary>
/// Input box. Dimensions are scaled-integer (×10^5). Weight is dimensionless;
/// when null the sorter falls back to volume.
/// </summary>
public sealed record Box(
    string Id,
    string? Name,
    string? Detail,
    Measurements Size,
    double? Weight)
{
    /// <summary>Sort key for bottom-up placement (heaviest/largest first).</summary>
    public double GravityKey => (Weight ?? 1.0) * Size.Volume;
}
