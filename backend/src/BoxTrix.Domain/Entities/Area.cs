using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Domain.Entities;

/// <summary>
/// Storage area. <see cref="AccessCorner"/> selects the placement origin;
/// <see cref="ExitCorridor"/> marks a forbidden AABB so the algorithm never
/// blocks an access path. <see cref="MaxStackHeight"/> caps how high boxes
/// can be stacked (in scaled units).
/// </summary>
public sealed record Area(
    string Id,
    string? Name,
    string? Detail,
    Measurements Size,
    Position Position,
    Corner AccessCorner,
    ExitCorridor? ExitCorridor,
    long? MaxStackHeight);
