using BoxTrix.Application.Pipeline;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace BoxTrix.Application.Tests;

/// <summary>
/// Property-based tests for the corner-flip roundtrip.
/// FlipAabb is an involution: applying it twice must return the original AABB.
/// Runs 10 000 random cases per corner via FsCheck.
/// </summary>
public sealed class CornerFlipPropertyTests
{
    [Property(MaxTest = 10_000, Arbitrary = [typeof(PositiveGen)])]
    public Property FlipAabb_is_involution_for_BottomFrontLeft(FlipInput input)
        => FlipIsInvolution(input, flipX: false, flipZ: false);

    [Property(MaxTest = 10_000, Arbitrary = [typeof(PositiveGen)])]
    public Property FlipAabb_is_involution_for_BottomFrontRight(FlipInput input)
        => FlipIsInvolution(input, flipX: true, flipZ: false);

    [Property(MaxTest = 10_000, Arbitrary = [typeof(PositiveGen)])]
    public Property FlipAabb_is_involution_for_BottomBackLeft(FlipInput input)
        => FlipIsInvolution(input, flipX: false, flipZ: true);

    [Property(MaxTest = 10_000, Arbitrary = [typeof(PositiveGen)])]
    public Property FlipAabb_is_involution_for_BottomBackRight(FlipInput input)
        => FlipIsInvolution(input, flipX: true, flipZ: true);

    private static Property FlipIsInvolution(FlipInput i, bool flipX, bool flipZ)
    {
        var aabb = Aabb.FromPositionAndSize(
            new Position(i.X, i.Y, i.Z),
            new Measurements(i.BoxW, i.BoxH, i.BoxD));

        var bounds = new Measurements(i.AreaW, i.AreaH, i.AreaD);

        var once  = AreaContext.FlipAabb(aabb,  bounds, flipX, flipZ);
        var twice = AreaContext.FlipAabb(once,  bounds, flipX, flipZ);

        return (twice == aabb).ToProperty()
            .Label($"aabb={aabb} bounds={bounds} flipX={flipX} flipZ={flipZ} → once={once} twice={twice}");
    }
}

/// <summary>Input record for FlipAabb property tests.</summary>
public sealed record FlipInput(
    long AreaW, long AreaH, long AreaD,
    long BoxW,  long BoxH,  long BoxD,
    long X,     long Y,     long Z);

/// <summary>
/// Generates FlipInput where the box fits inside the area and the position is
/// within bounds (X + BoxW ≤ AreaW, Z + BoxD ≤ AreaD).
/// </summary>
public static class PositiveGen
{
    public static Arbitrary<FlipInput> FlipInputArbitrary()
    {
        var gen =
            from aw in Gen.Choose(2, 1_000_000)
            from ah in Gen.Choose(2, 1_000_000)
            from ad in Gen.Choose(2, 1_000_000)
            from bw in Gen.Choose(1, aw)
            from bh in Gen.Choose(1, ah)
            from bd in Gen.Choose(1, ad)
            from x  in Gen.Choose(0, aw - bw)
            from y  in Gen.Choose(0, ah - bh)
            from z  in Gen.Choose(0, ad - bd)
            select new FlipInput((long)aw, (long)ah, (long)ad,
                                 (long)bw, (long)bh, (long)bd,
                                 (long)x,  (long)y,  (long)z);

        return gen.ToArbitrary();
    }
}
