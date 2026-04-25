using BoxTrix.Application.Pipeline;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Application.Tests.Stages;

public sealed class AreaPreprocessorStageTests
{
    private static Area MakeArea(Corner corner, ExitCorridor? corridor = null) =>
        new(
            "area-1",
            "Main",
            null,
            new Measurements(100, 50, 80),
            Position.Origin,
            corner,
            corridor,
            MaxStackHeight: null);

    [Theory]
    [InlineData(Corner.BottomFrontLeft, false, false)]
    [InlineData(Corner.BottomFrontRight, true, false)]
    [InlineData(Corner.BottomBackLeft, false, true)]
    [InlineData(Corner.BottomBackRight, true, true)]
    public void Corner_drives_axis_flips(Corner corner, bool expectedFlipX, bool expectedFlipZ)
    {
        var ctx = AreaContext.FromArea(MakeArea(corner), defaultMaxStackHeight: 50);

        ctx.FlipX.Should().Be(expectedFlipX);
        ctx.FlipZ.Should().Be(expectedFlipZ);
    }

    [Fact]
    public void Exit_corridor_is_flipped_into_canonical_space()
    {
        var corridor = new ExitCorridor(new Position(80, 0, 0), new Measurements(20, 50, 80));
        var ctx = AreaContext.FromArea(MakeArea(Corner.BottomFrontRight, corridor), defaultMaxStackHeight: 50);

        ctx.Forbidden.Should().HaveCount(1);
        ctx.Forbidden[0].Min.X.Should().Be(0, "right corner mirrors corridor at x=80..100 to x=0..20 canonical");
        ctx.Forbidden[0].Max.X.Should().Be(20);
    }

    [Fact]
    public void MaxStackHeight_defaults_to_area_height_when_unbounded()
    {
        var ctx = AreaContext.FromArea(MakeArea(Corner.BottomFrontLeft), defaultMaxStackHeight: 50);
        ctx.MaxStackHeight.Should().Be(50);
    }
}
