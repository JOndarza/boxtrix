import { TestBed } from '@angular/core/testing';
import { Corner } from '@common/enums/Corner.enum';
import { ProcessorService } from './Processor.service';
import { InputPanelService, AreaRow, BoxRow, CorridorRow } from './InputPanel.service';

describe('InputPanelService.buildInput', () => {
  let service: InputPanelService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InputPanelService,
        { provide: ProcessorService, useValue: { sort: jasmine.createSpy() } },
      ],
    });
    service = TestBed.inject(InputPanelService);
  });

  function area(overrides: Partial<AreaRow> = {}): AreaRow {
    return {
      name: 'Shelf',
      width: '50',
      height: '40',
      depth: '30',
      accessCorner: Corner.BottomFrontLeft,
      corridor: null,
      ...overrides,
    };
  }

  function box(overrides: Partial<BoxRow> = {}): BoxRow {
    return { name: 'Box', width: '10', height: '10', depth: '10', qty: '1', weight: '', ...overrides };
  }

  it('maps a single area and box to IInput', () => {
    const input = service.buildInput([area()], [box()]);
    expect(input.areas.length).toBe(1);
    expect(input.boxes.length).toBe(1);
    expect(input.areas[0].width).toBe(50);
    expect(input.boxes[0].width).toBe(10);
  });

  it('uses accessCorner from the row', () => {
    const input = service.buildInput([area({ accessCorner: Corner.BottomBackRight })], [box()]);
    expect(input.areas[0].accessCorner).toBe(Corner.BottomBackRight);
  });

  it('falls back to BottomFrontLeft when accessCorner is not set', () => {
    const row = area();
    (row as any).accessCorner = undefined;
    const input = service.buildInput([row], [box()]);
    expect(input.areas[0].accessCorner).toBe(Corner.BottomFrontLeft);
  });

  it('auto-generates area id when name is empty', () => {
    const input = service.buildInput([area({ name: '' })], [box()]);
    expect(input.areas[0].id).toBe('Area 1');
  });

  it('auto-generates box id when name is empty', () => {
    const input = service.buildInput([area()], [box({ name: '' })]);
    expect(input.boxes[0].id).toBe('Box 1');
  });

  it('attaches exitCorridor when corridor dimensions are valid', () => {
    const corridor: CorridorRow = { x: '5', y: '0', z: '2', width: '10', height: '20', depth: '8' };
    const input = service.buildInput([area({ corridor })], [box()]);
    expect(input.areas[0].exitCorridor).toEqual({ x: 5, y: 0, z: 2, width: 10, height: 20, depth: 8 });
  });

  it('omits exitCorridor when corridor has zero width', () => {
    const corridor: CorridorRow = { x: '0', y: '0', z: '0', width: '0', height: '20', depth: '8' };
    const input = service.buildInput([area({ corridor })], [box()]);
    expect(input.areas[0].exitCorridor).toBeUndefined();
  });

  it('omits exitCorridor when corridor is null', () => {
    const input = service.buildInput([area({ corridor: null })], [box()]);
    expect(input.areas[0].exitCorridor).toBeUndefined();
  });

  it('expands qty > 1 into multiple box entries', () => {
    const input = service.buildInput([area()], [box({ name: 'Funko', qty: '3' })]);
    expect(input.boxes.length).toBe(3);
    expect(input.boxes[0].id).toBe('Funko #1');
    expect(input.boxes[2].id).toBe('Funko #3');
  });

  it('attaches weight when weight > 0', () => {
    const input = service.buildInput([area()], [box({ weight: '1.5' })]);
    expect(input.boxes[0].weight).toBe(1.5);
  });

  it('omits weight when weight is empty string', () => {
    const input = service.buildInput([area()], [box({ weight: '' })]);
    expect(input.boxes[0].weight).toBeUndefined();
  });

  it('omits weight when weight is 0', () => {
    const input = service.buildInput([area()], [box({ weight: '0' })]);
    expect(input.boxes[0].weight).toBeUndefined();
  });

  it('filters out areas with zero dimensions', () => {
    const input = service.buildInput(
      [area({ width: '0' }), area({ name: 'Valid', width: '50' })],
      [box()],
    );
    expect(input.areas.length).toBe(1);
    expect(input.areas[0].id).toBe('Valid');
  });

  it('filters out boxes with zero dimensions', () => {
    const input = service.buildInput(
      [area()],
      [box({ width: '0' }), box({ name: 'Valid', width: '10' })],
    );
    expect(input.boxes.length).toBe(1);
    expect(input.boxes[0].id).toBe('Valid');
  });

  it('carries the selected units in constraints', () => {
    service.units.set('in');
    const input = service.buildInput([area()], [box()]);
    expect(input.constraints?.units).toBe('in');
  });
});
