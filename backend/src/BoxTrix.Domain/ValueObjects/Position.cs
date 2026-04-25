namespace BoxTrix.Domain.ValueObjects;

/// <summary>
/// 3D position in scaled-integer space (long) so that arithmetic stays exact
/// after the ×10^5 normalization step. For decimal positions in user space,
/// use <see cref="DecimalPosition"/>.
/// </summary>
public readonly record struct Position(long X, long Y, long Z)
{
    public static readonly Position Origin = new(0, 0, 0);

    public Position Translate(long dx, long dy, long dz) => new(X + dx, Y + dy, Z + dz);
}

public readonly record struct DecimalPosition(decimal X, decimal Y, decimal Z);
