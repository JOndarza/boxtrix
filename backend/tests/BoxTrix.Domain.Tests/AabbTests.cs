using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Domain.Tests;

public sealed class AabbTests
{
    [Fact]
    public void Overlaps_returns_false_for_separated_boxes()
    {
        var a = Aabb.FromPositionAndSize(new Position(0, 0, 0), new Measurements(10, 10, 10));
        var b = Aabb.FromPositionAndSize(new Position(20, 0, 0), new Measurements(10, 10, 10));
        a.Overlaps(b).Should().BeFalse();
    }

    [Fact]
    public void Overlaps_returns_false_for_touching_faces()
    {
        var a = Aabb.FromPositionAndSize(new Position(0, 0, 0), new Measurements(10, 10, 10));
        var b = Aabb.FromPositionAndSize(new Position(10, 0, 0), new Measurements(10, 10, 10));
        a.Overlaps(b).Should().BeFalse("two AABBs sharing only a face do not collide");
    }

    [Fact]
    public void Overlaps_returns_true_for_intersecting_boxes()
    {
        var a = Aabb.FromPositionAndSize(new Position(0, 0, 0), new Measurements(10, 10, 10));
        var b = Aabb.FromPositionAndSize(new Position(5, 5, 5), new Measurements(10, 10, 10));
        a.Overlaps(b).Should().BeTrue();
    }

    [Fact]
    public void Contains_is_inclusive_on_min_and_max()
    {
        var outer = Aabb.FromPositionAndSize(new Position(0, 0, 0), new Measurements(100, 100, 100));
        var inner = Aabb.FromPositionAndSize(new Position(0, 0, 0), new Measurements(100, 100, 100));
        outer.Contains(inner).Should().BeTrue();
    }

    [Fact]
    public void Contains_returns_false_when_inner_exceeds()
    {
        var outer = Aabb.FromPositionAndSize(new Position(0, 0, 0), new Measurements(100, 100, 100));
        var inner = Aabb.FromPositionAndSize(new Position(0, 0, 0), new Measurements(101, 1, 1));
        outer.Contains(inner).Should().BeFalse();
    }
}
