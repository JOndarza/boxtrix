import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OrganizeService } from '@common/api/services/Organize.service';
import { Area } from '@common/classes/rendered/Area.class';
import { Project } from '@common/classes/rendered/Project.class';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import { IBox, IInput } from '@common/dtos/Input.interface';
import { IOrganizedArea, IOutput } from '@common/dtos/Output.interface';
import { newId } from '@common/functions/id.function';

import { AppEvent, EventsService } from './Events.service';

@Injectable({ providedIn: 'root' })
export class ProcessorService {
  private readonly _events = inject(EventsService);
  private readonly _organize = inject(OrganizeService);

  load(file: File): void {
    if (!file) throw Error('Without file.');

    this._events.get(AppEvent.LOADING).next();

    switch (file.type) {
      case 'application/json':
        this.loadJSON(file);
        break;
      default:
        throw Error('File without support.');
    }
  }

  async sort(input: IInput): Promise<void> {
    this.cleanInput(input);

    input.id = newId();
    input.areas?.forEach((x) => {
      x.name = x.id;
      x.id = newId();
    });
    input.boxes?.forEach((x) => {
      x.name = x.id;
      x.id = newId();
    });

    const labelTime = 'Algorithm in';
    console.time(labelTime);

    try {
      const output = await firstValueFrom(this._organize.sort(input));
      const project = this.handle(input, output);
      console.timeEnd(labelTime);
      this._events.get(AppEvent.LOADED).next(project);
    } catch (error) {
      console.timeEnd(labelTime);
      console.error('Sort failed:', error);
      const msg = error instanceof Error ? error.message : 'Backend error — check the JSON and try again.';
      this._events.get(AppEvent.LOAD_ERROR).next(msg);
    }
  }

  private cleanInput(data: IInput): void {
    if (!data.constraints) data.constraints = { units: 'cm' };
    if (!data.areas) data.areas = [];
    if (!data.boxes) data.boxes = [];
  }

  private loadJSON(file: File): void {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      const json = JSON.parse(reader.result as string);
      this.sort(json as IInput);
    };
    reader.onerror = () => {
      throw reader.error;
    };
  }

  private handle(input: IInput, output: IOutput): Project {
    const areas = this.mapAreas(input, output);
    return new Project(areas, input.constraints?.units ?? 'cm');
  }

  private mapAreas(input: IInput, output: IOutput): Area[] {
    const areas: Area[] = [];
    let previous: Area | null = null;

    for (let i = 0; i < output.areas.length; i++) {
      const organized = output.areas[i];

      const area = new Area(organized.id, organized.name || '', organized.detail, {
        means: organized,
        position: organized,
      });

      const items = this.mapItems(organized, input.boxes);
      area.setItems(items);

      if (organized.fixedMeans) area.fixedMeans.set(organized.fixedMeans);
      area.setGlobalStep(i);
      area.setGlobalSteps(previous?.itemCount ?? 0);

      previous = area;
      areas.push(area);
    }

    return areas;
  }

  private mapItems(organized: IOrganizedArea, originals: IBox[]): RenderedController[] {
    return (
      organized.boxes?.map((box) => {
        const item = originals.find((i) => i.id === box.id) || ({} as IBox);
        return new RenderedController(item.id, item.name || '', item.detail || '', {
          type: 'box',
          targetable: true,
          position: { x: box.position.x, y: box.position.y, z: box.position.z },
          means: item,
          rotation: box.rotation,
        });
      }) ?? []
    );
  }
}
