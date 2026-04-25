namespace BoxTrix.Domain.ValueObjects;

/// <summary>
/// Axis-aligned bounding box in scaled-integer space.
/// Min is inclusive, Max is exclusive — two AABBs sharing a face do not overlap.
/// </summary>
public readonly record struct Aabb(Position Min, Position Max)
{
    public static Aabb FromPositionAndSize(Position position, Measurements size) =>
        new(position, new Position(position.X + size.Width, position.Y + size.Height, position.Z + size.Depth));

    public long Width => Max.X - Min.X;
    public long Height => Max.Y - Min.Y;
    public long Depth => Max.Z - Min.Z;

    public bool Overlaps(Aabb other) =>
        Min.X < other.Max.X && Max.X > other.Min.X &&
        Min.Y < other.Max.Y && Max.Y > other.Min.Y &&
        Min.Z < other.Max.Z && Max.Z > other.Min.Z;

    public bool Contains(Aabb inner) =>
        inner.Min.X >= Min.X && inner.Max.X <= Max.X &&
        inner.Min.Y >= Min.Y && inner.Max.Y <= Max.Y &&
        inner.Min.Z >= Min.Z && inner.Max.Z <= Max.Z;
}
