namespace BoxTrix.Domain.Enums;

/// <summary>
/// Floor corner of an axis-aligned area where placement begins. Y is always
/// bottom-up (gravity) so only the four floor corners are exposed; the
/// AreaPreprocessor maps the chosen corner to (0,0,0) canonical and inverts
/// the X/Z transform on the way out. Front = -Z, Back = +Z, Left = -X, Right = +X
/// in the user's coordinate system.
/// </summary>
public enum Corner
{
    BottomFrontLeft = 0,
    BottomFrontRight = 1,
    BottomBackLeft = 2,
    BottomBackRight = 3,
}
