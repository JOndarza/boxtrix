using BoxTrix.Domain.Contracts;
using BoxTrix.Domain.Entities;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Application.Pipeline.Stages;

/// <summary>
/// [i] Greedy push of every placed box toward the canonical origin: -x then
/// -z then -y. Re-validates stability after each axis push so we never break
/// support invariants. Operates in place on the same scaled-integer space.
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
        var working = placed.OrderBy(p => p.Position.Y).ThenBy(p => p.Position.Z).ThenBy(p => p.Position.X).ToList();
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
        bool any = false;
        any |= PushAxis(i, working, context, minSupportRatio, dx: -1, dy: 0, dz: 0);
        any |= PushAxis(i, working, context, minSupportRatio, dx: 0, dy: 0, dz: -1);
        any |= PushAxis(i, working, context, minSupportRatio, dx: 0, dy: -1, dz: 0);
        return any;
    }

    private bool PushAxis(int i, List<PlacedBox> working, AreaContext context, double minSupportRatio, long dx, long dy, long dz)
    {
        var current = working[i];
        bool moved = false;

        while (true)
        {
            var candidatePos = current.Position.Translate(dx, dy, dz);
            if (candidatePos.X < 0 || candidatePos.Y < 0 || candidatePos.Z < 0)
            {
                break;
            }

            var candidate = new PlacedBox(current.Source, candidatePos, current.Rotation, current.RotatedSize);
            if (!IsValid(i, candidate, working, context, minSupportRatio))
            {
                break;
            }

            current = candidate;
            moved = true;
        }

        if (moved)
        {
            working[i] = current;
        }
        return moved;
    }

    private bool IsValid(int self, PlacedBox candidate, List<PlacedBox> working, AreaContext context, double minSupportRatio)
    {
        var areaAabb = Aabb.FromPositionAndSize(Position.Origin, context.Source.Size);
        if (!areaAabb.Contains(candidate.Aabb))
        {
            return false;
        }
        foreach (var f in context.Forbidden)
        {
            if (candidate.Aabb.Overlaps(f))
            {
                return false;
            }
        }
        for (int j = 0; j < working.Count; j++)
        {
            if (j == self)
            {
                continue;
            }
            if (candidate.Aabb.Overlaps(working[j].Aabb))
            {
                return false;
            }
        }

        var others = new List<PlacedBox>(working.Count - 1);
        for (int j = 0; j < working.Count; j++)
        {
            if (j != self)
            {
                others.Add(working[j]);
            }
        }
        return _stability.IsStable(candidate.Aabb, others, minSupportRatio);
    }
}
