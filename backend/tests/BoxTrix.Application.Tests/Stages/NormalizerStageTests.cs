using BoxTrix.Application.Pipeline;
using BoxTrix.Application.Pipeline.Stages;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Application.Tests.Stages;

public sealed class NormalizerStageTests
{
    private readonly NormalizerStage _normalizer = new();

    [Fact]
    public void Throws_when_areas_collection_is_empty()
    {
        var request = MakeRequest(Array.Empty<RequestArea>(), [Box("b")]);

        var act = () => _normalizer.Normalize(request);

        act.Should().Throw<ArgumentException>().WithMessage("*at least one area*");
    }

    [Fact]
    public void Throws_when_area_has_non_positive_dimensions()
    {
        var bad = new RequestArea(
            "a", null, null,
            new DecimalMeasurements(0, 10, 10),
            new DecimalPosition(0, 0, 0),
            Corner.BottomFrontLeft,
            ExitCorridor: null,
            MaxStackHeight: null);

        var act = () => _normalizer.Normalize(MakeRequest([bad], [Box("b")]));

        act.Should().Throw<ArgumentException>().WithMessage("*non-positive*");
    }

    [Fact]
    public void Throws_when_box_has_non_positive_dimensions()
    {
        var bad = new RequestBox("b", null, null, new DecimalMeasurements(10, -1, 10), Weight: null);

        var act = () => _normalizer.Normalize(MakeRequest([Area("a")], [bad]));

        act.Should().Throw<ArgumentException>().WithMessage("*non-positive*");
    }

    [Fact]
    public void Scales_dimensions_by_10_to_the_5()
    {
        var request = MakeRequest(
            [new RequestArea("a", null, null, new DecimalMeasurements(1m, 1m, 1m), new DecimalPosition(0, 0, 0), Corner.BottomFrontLeft, null, null)],
            [new RequestBox("b", null, null, new DecimalMeasurements(0.5m, 0.25m, 0.125m), null)]);

        var normalized = _normalizer.Normalize(request);

        normalized.Areas[0].Size.Should().Be(new Measurements(100_000, 100_000, 100_000));
        normalized.Boxes[0].Size.Should().Be(new Measurements(50_000, 25_000, 12_500));
    }

    [Fact]
    public void Preserves_null_weight_so_sorter_can_fallback_to_volume()
    {
        var request = MakeRequest([Area("a")], [new RequestBox("b", null, null, new DecimalMeasurements(1, 1, 1), Weight: null)]);

        var normalized = _normalizer.Normalize(request);

        normalized.Boxes[0].Weight.Should().BeNull();
    }

    [Fact]
    public void Roundtrip_position_and_measurements_is_lossless_for_5_decimal_inputs()
    {
        var pos = new DecimalPosition(12.34567m, 0.00001m, 999.99999m);
        var size = new DecimalMeasurements(1.23456m, 7.89012m, 0.00010m);

        var scaledPos = NormalizerStage.ScalePosition(pos);
        var scaledSize = NormalizerStage.ScaleMeasurements(size);

        NormalizerStage.UnscalePosition(scaledPos).Should().Be(pos);
        NormalizerStage.UnscaleMeasurements(scaledSize).Should().Be(size);
    }

    [Fact]
    public void Carries_max_stack_height_from_area_when_present()
    {
        var area = new RequestArea(
            "a", null, null,
            new DecimalMeasurements(100, 100, 100),
            new DecimalPosition(0, 0, 0),
            Corner.BottomFrontLeft,
            ExitCorridor: null,
            MaxStackHeight: 30m);

        var normalized = _normalizer.Normalize(MakeRequest([area], [Box("b")]));

        normalized.Areas[0].MaxStackHeight.Should().Be(3_000_000);
    }

    private static PipelineRequest MakeRequest(IReadOnlyList<RequestArea> areas, IReadOnlyList<RequestBox> boxes) =>
        new("test", null, areas, boxes, new PackingOptions(Units.Cm, Stackable: true, MinSupportRatio: 0.7));

    private static RequestArea Area(string id) =>
        new(id, null, null, new DecimalMeasurements(10, 10, 10), new DecimalPosition(0, 0, 0), Corner.BottomFrontLeft, null, null);

    private static RequestBox Box(string id) =>
        new(id, null, null, new DecimalMeasurements(1, 1, 1), Weight: null);
}
