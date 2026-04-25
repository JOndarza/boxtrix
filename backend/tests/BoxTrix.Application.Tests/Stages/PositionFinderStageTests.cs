using BoxTrix.Application.Pipeline;
using BoxTrix.Application.Pipeline.Stages;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Application.Tests.Stages;

public sealed class PositionFinderStageTests
{
    private readonly PositionFinderStage _finder;

    public PositionFinderStageTests()
    {
        _finder = new PositionFinderStage(new StabilityValidatorStage());
    }

    private static AreaContext BasicCtx(long size = 100)
    {
        var area = new Area("a", null, null,
            new Measurements(size, size, size),
            Position.Origin,
            Corner.BottomFrontLeft,
            ExitCorridor: null,
            MaxStackHeight: null);
        return AreaContext.FromArea(area, defaultMaxStackHeight: size);
    }

    private static RotatedBox MakeRotated(long w, long h, long d)
    {
        var size = new Measurements(w, h, d);
        var box = new Box("b", null, null, size, Weight: 1.0);
        return new RotatedBox(box, Rotation.WHD, size);
    }

    [Fact]
    public void Places_at_canonical_origin_when_layer_is_empty()
    {
        var layer = new Layer(yBase: 0);
        var rotated = MakeRotated(10, 10, 10);

        var placed = _finder.TryPlace(rotated, layer, BasicCtx(), areaPlaced: [], minSupportRatio: 0);

        placed.Should().NotBeNull();
        placed!.Position.Should().Be(new Position(0, 0, 0));
    }

    [Fact]
    public void Generates_three_extreme_points_after_placement()
    {
        var layer = new Layer(yBase: 0);
        var rotated = MakeRotated(10, 10, 10);

        _finder.TryPlace(rotated, layer, BasicCtx(), areaPlaced: [], minSupportRatio: 0);

        layer.ExtremePoints.Should().Contain(new Position(10, 0, 0));
        layer.ExtremePoints.Should().Contain(new Position(0, 0, 10));
        layer.ExtremePoints.Should().Contain(new Position(0, 10, 0));
    }

    [Fact]
    public void Picks_lex_smallest_y_z_x_extreme_point_so_floor_fills_first()
    {
        var layer = new Layer(yBase: 0);
        // After placing one box at origin, EPs are: (10,0,0), (0,0,10), (0,10,0).
        _finder.TryPlace(MakeRotated(10, 10, 10), layer, BasicCtx(), areaPlaced: [], minSupportRatio: 0);

        // Lex-smallest by (y, z, x) is (10, 0, 0) — same floor (y=0, z=0), spread along +x.
        // (0, 10, 0) loses on y, (0, 0, 10) loses on z.
        var rotated2 = MakeRotated(5, 5, 5);
        var placed2 = _finder.TryPlace(rotated2, layer, BasicCtx(), [PlacedBoxAt(0, 0, 0, 10, 10, 10)], minSupportRatio: 0);

        placed2.Should().NotBeNull();
        placed2!.Position.Should().Be(new Position(10, 0, 0));
    }

    [Fact]
    public void Returns_null_when_no_extreme_point_satisfies_constraints()
    {
        var layer = new Layer(yBase: 0);
        var huge = MakeRotated(200, 200, 200);

        var placed = _finder.TryPlace(huge, layer, BasicCtx(size: 100), areaPlaced: [], minSupportRatio: 0);

        placed.Should().BeNull();
    }

    [Fact]
    public void Skips_extreme_points_that_collide_with_already_placed_boxes()
    {
        var layer = new Layer(yBase: 0);
        var anchor = PlacedBoxAt(0, 0, 0, 10, 10, 10);
        layer.Placed.Add(anchor);
        layer.ExtremePoints.Clear();
        layer.ExtremePoints.Add(new Position(0, 0, 0));   // sits inside anchor — must be skipped
        layer.ExtremePoints.Add(new Position(10, 0, 0));  // valid

        var placed = _finder.TryPlace(MakeRotated(5, 5, 5), layer, BasicCtx(), [anchor], minSupportRatio: 0);

        placed.Should().NotBeNull();
        placed!.Position.X.Should().BeGreaterThanOrEqualTo(10);
    }

    [Fact]
    public void Skips_extreme_points_inside_forbidden_regions()
    {
        var corridor = new ExitCorridor(new Position(0, 0, 0), new Measurements(50, 100, 50));
        var area = new Area("a", null, null, new Measurements(100, 100, 100), Position.Origin,
            Corner.BottomFrontLeft, corridor, MaxStackHeight: null);
        var ctx = AreaContext.FromArea(area, defaultMaxStackHeight: 100);

        var layer = new Layer(yBase: 0);
        layer.ExtremePoints.Add(new Position(50, 0, 50));   // valid corner of corridor

        var placed = _finder.TryPlace(MakeRotated(10, 10, 10), layer, ctx, areaPlaced: [], minSupportRatio: 0);

        placed.Should().NotBeNull();
        bool insideCorridor = placed!.Position.X < 50 && placed.Position.Z < 50;
        insideCorridor.Should().BeFalse();
    }

    private static PlacedBox PlacedBoxAt(long x, long y, long z, long w, long h, long d)
    {
        var size = new Measurements(w, h, d);
        var box = new Box($"placed-{x}-{y}-{z}", null, null, size, Weight: 1.0);
        return new PlacedBox(box, new Position(x, y, z), Rotation.WHD, size);
    }
}
