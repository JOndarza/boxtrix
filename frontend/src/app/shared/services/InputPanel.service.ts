import { Injectable, inject, signal } from '@angular/core';
import { IInput } from '@common/dtos/Input.interface';
import { ProcessorService } from './Processor.service';

export interface AreaRow { name: string; width: string; height: string; depth: string; }
export interface BoxRow  { name: string; width: string; height: string; depth: string; qty: string; }

export const emptyAreaRow = (): AreaRow => ({ name: '', width: '', height: '', depth: '' });
export const emptyBoxRow  = (): BoxRow  => ({ name: '', width: '', height: '', depth: '', qty: '1' });

@Injectable({ providedIn: 'root' })
export class InputPanelService {
  private readonly _processor = inject(ProcessorService);

  readonly isPanelOpen = signal(false);
  readonly units = signal<'cm' | 'in' | 'mm'>('cm');

  toggle(): void { this.isPanelOpen.update((v) => !v); }
  close(): void  { this.isPanelOpen.set(false); }

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
    const validAreas = areaRows.filter((r) => +r.width > 0 && +r.height > 0 && +r.depth > 0);
    const validBoxes = boxRows.filter((r)  => +r.width > 0 && +r.height > 0 && +r.depth > 0);

    const areas = validAreas.map((r, i) => ({
      id: r.name.trim() || `Area ${i + 1}`,
      width: +r.width, height: +r.height, depth: +r.depth,
      x: 0, y: 0, z: 0,
    }));

    const boxes: IInput['boxes'] = [];
    validBoxes.forEach((r, i) => {
      const qty      = Math.max(1, parseInt(r.qty, 10) || 1);
      const baseName = r.name.trim() || `Box ${i + 1}`;
      for (let q = 0; q < qty; q++) {
        boxes.push({
          id: qty > 1 ? `${baseName} #${q + 1}` : baseName,
          width: +r.width, height: +r.height, depth: +r.depth,
        });
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
