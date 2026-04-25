using BoxTrix.Domain.Entities;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;

namespace BoxTrix.Application.Pipeline;

/// <summary>
/// Per-area state computed by AreaPreprocessor. The pipeline always packs in
/// canonical space (origin at the chosen corner, growing in +x/+y/+z).
/// <see cref="FlipX"/>/<see cref="FlipZ"/> are applied to <see cref="Forbidden"/>
/// at preprocess time; the same flips are applied to placed boxes at denormalize.
/// </summary>
public sealed record AreaContext(
    Area Source,
    bool FlipX,
    bool FlipZ,
    IReadOnlyList<Aabb> Forbidden,
    long MaxStackHeight)
{
    public static AreaContext FromArea(Area area, long defaultMaxStackHeight)
    {
        bool flipX = area.AccessCorner is Corner.BottomFrontRight or Corner.BottomBackRight;
        bool flipZ = area.AccessCorner is Corner.BottomBackLeft or Corner.BottomBackRight;

        var forbidden = new List<Aabb>();
        if (area.ExitCorridor is { } corridor)
        {
            forbidden.Add(FlipAabb(corridor.Aabb, area.Size, flipX, flipZ));
        }

        long stackHeight = area.MaxStackHeight ?? defaultMaxStackHeight;
        if (stackHeight <= 0 || stackHeight > area.Size.Height)
        {
            stackHeight = area.Size.Height;
        }

        return new AreaContext(area, flipX, flipZ, forbidden, stackHeight);
    }

    public static Aabb FlipAabb(Aabb a, Measurements bounds, bool flipX, bool flipZ)
    {
        long minX = flipX ? bounds.Width - a.Max.X : a.Min.X;
        long maxX = flipX ? bounds.Width - a.Min.X : a.Max.X;
        long minZ = flipZ ? bounds.Depth - a.Max.Z : a.Min.Z;
        long maxZ = flipZ ? bounds.Depth - a.Min.Z : a.Max.Z;
        return new Aabb(new Position(minX, a.Min.Y, minZ), new Position(maxX, a.Max.Y, maxZ));
    }
}
