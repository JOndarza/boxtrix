import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { OrganizeService } from '@common/api/services/Organize.service';
import { EventsService, AppEvent } from './Events.service';
import { ProcessorService } from './Processor.service';
import { IInput } from '@common/dtos/Input.interface';
import { Corner } from '@common/enums/Corner.enum';
import { Subject } from 'rxjs';

describe('ProcessorService', () => {
  let service: ProcessorService;
  let organizeSort: jasmine.Spy;
  let eventNext: jasmine.Spy;

  const minimalOutput = {
    id: 'out',
    areas: [],
  };

  beforeEach(() => {
    const eventsStub = {
      get: (_: AppEvent) => ({ next: jasmine.createSpy('next') }),
    };
    eventNext = eventsStub.get(AppEvent.LOADED).next;

    organizeSort = jasmine.createSpy('sort').and.returnValue(of(minimalOutput));

    TestBed.configureTestingModule({
      providers: [
        ProcessorService,
        { provide: OrganizeService, useValue: { sort: organizeSort } },
        { provide: EventsService, useValue: eventsStub },
      ],
    });

    service = TestBed.inject(ProcessorService);
  });

  describe('sort — old-format JSON defaults', () => {
    it('does not throw when constraints is missing', async () => {
      const oldInput: IInput = {
        id: 'old',
        areas: [{ id: 'A', width: 50, height: 50, depth: 50, x: 0, y: 0, z: 0 }],
        boxes: [{ id: 'B', width: 10, height: 10, depth: 10 }],
      };
      await expectAsync(service.sort(oldInput)).toBeResolved();
      const sent: IInput = organizeSort.calls.mostRecent().args[0];
      expect(sent.constraints).toBeDefined();
      expect(sent.constraints!.units).toBe('cm');
    });

    it('does not throw when areas have no accessCorner or exitCorridor', async () => {
      const oldInput: IInput = {
        id: 'old',
        constraints: { units: 'cm' },
        areas: [
          { id: 'Shelf', width: 90, height: 40, depth: 35, x: 0, y: 0, z: 0 },
        ],
        boxes: [{ id: 'Funko', width: 14, height: 19, depth: 10, weight: 0.3 }],
      };
      await expectAsync(service.sort(oldInput)).toBeResolved();
      const sent: IInput = organizeSort.calls.mostRecent().args[0];
      // accessCorner is not set by cleanInput — it stays undefined and the
      // backend defaults to BottomFrontLeft for undefined values
      expect(sent.areas[0].exitCorridor).toBeUndefined();
    });

    it('does not throw when boxes have no weight', async () => {
      const oldInput: IInput = {
        id: 'old',
        areas: [{ id: 'A', width: 50, height: 50, depth: 50, x: 0, y: 0, z: 0 }],
        boxes: [
          { id: 'B1', width: 10, height: 10, depth: 10 },
          { id: 'B2', width: 20, height: 20, depth: 20 },
        ],
      };
      await expectAsync(service.sort(oldInput)).toBeResolved();
      const sent: IInput = organizeSort.calls.mostRecent().args[0];
      sent.boxes.forEach(b => expect(b.weight).toBeUndefined());
    });

    it('fills empty areas array when missing', async () => {
      const badInput = { id: 'bad', boxes: [{ id: 'B', width: 1, height: 1, depth: 1 }] } as IInput;
      await expectAsync(service.sort(badInput)).toBeResolved();
      // cleanInput adds default empty array — no throw
    });

    it('fills empty boxes array when missing', async () => {
      const badInput = { id: 'bad', areas: [{ id: 'A', width: 10, height: 10, depth: 10, x: 0, y: 0, z: 0 }] } as IInput;
      await expectAsync(service.sort(badInput)).toBeResolved();
    });
  });
});
