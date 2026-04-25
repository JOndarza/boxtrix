using BoxTrix.Domain.Entities;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Application.Pipeline;

/// <summary>
/// A horizontal slab inside an area with its base at <see cref="YBase"/> and
/// top at the running maximum of placed boxes. <see cref="ExtremePoints"/> is
/// the candidate-position frontier maintained by the PositionFinder.
/// </summary>
public sealed class Layer
{
    public long YBase { get; }

    public List<PlacedBox> Placed { get; } = [];

    public List<Position> ExtremePoints { get; } = [];

    public Layer(long yBase, IReadOnlyList<Position>? seedPoints = null)
    {
        YBase = yBase;
        ExtremePoints.Add(new Position(0, yBase, 0));
        if (seedPoints is not null)
        {
            foreach (var p in seedPoints)
            {
                ExtremePoints.Add(p);
            }
        }
    }

    public long YTop
    {
        get
        {
            long top = YBase;
            foreach (var p in Placed)
            {
                top = Math.Max(top, p.Aabb.Max.Y);
            }
            return top;
        }
    }
}
