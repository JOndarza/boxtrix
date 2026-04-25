using BoxTrix.Application.Pipeline;
using BoxTrix.Application.Pipeline.Stages;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Application.Tests.Stages;

public sealed class DenormalizerStageTests
{
    private readonly DenormalizerStage _denormalizer = new();

    [Theory]
    [InlineData(Corner.BottomFrontLeft,  100, 0,   0)]   // no flip
    [InlineData(Corner.BottomFrontRight, 100, 80,  0)]   // X flip: 100 - 0 - 20 = 80
    [InlineData(Corner.BottomBackLeft,   100, 0,   80)]  // Z flip
    [InlineData(Corner.BottomBackRight,  100, 80,  80)]  // both flips
    public void Per_corner_flip_anchors_box_to_chosen_corner(Corner corner, long areaSide, long expectedX, long expectedZ)
    {
        var area = new Area("a", "Main", null,
            new Measurements(Scaled(areaSide), Scaled(areaSide), Scaled(areaSide)),
            new Position(0, 0, 0),
            corner, ExitCorridor: null, MaxStackHeight: null);

        var box = new Box("b", null, null, new Measurements(Scaled(20), Scaled(10), Scaled(20)), Weight: null);
        var placed = new PlacedBox(box, new Position(0, 0, 0), Rotation.WHD, box.Size);

        var organised = new OrganizedArea(area, [placed], new Measurements(Scaled(20), Scaled(10), Scaled(20)), Unplaced: false);
        var ctx = AreaContext.FromArea(area, defaultMaxStackHeight: area.Size.Height);
        var contexts = new Dictionary<string, AreaContext> { [area.Id] = ctx };

        var response = _denormalizer.Denormalize("test", null, [organised], contexts);

        var result = response.Areas.Single().Boxes.Single();
        result.Position.X.Should().Be(expectedX);
        result.Position.Z.Should().Be(expectedZ);
    }

    [Fact]
    public void Different_corners_per_area_are_handled_independently()
    {
        var leftArea = new Area("L", null, null,
            new Measurements(Scaled(100), Scaled(50), Scaled(50)), new Position(0, 0, 0),
            Corner.BottomFrontLeft, null, null);
        var rightArea = new Area("R", null, null,
            new Measurements(Scaled(100), Scaled(50), Scaled(50)), new Position(0, 0, 0),
            Corner.BottomFrontRight, null, null);

        var box = new Box("b", null, null, new Measurements(Scaled(10), Scaled(10), Scaled(10)), Weight: null);
        var placed = new PlacedBox(box, new Position(0, 0, 0), Rotation.WHD, box.Size);

        var leftOrganised  = new OrganizedArea(leftArea,  [placed], new Measurements(Scaled(10), Scaled(10), Scaled(10)), false);
        var rightOrganised = new OrganizedArea(rightArea, [placed], new Measurements(Scaled(10), Scaled(10), Scaled(10)), false);

        var contexts = new Dictionary<string, AreaContext>
        {
            [leftArea.Id]  = AreaContext.FromArea(leftArea,  leftArea.Size.Height),
            [rightArea.Id] = AreaContext.FromArea(rightArea, rightArea.Size.Height),
        };

        var response = _denormalizer.Denormalize("test", null, [leftOrganised, rightOrganised], contexts);

        response.Areas[0].Boxes.Single().Position.X.Should().Be(0);
        response.Areas[1].Boxes.Single().Position.X.Should().Be(90, "right corner: 100 - 0 - 10 = 90");
    }

    [Fact]
    public void Unplaced_flag_propagates_through_denormalization()
    {
        var area = new Area("UNFITTED", "UNFITTED", null,
            new Measurements(Scaled(50), Scaled(50), Scaled(50)),
            new Position(0, 0, 0),
            Corner.BottomFrontLeft, null, null);

        var organised = new OrganizedArea(area, [], new Measurements(0, 0, 0), Unplaced: true);

        var response = _denormalizer.Denormalize("test", null, [organised], new Dictionary<string, AreaContext>());

        response.Areas.Single().Unplaced.Should().BeTrue();
    }

    private static long Scaled(long userValue) => userValue * NormalizerStage.Scale;
}
