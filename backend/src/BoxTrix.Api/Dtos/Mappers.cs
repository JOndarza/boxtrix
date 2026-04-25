using BoxTrix.Application.Pipeline;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Api.Dtos;

/// <summary>
/// Pure functions translating wire DTOs to the pipeline's internal records
/// and back. Keeps <c>BoxTrix.Application</c> agnostic of the HTTP layer.
/// </summary>
public static class Mappers
{
    public const double DefaultMinSupportRatio = 0.7;

    public static PipelineRequest ToPipelineRequest(InputDto dto)
    {
        var options = new PackingOptions(
            Units: dto.Constraints?.Units ?? Units.Cm,
            Stackable: dto.Constraints?.Stackable ?? true,
            MinSupportRatio: dto.Constraints?.MinSupportRatio ?? DefaultMinSupportRatio);

        var areas = dto.Areas.Select(a => new RequestArea(
            a.Id,
            a.Name,
            a.Detail,
            new DecimalMeasurements(a.Width, a.Height, a.Depth),
            new DecimalPosition(a.X, a.Y, a.Z),
            a.AccessCorner ?? Corner.BottomFrontLeft,
            a.ExitCorridor is null ? null : new RequestExitCorridor(
                new DecimalPosition(a.ExitCorridor.X, a.ExitCorridor.Y, a.ExitCorridor.Z),
                new DecimalMeasurements(a.ExitCorridor.Width, a.ExitCorridor.Height, a.ExitCorridor.Depth)),
            a.MaxStackHeight ?? dto.Constraints?.MaxStackHeight))
            .ToArray();

        var boxes = dto.Boxes.Select(b => new RequestBox(
            b.Id,
            b.Name,
            b.Detail,
            new DecimalMeasurements(b.Width, b.Height, b.Depth),
            b.Weight))
            .ToArray();

        return new PipelineRequest(dto.Id, dto.Name, areas, boxes, options);
    }

    public static OutputDto FromPipelineResponse(PipelineResponse response, string? detail) =>
        new(
            response.Id,
            response.Name,
            detail,
            response.Areas.Select(a => new OrganizedAreaDto(
                a.Id,
                a.Name,
                a.Detail,
                a.Size.Width, a.Size.Height, a.Size.Depth,
                a.Position.X, a.Position.Y, a.Position.Z,
                a.Unplaced,
                new MeasurementsDto(a.FixedSize.Width, a.FixedSize.Height, a.FixedSize.Depth),
                a.Boxes.Select(b => new OrganizedBoxDto(
                    b.Id,
                    b.Name,
                    b.Detail,
                    new PositionDto(b.Position.X, b.Position.Y, b.Position.Z),
                    b.Rotation,
                    new MeasurementsDto(b.RotatedSize.Width, b.RotatedSize.Height, b.RotatedSize.Depth)))
                .ToArray()))
            .ToArray());
}
