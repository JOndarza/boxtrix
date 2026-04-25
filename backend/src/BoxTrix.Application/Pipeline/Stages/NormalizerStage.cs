using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [a] Validates the request and scales every decimal dimension to a long by
/// multiplying by 10^5. Boxes without explicit weight keep weight = null;
/// the BoxSorter falls back to volume in that case.
/// </summary>
public sealed class NormalizerStage : IPipelineStage
{
    public const long Scale = 100_000L;

    public NormalizedRequest Normalize(PipelineRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (request.Areas.Count == 0)
        {
            throw new ArgumentException("Request must contain at least one area.", nameof(request));
        }

        var areas = new List<Area>(request.Areas.Count);
        foreach (var a in request.Areas)
        {
            var size = ScaleMeasurements(a.Size);
            if (size.Width <= 0 || size.Height <= 0 || size.Depth <= 0)
            {
                throw new ArgumentException($"Area '{a.Id}' has non-positive dimensions.", nameof(request));
            }

            var corridor = a.ExitCorridor is null
                ? null
                : new ExitCorridor(ScalePosition(a.ExitCorridor.Origin), ScaleMeasurements(a.ExitCorridor.Size));

            long? maxStack = a.MaxStackHeight is null ? null : ToScaled(a.MaxStackHeight.Value);

            areas.Add(new Area(
                a.Id,
                a.Name,
                a.Detail,
                size,
                ScalePosition(a.Position),
                a.AccessCorner,
                corridor,
                maxStack));
        }

        var boxes = new List<Box>(request.Boxes.Count);
        foreach (var b in request.Boxes)
        {
            var size = ScaleMeasurements(b.Size);
            if (size.Width <= 0 || size.Height <= 0 || size.Depth <= 0)
            {
                throw new ArgumentException($"Box '{b.Id}' has non-positive dimensions.", nameof(request));
            }
            boxes.Add(new Box(b.Id, b.Name, b.Detail, size, b.Weight));
        }

        var options = new NormalizedOptions(
            request.Options.Units,
            request.Options.Stackable,
            request.Options.MinSupportRatio,
            Scale);

        return new NormalizedRequest(request.Id, request.Name, areas, boxes, options);
    }

    public static long ToScaled(decimal value) => (long)(value * Scale);

    public static decimal FromScaled(long value) => (decimal)value / Scale;

    public static Measurements ScaleMeasurements(DecimalMeasurements m) =>
        new(ToScaled(m.Width), ToScaled(m.Height), ToScaled(m.Depth));

    public static Position ScalePosition(DecimalPosition p) =>
        new(ToScaled(p.X), ToScaled(p.Y), ToScaled(p.Z));

    public static DecimalMeasurements UnscaleMeasurements(Measurements m) =>
        new(FromScaled(m.Width), FromScaled(m.Height), FromScaled(m.Depth));

    public static DecimalPosition UnscalePosition(Position p) =>
        new(FromScaled(p.X), FromScaled(p.Y), FromScaled(p.Z));
}
