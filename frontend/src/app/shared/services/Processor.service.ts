import { Injectable } from '@angular/core';
import { OrganizeService } from '@common/api/services/Organize.service';
import { Area } from '@common/classes/rendered/Area.class';
import { Project } from '@common/classes/rendered/Project.class';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import { IBox, IInput } from '@common/dtos/Input.interface';
import { IOrganizedArea, IOutput } from '@common/dtos/Output.interface';
import { newId } from '@common/functions/id.function';

import { AppEvent, EventsService } from './events.service';

@Injectable()
export class ProcessorService {
  constructor(
    private _events: EventsService,
    private _organize: OrganizeService,
  ) {}

  load(file: File) {
    if (!file) {
      throw Error('Without file.');
    }

    this._events.get(AppEvent.LOADING).emit();

    switch (file.type) {
      case 'application/json':
        this.loadJSON(file);
        break;
      // case 'xlxs':
      //   break;
      default:
        throw Error('File without support.');
    }
  }

  sort(input: IInput) {
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

    this._organize.sort(input).subscribe((x) => {
      const project = this.handle(input, x);
      console.timeEnd(labelTime);

      this._events.get(AppEvent.LOADED).emit(project);
    });
  }

  private cleanInput(data: IInput) {
    if (!data.constraints) data.constraints = { units: 'cm' };
    if (!data.areas) data.areas = [];
    if (!data.boxes) data.boxes = [];
  }

  private loadJSON(file: File) {
    const reader = new FileReader();

    // Leer el archivo como texto
    reader.readAsText(file);

    // Cuando el archivo ha sido leído
    reader.onload = () => {
      const json = JSON.parse(reader.result as string);
      this.sort(json as IInput);
    };

    // Manejar errores de lectura
    reader.onerror = () => {
      throw reader.error;
    };
  }

  private handle(input: IInput, output: IOutput) {
    const areas = this.mapAreas(input, output);
    return new Project(areas);
  }

  private mapAreas(input: IInput, output: IOutput) {
    const areas: Area[] = [];

    let previous: Area | null = null;

    for (let i = 0; i < output.areas.length; i++) {
      const organized = output.areas[i];

      const area = new Area(
        organized.id,
        organized.name || '',
        organized.detail,
        {
          means: organized,
          position: organized,
        },
      );

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

  private mapItems(organized: IOrganizedArea, originals: IBox[]) {
    const items = organized.boxes?.map((box) => {
      const item = originals.find((i) => i.id === box.id) || ({} as IBox);

      return new RenderedController(
        item.id,
        item.name || '',
        item.detail || '',
        {
          type: 'box',
          targable: true,
          position: {
            x: box.position.x,
            y: box.position.y,
            z: box.position.z,
          },
          means: item,
          rotation: box.rotation,
        },
      );
    });

    return items ?? [];
  }
}
