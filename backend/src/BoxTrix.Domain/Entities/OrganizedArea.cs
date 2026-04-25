using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Domain.Entities;

/// <summary>
/// Result for a single area after the pipeline runs. <see cref="FixedSize"/>
/// is the AABB of all placed boxes (used by the frontend for the inner
/// wireframe). <see cref="Unplaced"/> flags the synthetic UNFITTED area.
/// </summary>
public sealed record OrganizedArea(
    Area Source,
    IReadOnlyList<PlacedBox> Boxes,
    Measurements FixedSize,
    bool Unplaced);
