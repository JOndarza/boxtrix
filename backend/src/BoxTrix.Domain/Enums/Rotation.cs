namespace BoxTrix.Domain.Enums;

/// <summary>
/// Six axis-aligned rotations of a box. Letters denote which input dimension
/// (Width, Height, Depth) is mapped to each output axis (X, Y, Z) after rotation.
/// Mirror of the frontend Rotation enum.
/// </summary>
public enum Rotation
{
    WHD = 0,
    HWD = 1,
    HDW = 2,
    DHW = 3,
    DWH = 4,
    WDH = 5,
}
