using BoxTrix.Application.Pipeline;
using BoxTrix.Application.Pipeline.Stages;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace BoxTrix.Application.Tests.Stages;

public sealed class LayerSlicerStageTests
{
    private readonly LayerSlicerStage _slicer;

    public LayerSlicerStageTests()
    {
        var stability = new StabilityValidatorStage();
        var finder = new PositionFinderStage(stability, NullLogger<PositionFinderStage>.Instance);
        _slicer = new LayerSlicerStage(new RotationOptimizerStage(), finder);
    }

    private static AreaContext Ctx(Measurements size, ExitCorridor? corridor = null, long? cap = null)
    {
        var area = new Area("a", null, null, size, Position.Origin, Corner.BottomFrontLeft, corridor, cap);
        return AreaContext.FromArea(area, defaultMaxStackHeight: size.Height);
    }

    [Fact]
    public void Single_box_lands_at_origin()
    {
        var ctx = Ctx(new Measurements(50, 50, 50));
        var box = new Box("b", null, null, new Measurements(10, 10, 10), Weight: 1.0);

        var result = _slicer.Pack([box], ctx, minSupportRatio: 0);

        result.Placed.Should().ContainSingle();
        result.Placed[0].Position.Should().Be(new Position(0, 0, 0));
        result.Unfitted.Should().BeEmpty();
    }

    [Fact]
    public void Opens_a_new_layer_when_floor_runs_out()
    {
        // Floor is exactly 20×20; two 20×20×10 boxes flat on the floor occupy it fully,
        // a third 20×20×10 box must open a new layer at y=10.
        var ctx = Ctx(new Measurements(20, 50, 20));
        var make = (string id) => new Box(id, null, null, new Measurements(20, 10, 20), Weight: 1.0);

        var result = _slicer.Pack([make("a"), make("b"), make("c")], ctx, minSupportRatio: 0);

        result.Placed.Should().HaveCount(3);
        result.Placed.Select(p => p.Position.Y).Distinct().Should().HaveCountGreaterThan(1, "the third box forces a new layer above y=0");
    }

    [Fact]
    public void Boxes_that_cannot_fit_anywhere_become_unfitted()
    {
        var ctx = Ctx(new Measurements(10, 10, 10));
        var huge = new Box("big", null, null, new Measurements(50, 50, 50), Weight: 1.0);

        var result = _slicer.Pack([huge], ctx, minSupportRatio: 0);

        result.Placed.Should().BeEmpty();
        result.Unfitted.Should().ContainSingle().Which.Id.Should().Be("big");
    }

    [Fact]
    public void Honours_max_stack_height_cap()
    {
        var ctx = Ctx(new Measurements(10, 100, 10), cap: 15);
        var make = (string id) => new Box(id, null, null, new Measurements(10, 10, 10), Weight: 1.0);

        var result = _slicer.Pack([make("a"), make("b"), make("c")], ctx, minSupportRatio: 0);

        result.Placed.Should().ContainSingle("only one 10-high box fits under a 15-high cap");
        result.Unfitted.Should().HaveCount(2);
    }
}
