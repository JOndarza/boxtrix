using BoxTrix.Application.Pipeline;
using BoxTrix.Application.Pipeline.Stages;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Application.Tests.Stages;

public sealed class CompactorStageTests
{
    private readonly CompactorStage _compactor;

    public CompactorStageTests()
    {
        _compactor = new CompactorStage(new StabilityValidatorStage());
    }

    [Fact]
    public void Pushes_floating_box_against_origin()
    {
        var area = new Area("a", null, null, new Measurements(100, 100, 100), Position.Origin,
            Corner.BottomFrontLeft, ExitCorridor: null, MaxStackHeight: null);
        var ctx = AreaContext.FromArea(area, defaultMaxStackHeight: 100);

        var box = new Box("b", null, null, new Measurements(10, 10, 10), Weight: 1.0);
        var placed = new PlacedBox(box, new Position(40, 0, 30), Rotation.WHD, box.Size);

        var compacted = _compactor.Compact([placed], ctx, minSupportRatio: 0);

        compacted[0].Position.Should().Be(new Position(0, 0, 0));
    }

    [Fact]
    public void Stops_when_neighbour_blocks_the_push()
    {
        var area = new Area("a", null, null, new Measurements(100, 100, 100), Position.Origin,
            Corner.BottomFrontLeft, ExitCorridor: null, MaxStackHeight: null);
        var ctx = AreaContext.FromArea(area, defaultMaxStackHeight: 100);

        var box = new Box("b", null, null, new Measurements(10, 10, 10), Weight: 1.0);
        var anchor   = new PlacedBox(box, new Position(0, 0, 0),  Rotation.WHD, box.Size);
        var floating = new PlacedBox(box, new Position(40, 0, 0), Rotation.WHD, box.Size);

        var compacted = _compactor.Compact([anchor, floating], ctx, minSupportRatio: 0);

        compacted.Should().HaveCount(2);
        compacted.Should().Contain(p => p.Position == new Position(0, 0, 0));
        compacted.Should().Contain(p => p.Position == new Position(10, 0, 0), "the second box ends up flush against the anchor");
    }

    [Fact]
    public void Respects_forbidden_regions_during_compaction()
    {
        var corridor = new ExitCorridor(new Position(0, 0, 0), new Measurements(20, 100, 100));
        var area = new Area("a", null, null, new Measurements(100, 100, 100), Position.Origin,
            Corner.BottomFrontLeft, corridor, MaxStackHeight: null);
        var ctx = AreaContext.FromArea(area, defaultMaxStackHeight: 100);

        var box = new Box("b", null, null, new Measurements(10, 10, 10), Weight: 1.0);
        var placed = new PlacedBox(box, new Position(50, 0, 0), Rotation.WHD, box.Size);

        var compacted = _compactor.Compact([placed], ctx, minSupportRatio: 0);

        compacted[0].Position.X.Should().BeGreaterThanOrEqualTo(20, "the corridor must remain clear");
    }
}
