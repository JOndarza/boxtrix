namespace BoxTrix.Domain.ValueObjects;

/// <summary>
/// Width × Height × Depth in scaled-integer space (long). Volume is double
/// because the cubed value of a 10^8 dimension would overflow long; volume
/// is only used as a sort key, so double precision is sufficient.
/// </summary>
public readonly record struct Measurements(long Width, long Height, long Depth)
{
    public double Volume => (double)Width * Height * Depth;

    public long MaxDimension => Math.Max(Width, Math.Max(Height, Depth));
}

public readonly record struct DecimalMeasurements(decimal Width, decimal Height, decimal Depth);
