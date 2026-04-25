using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Domain.Functions;

public static class GeometryFunctions
{
    /// <summary>Apply one of the six axis-aligned rotations to a measurement triple.</summary>
    public static Measurements Rotate(Measurements m, Rotation r) => r switch
    {
        Rotation.WHD => m,
        Rotation.HWD => new Measurements(m.Height, m.Width, m.Depth),
        Rotation.HDW => new Measurements(m.Height, m.Depth, m.Width),
        Rotation.DHW => new Measurements(m.Depth, m.Height, m.Width),
        Rotation.DWH => new Measurements(m.Depth, m.Width, m.Height),
        Rotation.WDH => new Measurements(m.Width, m.Depth, m.Height),
        _ => throw new ArgumentOutOfRangeException(nameof(r), r, null),
    };

    /// <summary>
    /// Fraction of the candidate's bottom face supported by placed boxes or floor.
    /// </summary>
    public static double SupportRatio(Aabb candidate, IReadOnlyList<PlacedBox> placed)
    {
        if (candidate.Min.Y == 0) return 1.0;

        long baseArea = candidate.Width * candidate.Depth;
        if (baseArea == 0) return 0.0;

        long supported = 0;
        foreach (var p in placed)
        {
            if (p.Aabb.Max.Y != candidate.Min.Y) continue;
            long ox = OverlapLength(candidate.Min.X, candidate.Max.X, p.Aabb.Min.X, p.Aabb.Max.X);
            long oz = OverlapLength(candidate.Min.Z, candidate.Max.Z, p.Aabb.Min.Z, p.Aabb.Max.Z);
            supported += ox * oz;
        }

        return Math.Min(1.0, (double)supported / baseArea);
    }

    /// <summary>
    /// Faster overload that uses a pre-built support surface (boxes grouped by
    /// their Max.Y). Build once per box placement with <see cref="BuildSupportSurface"/>;
    /// reuse for all EP attempts in a single <c>TryPlace</c> call.
    /// </summary>
    public static double SupportRatio(Aabb candidate, Dictionary<long, List<Aabb>> surface)
    {
        if (candidate.Min.Y == 0) return 1.0;

        long baseArea = candidate.Width * candidate.Depth;
        if (baseArea == 0) return 0.0;

        if (!surface.TryGetValue(candidate.Min.Y, out var supporters)) return 0.0;

        long supported = 0;
        foreach (var s in supporters)
        {
            long ox = OverlapLength(candidate.Min.X, candidate.Max.X, s.Min.X, s.Max.X);
            long oz = OverlapLength(candidate.Min.Z, candidate.Max.Z, s.Min.Z, s.Max.Z);
            supported += ox * oz;
        }

        return Math.Min(1.0, (double)supported / baseArea);
    }

    /// <summary>
    /// Returns true if the candidate's centre of gravity falls inside any supporting
    /// rectangle. Floor placements always pass.
    /// </summary>
    public static bool CentreOfGravityInsideSupport(Aabb candidate, IReadOnlyList<PlacedBox> placed)
    {
        if (candidate.Min.Y == 0) return true;

        long cx = (candidate.Min.X + candidate.Max.X) / 2;
        long cz = (candidate.Min.Z + candidate.Max.Z) / 2;

        foreach (var p in placed)
        {
            if (p.Aabb.Max.Y != candidate.Min.Y) continue;
            if (cx >= p.Aabb.Min.X && cx <= p.Aabb.Max.X &&
                cz >= p.Aabb.Min.Z && cz <= p.Aabb.Max.Z)
                return true;
        }

        return false;
    }

    /// <summary>Faster overload using pre-built support surface.</summary>
    public static bool CentreOfGravityInsideSupport(Aabb candidate, Dictionary<long, List<Aabb>> surface)
    {
        if (candidate.Min.Y == 0) return true;

        long cx = (candidate.Min.X + candidate.Max.X) / 2;
        long cz = (candidate.Min.Z + candidate.Max.Z) / 2;

        if (!surface.TryGetValue(candidate.Min.Y, out var supporters)) return false;

        foreach (var s in supporters)
        {
            if (cx >= s.Min.X && cx <= s.Max.X && cz >= s.Min.Z && cz <= s.Max.Z)
                return true;
        }

        return false;
    }

    /// <summary>
    /// Groups placed-box top faces by their Max.Y for O(1) level lookup.
    /// Build once per box placement; reuse across all EP attempts.
    /// </summary>
    public static Dictionary<long, List<Aabb>> BuildSupportSurface(IReadOnlyList<PlacedBox> placed)
    {
        var surface = new Dictionary<long, List<Aabb>>(placed.Count);
        foreach (var p in placed)
        {
            if (!surface.TryGetValue(p.Aabb.Max.Y, out var list))
                surface[p.Aabb.Max.Y] = list = [];
            list.Add(p.Aabb);
        }
        return surface;
    }

    /// <summary>Length of the overlap between two 1D intervals (clamped to 0).</summary>
    public static long OverlapLength(long a0, long a1, long b0, long b1)
    {
        long lo = Math.Max(a0, b0);
        long hi = Math.Min(a1, b1);
        return Math.Max(0, hi - lo);
    }

    /// <summary>Smallest AABB that contains all placed boxes (or zero if none).</summary>
    public static Measurements ComputeFixedSize(IReadOnlyList<PlacedBox> placed)
    {
        if (placed.Count == 0)
        {
            return new Measurements(0, 0, 0);
        }

        long maxX = 0;
        long maxY = 0;
        long maxZ = 0;
        foreach (var p in placed)
        {
            maxX = Math.Max(maxX, p.Aabb.Max.X);
            maxY = Math.Max(maxY, p.Aabb.Max.Y);
            maxZ = Math.Max(maxZ, p.Aabb.Max.Z);
        }

        return new Measurements(maxX, maxY, maxZ);
    }
}
