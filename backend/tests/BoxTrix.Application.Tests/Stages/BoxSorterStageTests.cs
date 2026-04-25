using BoxTrix.Application.Pipeline.Stages;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Application.Tests.Stages;

public sealed class BoxSorterStageTests
{
    private readonly BoxSorterStage _sorter = new();

    [Fact]
    public void Heaviest_box_comes_first()
    {
        var light = new Box("light", null, null, new Measurements(10, 10, 10), Weight: 1.0);
        var heavy = new Box("heavy", null, null, new Measurements(10, 10, 10), Weight: 100.0);

        var result = _sorter.Sort([light, heavy]);

        result[0].Id.Should().Be("heavy");
        result[1].Id.Should().Be("light");
    }

    [Fact]
    public void Falls_back_to_volume_when_weights_missing()
    {
        var small = new Box("small", null, null, new Measurements(5, 5, 5), Weight: null);
        var large = new Box("large", null, null, new Measurements(10, 10, 10), Weight: null);

        var result = _sorter.Sort([small, large]);

        result[0].Id.Should().Be("large");
        result[1].Id.Should().Be("small");
    }

    [Fact]
    public void Sort_is_stable_and_deterministic_on_ties()
    {
        var a = new Box("a", null, null, new Measurements(10, 10, 10), Weight: 1.0);
        var b = new Box("b", null, null, new Measurements(10, 10, 10), Weight: 1.0);

        _sorter.Sort([b, a]).Select(x => x.Id).Should().Equal("a", "b");
    }
}
