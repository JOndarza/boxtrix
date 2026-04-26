using BoxTrix.Domain.Enums;

namespace BoxTrix.Api.Dtos;

/// <summary>
/// Wire response. Mirrors the TypeScript IOutput interface; box positions are
/// already in user units and in the user's coordinate system (the pipeline
/// undoes the corner-driven flip on the way out).
/// </summary>
public sealed record StatsDto(
    decimal AvailableVolume,
    decimal OccupiedVolume,
    decimal UnplacedVolume,
    decimal WastedVolume,
    decimal EfficiencyPct,
    int PlacedCount,
    int UnplacedCount);

public sealed record OutputDto(
    string Id,
    string? Name,
    string? Detail,
    IReadOnlyList<OrganizedAreaDto> Areas,
    StatsDto Stats);

public sealed record OrganizedAreaDto(
    string Id,
    string? Name,
    string? Detail,
    decimal Width,
    decimal Height,
    decimal Depth,
    decimal X,
    decimal Y,
    decimal Z,
    bool Unplaced,
    MeasurementsDto FixedMeans,
    IReadOnlyList<OrganizedBoxDto> Boxes);

public sealed record OrganizedBoxDto(
    string Id,
    string? Name,
    string? Detail,
    PositionDto Position,
    Rotation Rotation,
    MeasurementsDto RotatedSize);

public sealed record MeasurementsDto(decimal Width, decimal Height, decimal Depth);

public sealed record PositionDto(decimal X, decimal Y, decimal Z);
