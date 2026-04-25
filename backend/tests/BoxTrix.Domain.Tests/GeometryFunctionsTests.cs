using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.Functions;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Domain.Tests;

public sealed class GeometryFunctionsTests
{
    [Theory]
    [InlineData(Rotation.WHD, 10L, 20L, 30L)]
    [InlineData(Rotation.HWD, 20L, 10L, 30L)]
    [InlineData(Rotation.HDW, 20L, 30L, 10L)]
    [InlineData(Rotation.DHW, 30L, 20L, 10L)]
    [InlineData(Rotation.DWH, 30L, 10L, 20L)]
    [InlineData(Rotation.WDH, 10L, 30L, 20L)]
    public void Rotate_produces_expected_dimension_swaps(Rotation rotation, long w, long h, long d)
    {
        var rotated = GeometryFunctions.Rotate(new Measurements(10, 20, 30), rotation);
        rotated.Should().Be(new Measurements(w, h, d));
    }

    [Fact]
    public void Floor_placements_have_full_support()
    {
        var candidate = Aabb.FromPositionAndSize(new Position(0, 0, 0), new Measurements(10, 10, 10));
        GeometryFunctions.SupportRatio(candidate, []).Should().Be(1.0);
    }

    [Fact]
    public void Support_ratio_at_60_percent()
    {
        var supporter = Place(0, 0, 0, 10, 10, 10);
        var candidate = Aabb.FromPositionAndSize(new Position(4, 10, 0), new Measurements(10, 5, 10));
        GeometryFunctions.SupportRatio(candidate, [supporter]).Should().BeApproximately(0.6, 1e-9);
    }

    [Fact]
    public void Support_ratio_aggregates_multiple_supporters()
    {
        var left = Place(0, 0, 0, 5, 10, 10);
        var right = Place(5, 0, 0, 5, 10, 10);
        var candidate = Aabb.FromPositionAndSize(new Position(0, 10, 0), new Measurements(10, 5, 10));
        GeometryFunctions.SupportRatio(candidate, [left, right]).Should().Be(1.0);
    }

    [Fact]
    public void CentreOfGravity_inside_when_centred_over_supporter()
    {
        var supporter = Place(0, 0, 0, 10, 10, 10);
        var candidate = Aabb.FromPositionAndSize(new Position(0, 10, 0), new Measurements(10, 5, 10));
        GeometryFunctions.CentreOfGravityInsideSupport(candidate, [supporter]).Should().BeTrue();
    }

    [Fact]
    public void CentreOfGravity_rejects_overhang()
    {
        var supporter = Place(0, 0, 0, 10, 10, 10);
        var candidate = Aabb.FromPositionAndSize(new Position(8, 10, 0), new Measurements(10, 5, 10));
        GeometryFunctions.CentreOfGravityInsideSupport(candidate, [supporter]).Should().BeFalse();
    }

    [Fact]
    public void ComputeFixedSize_returns_zeroes_when_empty()
    {
        GeometryFunctions.ComputeFixedSize([]).Should().Be(new Measurements(0, 0, 0));
    }

    [Fact]
    public void ComputeFixedSize_takes_max_extent_per_axis()
    {
        var a = Place(0, 0, 0, 10, 5, 20);
        var b = Place(15, 0, 0, 5, 30, 5);
        GeometryFunctions.ComputeFixedSize([a, b]).Should().Be(new Measurements(20, 30, 20));
    }

    [Fact]
    public void Support_ratio_is_zero_when_no_box_below_at_y_greater_than_zero()
    {
        var candidate = Aabb.FromPositionAndSize(new Position(0, 10, 0), new Measurements(10, 5, 10));
        GeometryFunctions.SupportRatio(candidate, []).Should().Be(0.0);
    }

    [Fact]
    public void Support_ratio_is_zero_when_candidate_has_zero_base_area()
    {
        var supporter = Place(0, 0, 0, 10, 10, 10);
        var candidate = Aabb.FromPositionAndSize(new Position(0, 10, 0), new Measurements(0, 5, 10));
        GeometryFunctions.SupportRatio(candidate, [supporter]).Should().Be(0.0);
    }

    [Fact]
    public void CentreOfGravity_at_exact_supporter_edge_is_inside()
    {
        // candidate centre at exactly (10, _, 5) → x equals supporter MaxX → still inside (inclusive)
        var supporter = Place(0, 0, 0, 20, 10, 10);
        var candidate = Aabb.FromPositionAndSize(new Position(0, 10, 0), new Measurements(20, 5, 10));
        GeometryFunctions.CentreOfGravityInsideSupport(candidate, [supporter]).Should().BeTrue();
    }

    [Theory]
    [InlineData(0L, 10L, 5L, 15L, 5L)]   // partial overlap [5,10]
    [InlineData(0L, 10L, 0L, 10L, 10L)]  // identical
    [InlineData(0L, 10L, 10L, 20L, 0L)]  // touching only
    [InlineData(0L, 10L, 20L, 30L, 0L)]  // disjoint
    [InlineData(5L, 10L, 0L, 20L, 5L)]   // contained
    public void Overlap_length_handles_all_interval_relationships(long a0, long a1, long b0, long b1, long expected)
    {
        GeometryFunctions.OverlapLength(a0, a1, b0, b1).Should().Be(expected);
    }

    private static PlacedBox Place(long x, long y, long z, long w, long h, long d)
    {
        var size = new Measurements(w, h, d);
        var src = new Box($"box-{x}-{y}-{z}", null, null, size, null);
        return new PlacedBox(src, new Position(x, y, z), Rotation.WHD, size);
    }
}
