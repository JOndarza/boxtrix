using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [i] Greedy push of every placed box toward the canonical origin: -x then
/// -z then -y. Re-validates stability after each axis push so we never break
/// support invariants. Operates in place on the same scaled-integer space.
///
/// Performance: instead of stepping 1 scaled unit at a time (which was
/// O(distance × n_placed) per push), we now:
///   1. Compute the max geometric travel in one O(n) scan (BlockingGap).
///   2. Binary-search for the farthest stable position in O(log(distance) × n).
/// A 50 cm push in scaled space (5 000 000 units) now costs ~23 stability
/// checks instead of 5 000 000 iterations — roughly a 200 000× speedup on
/// large moves.
/// </summary>
public sealed class CompactorStage : IPipelineStage
{
    private readonly StabilityValidatorStage _stability;

    public CompactorStage(StabilityValidatorStage stability)
    {
        _stability = stability;
    }

    public IReadOnlyList<PlacedBox> Compact(
        IReadOnlyList<PlacedBox> placed,
        AreaContext context,
        double minSupportRatio)
    {
        var working = placed
            .OrderBy(p => p.Position.Y).ThenBy(p => p.Position.Z).ThenBy(p => p.Position.X)
            .ToList();

        bool changed;
        int safetyIterations = 0;
        do
        {
            changed = false;
            for (int i = 0; i < working.Count; i++)
            {
                changed |= TryPush(i, working, context, minSupportRatio);
            }
            safetyIterations++;
        }
        while (changed && safetyIterations < 8);

        return working;
    }

    private bool TryPush(int i, List<PlacedBox> working, AreaContext context, double minSupportRatio)
    {
        // Build the list of other boxes once; reuse across all three axis pushes.
        var others = BuildOthers(i, working);
        bool any = false;
        any |= PushAxis(i, working, context, others, minSupportRatio, dx: -1, dy: 0, dz: 0);
        any |= PushAxis(i, working, context, others, minSupportRatio, dx: 0, dy: 0, dz: -1);
        any |= PushAxis(i, working, context, others, minSupportRatio, dx: 0, dy: -1, dz: 0);
        return any;
    }

    private bool PushAxis(
        int i, List<PlacedBox> working, AreaContext context,
        IReadOnlyList<PlacedBox> others, double minSupportRatio,
        long dx, long dy, long dz)
    {
        var current = working[i];

        // Step 1: max travel that is geometrically collision-free (O(n), single pass).
        long maxGeom = MaxGeometricTravel(current.Aabb, others, context, dx, dy, dz);
        if (maxGeom <= 0) return false;

        // Step 2: binary search for the farthest stable position in [1, maxGeom].
        // Stability is monotone for -y (moving toward floor always gains support)
        // and effectively monotone for -x/-z (moving away from origin loses support
        // as the box slides off its supporters). Non-monotone cases are rare and the
        // binary search still finds a valid position — just not always the global max.
        long lo = 0, hi = maxGeom;
        while (lo < hi)
        {
            long mid = lo + (hi - lo + 1) / 2;
            var candidateAabb = Aabb.FromPositionAndSize(
                Translate(current.Position, dx, dy, dz, mid),
                current.RotatedSize);
            if (_stability.IsStable(candidateAabb, others, minSupportRatio))
                lo = mid;
            else
                hi = mid - 1;
        }

        if (lo == 0) return false;

        working[i] = current with { Position = Translate(current.Position, dx, dy, dz, lo) };
        return true;
    }

    /// <summary>
    /// Maximum distance the box can travel in the given direction before hitting
    /// a wall, another box, or a forbidden region. O(n) — no inner loop.
    /// </summary>
    private static long MaxGeometricTravel(
        Aabb curr, IReadOnlyList<PlacedBox> others, AreaContext context,
        long dx, long dy, long dz)
    {
        long maxDist = dx != 0 ? curr.Min.X : dy != 0 ? curr.Min.Y : curr.Min.Z;
        if (maxDist <= 0) return 0;

        foreach (var other in others)
        {
            long gap = BlockingGap(curr, other.Aabb, dx, dy, dz);
            if (gap >= 0 && gap < maxDist) maxDist = gap;
        }

        foreach (var f in context.Forbidden)
        {
            long gap = BlockingGap(curr, f, dx, dy, dz);
            if (gap >= 0 && gap < maxDist) maxDist = gap;
        }

        return maxDist;
    }

    /// <summary>
    /// Distance <paramref name="curr"/> can travel in the (-dx,-dy,-dz) direction
    /// before its leading face touches <paramref name="obstacle"/>.
    /// Returns -1 if the obstacle does not block movement on this axis.
    /// </summary>
    private static long BlockingGap(Aabb curr, Aabb obstacle, long dx, long dy, long dz)
    {
        if (dx != 0)
        {
            if (obstacle.Max.X > curr.Min.X) return -1; // obstacle is not to our left
            if (!OverlapsYZ(curr, obstacle)) return -1;  // obstacle off to the side
            return curr.Min.X - obstacle.Max.X;
        }
        if (dy != 0)
        {
            if (obstacle.Max.Y > curr.Min.Y) return -1;
            if (!OverlapsXZ(curr, obstacle)) return -1;
            return curr.Min.Y - obstacle.Max.Y;
        }
        // dz != 0
        if (obstacle.Max.Z > curr.Min.Z) return -1;
        if (!OverlapsXY(curr, obstacle)) return -1;
        return curr.Min.Z - obstacle.Max.Z;
    }

    private static bool OverlapsYZ(Aabb a, Aabb b) =>
        a.Min.Y < b.Max.Y && a.Max.Y > b.Min.Y &&
        a.Min.Z < b.Max.Z && a.Max.Z > b.Min.Z;

    private static bool OverlapsXZ(Aabb a, Aabb b) =>
        a.Min.X < b.Max.X && a.Max.X > b.Min.X &&
        a.Min.Z < b.Max.Z && a.Max.Z > b.Min.Z;

    private static bool OverlapsXY(Aabb a, Aabb b) =>
        a.Min.X < b.Max.X && a.Max.X > b.Min.X &&
        a.Min.Y < b.Max.Y && a.Max.Y > b.Min.Y;

    private static Position Translate(Position p, long dx, long dy, long dz, long dist) =>
        new(p.X + dx * dist, p.Y + dy * dist, p.Z + dz * dist);

    private static IReadOnlyList<PlacedBox> BuildOthers(int self, List<PlacedBox> working)
    {
        var others = new PlacedBox[working.Count - 1];
        int idx = 0;
        for (int j = 0; j < working.Count; j++)
        {
            if (j != self) others[idx++] = working[j];
        }
        return others;
    }
}
