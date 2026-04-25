using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;

namespace BoxTrix.Application.Pipeline;

/// <summary>
/// Scaled-integer view of the request used by stages [b..k]. Holds the
/// original decimal positions of each area so the Denormalizer can return
/// boxes in user coordinate space without needing the original DTO.
/// </summary>
public sealed record NormalizedRequest(
    string Id,
    string? Name,
    IReadOnlyList<Area> Areas,
    IReadOnlyList<Box> Boxes,
    NormalizedOptions Options);

public sealed record NormalizedOptions(
    Units Units,
    double MinSupportRatio,
    long Scale);
