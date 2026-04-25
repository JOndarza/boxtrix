using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Application.Pipeline;

/// <summary>
/// Decimal-space output ready for the API to map back to its DTO.
/// </summary>
public sealed record PipelineResponse(
    string Id,
    string? Name,
    IReadOnlyList<ResponseArea> Areas);

public sealed record ResponseArea(
    string Id,
    string? Name,
    string? Detail,
    DecimalMeasurements Size,
    DecimalPosition Position,
    DecimalMeasurements FixedSize,
    bool Unplaced,
    IReadOnlyList<ResponseBox> Boxes);

public sealed record ResponseBox(
    string Id,
    string? Name,
    string? Detail,
    DecimalPosition Position,
    Rotation Rotation,
    DecimalMeasurements RotatedSize);
