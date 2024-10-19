import { Injectable } from '@angular/core';
import { newId } from '@common/functions/id.function';
import { IProjectInput } from '@common/interfaces/Input.interface';

import { BINPACKINGJSService } from './algorithms/BINPACKINGJS/BINPACKINGJS.service';
import { AppEvent, EventsService } from './events.service';

@Injectable({ providedIn: 'root' })
export class ProcessorService {
  constructor(
    private _bin: BINPACKINGJSService,
    private _events: EventsService
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
      case 'xlxs':
        break;
      default:
        throw Error('File without support.');
    }
  }

  sort(stage: IProjectInput) {
    this.cleanInput(stage);

    stage.id = newId();
    stage.containers?.forEach((item) => (item.id = newId()));
    stage.boxes?.forEach((item) => (item.id = newId()));

    const labelTime = 'Algorithm in';
    console.time(labelTime);
    const data = this._bin.sort(stage);
    console.timeEnd(labelTime);

    this._events.get(AppEvent.LOADED).emit(data);
  }

  private cleanInput(data: IProjectInput) {
    if (!data.units) data.units = 'cm';
    if (!data.containers) data.containers = [];
    if (!data.boxes) data.boxes = [];
  }

  private loadJSON(file: File) {
    const reader = new FileReader();

    // Leer el archivo como texto
    reader.readAsText(file);

    // Cuando el archivo ha sido leído
    reader.onload = () => {
      const json = JSON.parse(reader.result as string);
      this.sort(json as IProjectInput);
    };

    // Manejar errores de lectura
    reader.onerror = () => {
      throw reader.error;
    };
  }
}
