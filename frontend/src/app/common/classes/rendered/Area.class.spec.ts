import { Area } from './Area.class';

describe('Area', () => {
  const baseMeta = {
    position: { x: 0, y: 0, z: 0 },
    means: { width: 50, height: 40, depth: 30 },
  };

  it('stores exitCorridor from meta', () => {
    const corridor = { x: 5, y: 0, z: 2, width: 10, height: 20, depth: 8 };
    const area = new Area('a1', 'Test', undefined, { ...baseMeta, exitCorridor: corridor });
    expect(area.exitCorridor).toEqual(corridor);
  });

  it('leaves exitCorridor undefined when not provided', () => {
    const area = new Area('a1', 'Test', undefined, baseMeta);
    expect(area.exitCorridor).toBeUndefined();
  });

  it('exposes id and name from constructor', () => {
    const area = new Area('a1', 'Shelf', 'top shelf', baseMeta);
    expect(area.id).toBe('a1');
    expect(area.name).toBe('Shelf');
    expect(area.detail).toBe('top shelf');
  });

  it('starts with an empty items list', () => {
    const area = new Area('a1', 'Shelf', undefined, baseMeta);
    expect(area.itemCount).toBe(0);
  });
});
