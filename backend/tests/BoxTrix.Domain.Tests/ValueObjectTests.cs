using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace BoxTrix.Domain.Tests;

public sealed class ValueObjectTests
{
    [Fact]
    public void Position_is_value_equal_when_components_match()
    {
        new Position(1, 2, 3).Should().Be(new Position(1, 2, 3));
        new Position(1, 2, 3).GetHashCode().Should().Be(new Position(1, 2, 3).GetHashCode());
    }

    [Fact]
    public void Position_origin_is_zero_zero_zero()
    {
        Position.Origin.Should().Be(new Position(0, 0, 0));
    }

    [Theory]
    [InlineData(0L, 0L, 0L, 1L, 2L, 3L, 1L, 2L, 3L)]
    [InlineData(10L, 20L, 30L, -5L, -10L, -15L, 5L, 10L, 15L)]
    public void Position_translate_adds_each_axis(
        long x, long y, long z,
        long dx, long dy, long dz,
        long ex, long ey, long ez)
    {
        new Position(x, y, z).Translate(dx, dy, dz).Should().Be(new Position(ex, ey, ez));
    }

    [Fact]
    public void Measurements_volume_is_product_of_dimensions()
    {
        new Measurements(2, 3, 5).Volume.Should().Be(30.0);
    }

    [Fact]
    public void Measurements_max_dimension_picks_largest_axis()
    {
        new Measurements(3, 7, 5).MaxDimension.Should().Be(7);
        new Measurements(10, 10, 10).MaxDimension.Should().Be(10, "cubes have all axes equal");
    }

    [Fact]
    public void Aabb_FromPositionAndSize_computes_max_correctly()
    {
        var aabb = Aabb.FromPositionAndSize(new Position(5, 10, 15), new Measurements(2, 3, 4));

        aabb.Min.Should().Be(new Position(5, 10, 15));
        aabb.Max.Should().Be(new Position(7, 13, 19));
        aabb.Width.Should().Be(2);
        aabb.Height.Should().Be(3);
        aabb.Depth.Should().Be(4);
    }

    [Fact]
    public void Aabb_records_compare_by_value()
    {
        var a = Aabb.FromPositionAndSize(new Position(0, 0, 0), new Measurements(10, 10, 10));
        var b = Aabb.FromPositionAndSize(new Position(0, 0, 0), new Measurements(10, 10, 10));
        a.Should().Be(b);
    }
}
