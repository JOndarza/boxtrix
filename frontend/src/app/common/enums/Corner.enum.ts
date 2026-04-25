/**
 * Floor corner of an area where placement begins. The .NET pipeline maps the
 * chosen corner to (0,0,0) canonical, packs there, then mirrors the X/Z back
 * to the user coordinate system on the way out.
 *
 * Y is always bottom-up (gravity), so only the four floor corners are exposed.
 */
export const enum Corner {
  BottomFrontLeft = 'BottomFrontLeft',
  BottomFrontRight = 'BottomFrontRight',
  BottomBackLeft = 'BottomBackLeft',
  BottomBackRight = 'BottomBackRight',
}

export const CORNER_OPTIONS: ReadonlyArray<{ value: Corner; label: string }> = [
  { value: Corner.BottomFrontLeft, label: 'Front · Left' },
  { value: Corner.BottomFrontRight, label: 'Front · Right' },
  { value: Corner.BottomBackLeft, label: 'Back · Left' },
  { value: Corner.BottomBackRight, label: 'Back · Right' },
];
