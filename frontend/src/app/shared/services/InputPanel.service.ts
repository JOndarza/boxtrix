import { Injectable, inject, signal } from '@angular/core';
import { Corner } from '@common/enums/Corner.enum';
import { IArea, IBox, IInput } from '@common/dtos/Input.interface';
import { ProcessorService } from './Processor.service';

export interface AreaRow {
  name: string;
  width: string;
  height: string;
  depth: string;
  accessCorner: Corner;
  corridor?: CorridorRow | null;
}

export interface CorridorRow {
  x: string;
  y: string;
  z: string;
  width: string;
  height: string;
  depth: string;
}

export interface BoxRow {
  name: string;
  width: string;
  height: string;
  depth: string;
  qty: string;
  weight: string;
}

export const emptyAreaRow = (): AreaRow => ({
  name: '',
  width: '',
  height: '',
  depth: '',
  accessCorner: Corner.BottomFrontLeft,
  corridor: null,
});

export const emptyBoxRow = (): BoxRow => ({
  name: '',
  width: '',
  height: '',
  depth: '',
  qty: '1',
  weight: '',
});

@Injectable({ providedIn: 'root' })
export class InputPanelService {
  private readonly _processor = inject(ProcessorService);

  readonly isPanelOpen = signal(false);
  readonly units = signal<'cm' | 'in' | 'mm'>('cm');
  readonly weightUnits = signal<'kg' | 'lb'>('kg');
  readonly wizardMode = signal(false);
  readonly pendingLoad = signal<IInput | null>(null);

  toggle(): void { this.isPanelOpen.update((v) => !v); }
  close(): void  { this.isPanelOpen.set(false); }
  open(): void   { this.isPanelOpen.set(true); }

  loadFromInput(input: IInput): void {
    if (input.constraints?.units) this.units.set(input.constraints.units as 'cm' | 'in' | 'mm');
    this.pendingLoad.set(input);
    this.open();
  }

  run(areas: AreaRow[], boxes: BoxRow[]): void {
    const input = this.buildInput(areas, boxes);
    this._processor.sort(input);
    this.close();
  }

  exportJson(areas: AreaRow[], boxes: BoxRow[]): void {
    const input = this.buildInput(areas, boxes);
    const blob = new Blob([JSON.stringify(input, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'boxtrix-packing.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  buildInput(areaRows: AreaRow[], boxRows: BoxRow[]): IInput {
    const r3 = (v: string) => Math.round(+v * 1000) / 1000;
    const validAreas = areaRows.filter((r) => +r.width > 0 && +r.height > 0 && +r.depth > 0);
    const validBoxes = boxRows.filter((r)  => +r.width > 0 && +r.height > 0 && +r.depth > 0);

    const areas: IArea[] = validAreas.map((r, i) => {
      const area: IArea = {
        id: r.name.trim() || `Area ${i + 1}`,
        width: r3(r.width), height: r3(r.height), depth: r3(r.depth),
        x: 0, y: 0, z: 0,
        accessCorner: r.accessCorner ?? Corner.BottomFrontLeft,
      };

      if (r.corridor) {
        const c = r.corridor;
        const w = r3(c.width);
        const h = r3(c.height);
        const d = r3(c.depth);
        if (w > 0 && h > 0 && d > 0) {
          area.exitCorridor = { x: r3(c.x), y: r3(c.y), z: r3(c.z), width: w, height: h, depth: d };
        }
      }
      return area;
    });

    const boxes: IBox[] = [];
    validBoxes.forEach((r, i) => {
      const qty      = Math.max(1, parseInt(r.qty, 10) || 1);
      const baseName = r.name.trim() || `Box ${i + 1}`;
      const weight   = +r.weight;
      for (let q = 0; q < qty; q++) {
        const box: IBox = {
          id: qty > 1 ? `${baseName} #${q + 1}` : baseName,
          width: r3(r.width), height: r3(r.height), depth: r3(r.depth),
        };
        if (weight > 0) box.weight = weight;
        boxes.push(box);
      }
    });

    return {
      id: 'user-input',
      name: 'User packing',
      constraints: { units: this.units() as 'cm' },
      areas,
      boxes,
    };
  }
}
