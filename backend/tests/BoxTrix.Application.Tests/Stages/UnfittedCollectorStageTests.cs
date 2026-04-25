using BoxTrix.Application.Pipeline.Stages;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Application.Tests.Stages;

public sealed class UnfittedCollectorStageTests
{
    private readonly UnfittedCollectorStage _collector;

    public UnfittedCollectorStageTests()
    {
        var stability = new StabilityValidatorStage();
        var finder = new PositionFinderStage(stability);
        var slicer = new LayerSlicerStage(new RotationOptimizerStage(), finder);
        var compactor = new CompactorStage(stability);
        _collector = new UnfittedCollectorStage(slicer, compactor);
    }

    [Fact]
    public void Returns_null_when_no_unfitted_boxes()
    {
        _collector.Collect([]).Should().BeNull();
    }

    [Fact]
    public void Marks_synthetic_area_as_unplaced()
    {
        var box = new Box("huge", null, null, new Measurements(50, 50, 50), Weight: 1.0);

        var area = _collector.Collect([box]);

        area.Should().NotBeNull();
        area!.Unplaced.Should().BeTrue();
        area.Source.Id.Should().Be(UnfittedCollectorStage.UnfittedAreaId);
    }

    [Fact]
    public void Synthetic_area_holds_every_unfitted_box()
    {
        var boxes = Enumerable.Range(0, 5)
            .Select(i => new Box($"b{i}", null, null, new Measurements(10, 10, 10), Weight: 1.0))
            .ToArray();

        var area = _collector.Collect(boxes);

        area!.Boxes.Should().HaveCount(5);
        area.Boxes.Select(b => b.Source.Id).Should().BeEquivalentTo(boxes.Select(b => b.Id));
    }

    [Fact]
    public void Synthetic_area_size_grows_with_total_volume()
    {
        var smallBoxes = new[] { new Box("s", null, null, new Measurements(5, 5, 5), null) };
        var largeBoxes = Enumerable.Range(0, 8)
            .Select(i => new Box($"l{i}", null, null, new Measurements(20, 20, 20), null))
            .ToArray();

        var smallArea = _collector.Collect(smallBoxes);
        var largeArea = _collector.Collect(largeBoxes);

        largeArea!.Source.Size.Volume.Should().BeGreaterThan(smallArea!.Source.Size.Volume);
    }
}
