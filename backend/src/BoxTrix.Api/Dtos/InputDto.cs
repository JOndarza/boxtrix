using BoxTrix.Domain.Enums;

namespace BoxTrix.Api.Dtos;

/// <summary>
/// Wire shape sent by the Angular frontend. Mirrors the TypeScript IInput
/// interface (with the new accessCorner / exitCorridor / weight fields). All
/// dimensions are in user units (cm/in/m); the pipeline scales them.
/// </summary>
public sealed record InputDto(
    string Id,
    string? Name,
    string? Detail,
    IReadOnlyList<AreaDto> Areas,
    IReadOnlyList<BoxDto> Boxes,
    ConstraintsDto? Constraints);

public sealed record AreaDto(
    string Id,
    string? Name,
    string? Detail,
    decimal Width,
    decimal Height,
    decimal Depth,
    decimal X,
    decimal Y,
    decimal Z,
    Corner? AccessCorner,
    ExitCorridorDto? ExitCorridor,
    decimal? MaxStackHeight);

public sealed record ExitCorridorDto(
    decimal X,
    decimal Y,
    decimal Z,
    decimal Width,
    decimal Height,
    decimal Depth);

public sealed record BoxDto(
    string Id,
    string? Name,
    string? Detail,
    decimal Width,
    decimal Height,
    decimal Depth,
    double? Weight);

public sealed record ConstraintsDto(
    Units? Units,
    decimal? MaxStackHeight,
    double? MinSupportRatio);
