using BoxTrix.Application;
using BoxTrix.Application.Pipeline;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BoxTrix.Application.Tests;

public sealed class PackingPipelineTests
{
    private readonly IPacker _packer;

    public PackingPipelineTests()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddBoxTrixApplication();
        _packer = services.BuildServiceProvider().GetRequiredService<IPacker>();
    }

    [Fact]
    public void Single_box_in_empty_area_is_placed_at_origin()
    {
        var request = new PipelineRequest(
            "test", null,
            [Area("a", 100, 100, 100, Corner.BottomFrontLeft)],
            [Box("b", 10, 10, 10, weight: 1.0)],
            Options());

        var response = _packer.Pack(request);

        var area = response.Areas.Single();
        area.Boxes.Should().HaveCount(1);
        area.Boxes[0].Position.Should().Be(new DecimalPosition(0, 0, 0));
    }

    [Fact]
    public void Heaviest_box_is_placed_lower_than_lighter_one()
    {
        var request = new PipelineRequest(
            "test", null,
            [Area("a", 50, 100, 50, Corner.BottomFrontLeft)],
            [
                Box("light", 50, 50, 50, weight: 1.0),
                Box("heavy", 50, 50, 50, weight: 100.0),
            ],
            Options(minSupportRatio: 1.0));

        var response = _packer.Pack(request);

        var boxes = response.Areas.Single().Boxes;
        var heavy = boxes.Single(b => b.Id == "heavy");
        var light = boxes.Single(b => b.Id == "light");
        heavy.Position.Y.Should().BeLessThan(light.Position.Y);
    }

    [Fact]
    public void BottomFrontRight_corner_mirrors_X()
    {
        var leftAnchor = _packer.Pack(new PipelineRequest(
            "test", null,
            [Area("a", 100, 100, 100, Corner.BottomFrontLeft)],
            [Box("b", 10, 10, 10, weight: 1.0)],
            Options())).Areas.Single().Boxes.Single();

        var rightAnchor = _packer.Pack(new PipelineRequest(
            "test", null,
            [Area("a", 100, 100, 100, Corner.BottomFrontRight)],
            [Box("b", 10, 10, 10, weight: 1.0)],
            Options())).Areas.Single().Boxes.Single();

        leftAnchor.Position.X.Should().Be(0);
        rightAnchor.Position.X.Should().Be(90, "the box should hug the right edge: 100 area - 10 box = 90");
    }

    [Fact]
    public void Box_too_large_for_any_area_lands_in_unfitted_virtual_area()
    {
        var request = new PipelineRequest(
            "test", null,
            [Area("a", 10, 10, 10, Corner.BottomFrontLeft)],
            [Box("b", 50, 50, 50, weight: 1.0)],
            Options());

        var response = _packer.Pack(request);

        response.Areas.Should().Contain(a => a.Unplaced);
        var unfitted = response.Areas.Single(a => a.Unplaced);
        unfitted.Id.Should().Be("UNFITTED");
        unfitted.Boxes.Should().ContainSingle(b => b.Id == "b");
    }

    [Fact]
    public void Exit_corridor_is_kept_empty()
    {
        var request = new PipelineRequest(
            "test", null,
            [
                new RequestArea(
                    "a", null, null,
                    new DecimalMeasurements(100, 100, 100),
                    new DecimalPosition(0, 0, 0),
                    Corner.BottomFrontLeft,
                    new RequestExitCorridor(
                        new DecimalPosition(0, 0, 0),
                        new DecimalMeasurements(50, 100, 50)),
                    MaxStackHeight: null),
            ],
            [Box("b", 10, 10, 10, weight: 1.0)],
            Options(minSupportRatio: 1.0));

        var response = _packer.Pack(request);

        var box = response.Areas.Single(a => !a.Unplaced).Boxes.Single();
        bool insideCorridor = box.Position.X < 50 && box.Position.Z < 50;
        insideCorridor.Should().BeFalse();
    }

    [Fact]
    public void Stable_inputs_yield_deterministic_outputs()
    {
        var request = new PipelineRequest(
            "test", null,
            [Area("a", 100, 100, 100, Corner.BottomFrontLeft)],
            [
                Box("a", 10, 10, 10, weight: 5.0),
                Box("b", 10, 10, 10, weight: 5.0),
                Box("c", 10, 10, 10, weight: 5.0),
            ],
            Options());

        var first = _packer.Pack(request);
        var second = _packer.Pack(request);

        first.Should().BeEquivalentTo(second);
    }

    private static RequestArea Area(string id, decimal w, decimal h, decimal d, Corner corner) =>
        new(id, null, null,
            new DecimalMeasurements(w, h, d),
            new DecimalPosition(0, 0, 0),
            corner,
            ExitCorridor: null,
            MaxStackHeight: null);

    private static RequestBox Box(string id, decimal w, decimal h, decimal d, double weight) =>
        new(id, null, null, new DecimalMeasurements(w, h, d), weight);

    private static PackingOptions Options(double minSupportRatio = 0.7) =>
        new(Units.Cm, MinSupportRatio: minSupportRatio);
}
