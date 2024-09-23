import { Injectable } from '@angular/core';
import { newId } from '@common/functions/id.function';
import { IStage } from '@common/interfaces/Input.interface';

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

  sort(stage: IStage) {
    this.cleanInput(stage);

    stage.id = newId();
    stage.items?.forEach((item) => (item.id = newId()));

    const labelTime = 'Algorithm in';
    console.time(labelTime);
    const data = this._bin.sort(stage);
    console.timeEnd(labelTime);

    this._events.get(AppEvent.LOADED).emit(data);
  }

  private cleanInput(stage: IStage) {
    if (!stage.units) stage.units = 'cm';
    if (!stage.items) stage.items = [];
  }

  private loadJSON(file: File) {
    const reader = new FileReader();

    // Leer el archivo como texto
    reader.readAsText(file);

    // Cuando el archivo ha sido leído
    reader.onload = () => {
      const json = JSON.parse(reader.result as string);
      this.sort(json as IStage);
    };

    // Manejar errores de lectura
    reader.onerror = () => {
      throw reader.error;
    };
  }
}
