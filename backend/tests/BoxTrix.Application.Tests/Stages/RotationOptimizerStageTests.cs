using BoxTrix.Application.Pipeline.Stages;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Application.Tests.Stages;

public sealed class RotationOptimizerStageTests
{
    private readonly RotationOptimizerStage _rotations = new();

    [Fact]
    public void Returns_six_candidates_when_height_cap_is_unbounded()
    {
        var box = new Box("b", null, null, new Measurements(10, 20, 30), Weight: null);

        var candidates = _rotations.Candidates(box, heightCap: long.MaxValue).ToArray();

        candidates.Should().HaveCount(6);
    }

    [Fact]
    public void Filters_out_rotations_taller_than_the_layer()
    {
        var box = new Box("b", null, null, new Measurements(2, 10, 3), Weight: null);

        var candidates = _rotations.Candidates(box, heightCap: 4).ToArray();

        candidates.Should().NotBeEmpty("rotations with H≤4 must remain");
        candidates.Should().OnlyContain(c => c.Size.Height <= 4);
    }

    [Fact]
    public void Orders_by_base_area_descending_then_height_ascending()
    {
        var box = new Box("b", null, null, new Measurements(1, 2, 4), Weight: null);

        var first = _rotations.Candidates(box, heightCap: long.MaxValue).First();

        // largest base footprint = 4 × 2 = 8, height = 1
        first.Size.Width.Should().BeOneOf(2, 4);
        first.Size.Depth.Should().BeOneOf(2, 4);
        first.Size.Height.Should().Be(1);
    }
}
