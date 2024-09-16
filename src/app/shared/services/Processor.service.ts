import { Injectable } from '@angular/core';
import { IInput } from '@common/interfaces/Input.interface';
import { AppEvent, EventsService } from './events.service';
import { BinPackingService } from './BinPacking.service';

@Injectable({ providedIn: 'root' })
export class ProcessorService {
  constructor(
    private _bin: BinPackingService,
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

  process(input: IInput) {
    this.cleanInput(input);
    this._events.get(AppEvent.LOADED).emit(this._bin.sort(input));
  }

  private cleanInput(input: IInput) {
    if (!input.units) input.units = 'cm';
    if (!input.stages) input.stages = [];
    input.stages.forEach((x) => {
      if (!x.items) x.items = [];
    });
  }

  private loadJSON(file: File) {
    const reader = new FileReader();

    // Leer el archivo como texto
    reader.readAsText(file);

    // Cuando el archivo ha sido leído
    reader.onload = () => {
      const json = JSON.parse(reader.result as string);
      this.process(json as IInput);
    };

    // Manejar errores de lectura
    reader.onerror = () => {
      throw reader.error;
    };
  }
}
