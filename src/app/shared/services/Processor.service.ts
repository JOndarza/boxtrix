import { Injectable } from '@angular/core';
import { newId } from '@common/functions/id.function';
import { IProjectInput, IStage } from '@common/interfaces/Input.interface';

import { BINPACKINGJSService } from './algorithms/BINPACKINGJS/BINPACKINGJS.service';
import { AppEvent, EventsService } from './events.service';
import { BINPACKINGJSService_V2 } from './algorithms/BINPACKINGJS/BINPACKINGJS_V2.service';

@Injectable({ providedIn: 'root' })
export class ProcessorService {
  constructor(
    private _bin: BINPACKINGJSService,
    private _binV2: BINPACKINGJSService_V2,
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

  sortV2(stage: IProjectInput) {
    this.cleanInputV2(stage);

    stage.id = newId();
    stage.containers?.forEach((item) => (item.id = newId()));
    stage.boxes?.forEach((item) => (item.id = newId()));

    const labelTime = 'Algorithm in';
    console.time(labelTime);
    const data = this._binV2.sort(stage);
    console.timeEnd(labelTime);

    console.log(data);
    // this._events.get(AppEvent.LOADED).emit(data);
  }

  private cleanInput(data: IStage) {
    if (!data.units) data.units = 'cm';
    if (!data.items) data.items = [];
  }

  private cleanInputV2(data: IProjectInput) {
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
      this.sort(json as IStage);
    };

    // Manejar errores de lectura
    reader.onerror = () => {
      throw reader.error;
    };
  }
}
