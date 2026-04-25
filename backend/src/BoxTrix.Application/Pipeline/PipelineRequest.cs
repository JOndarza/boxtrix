using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Application.Pipeline;

/// <summary>
/// Raw, decimal-based input the API hands to the pipeline. Every stage from
/// NormalizerStage onward works with the scaled <see cref="NormalizedRequest"/>.
/// </summary>
public sealed record PipelineRequest(
    string Id,
    string? Name,
    IReadOnlyList<RequestArea> Areas,
    IReadOnlyList<RequestBox> Boxes,
    PackingOptions Options);

public sealed record RequestArea(
    string Id,
    string? Name,
    string? Detail,
    DecimalMeasurements Size,
    DecimalPosition Position,
    Corner AccessCorner,
    RequestExitCorridor? ExitCorridor,
    decimal? MaxStackHeight);

public sealed record RequestExitCorridor(DecimalPosition Origin, DecimalMeasurements Size);

public sealed record RequestBox(
    string Id,
    string? Name,
    string? Detail,
    DecimalMeasurements Size,
    double? Weight);

public sealed record PackingOptions(
    Units Units,
    bool Stackable,
    double MinSupportRatio);
