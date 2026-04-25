using BoxTrix.Application.Pipeline.Stages;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Application.Tests.Stages;

public sealed class StabilityValidatorStageTests
{
    private readonly StabilityValidatorStage _stability = new();

    [Fact]
    public void Floor_placements_are_always_stable()
    {
        var candidate = Aabb.FromPositionAndSize(new Position(0, 0, 0), new Measurements(10, 10, 10));

        _stability.IsStable(candidate, (IReadOnlyList<PlacedBox>)[], minSupportRatio: 1.0).Should().BeTrue();
    }

    [Fact]
    public void Disabled_validator_always_returns_true()
    {
        // Half-overhanging box at y>0 with no support at all
        var candidate = Aabb.FromPositionAndSize(new Position(50, 10, 0), new Measurements(10, 10, 10));

        _stability.IsStable(candidate, (IReadOnlyList<PlacedBox>)[], minSupportRatio: 0).Should().BeTrue();
    }

    [Fact]
    public void Rejects_when_support_ratio_below_threshold()
    {
        var supporter = Place(0, 0, 0, 10, 10, 10);
        // 60% supported (4cm overlap on 10cm wide candidate)
        var candidate = Aabb.FromPositionAndSize(new Position(4, 10, 0), new Measurements(10, 5, 10));

        _stability.IsStable(candidate, [supporter], minSupportRatio: 0.7).Should().BeFalse();
    }

    [Fact]
    public void Accepts_when_support_ratio_meets_threshold_exactly()
    {
        var supporter = Place(0, 0, 0, 10, 10, 10);
        // 70% supported (3cm overhang)
        var candidate = Aabb.FromPositionAndSize(new Position(3, 10, 0), new Measurements(10, 5, 10));

        _stability.IsStable(candidate, [supporter], minSupportRatio: 0.7).Should().BeTrue();
    }

    [Fact]
    public void Rejects_when_centre_of_gravity_falls_outside_supports()
    {
        // Candidate is 80% supported (left 8cm rest on supporter, right 2cm over edge)
        // but its centre (x=15) is past the supporter's right edge (x=10) — must reject.
        var supporter = Place(0, 0, 0, 10, 10, 10);
        var candidate = Aabb.FromPositionAndSize(new Position(8, 10, 0), new Measurements(15, 5, 10));

        _stability.IsStable(candidate, [supporter], minSupportRatio: 0.5).Should().BeFalse();
    }

    private static PlacedBox Place(long x, long y, long z, long w, long h, long d)
    {
        var size = new Measurements(w, h, d);
        var src = new Box($"box-{x}-{y}-{z}", null, null, size, null);
        return new PlacedBox(src, new Position(x, y, z), Rotation.WHD, size);
    }
}
