namespace BoxTrix.Api.Dtos;

public sealed record AreaImportResultDto(
    string Name,
    decimal Width,
    decimal Depth,
    decimal Height);
