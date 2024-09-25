import { EventEmitter, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RewindManagerService {
  private _maxStepNumber = 0;
  private _minStepNumber = 0;

  private _step = -1;
  public get step() {
    return this._step;
  }

  private _updated = new EventEmitter();
  public get updated() {
    return this._updated;
  }

  set(stepNumber: number, minStepNumber: number, maxStepNumber: number) {
    this._step = stepNumber;
    this._minStepNumber = minStepNumber;
    this._maxStepNumber = maxStepNumber;
  }

  toFirst() {
    this._step = this._minStepNumber;
    this.updated.emit();
  }

  toLast() {
    this._step = this._maxStepNumber;
    this.updated.emit();
  }

  forward() {
    this._step++;
    if (this._step > this._maxStepNumber) {
      this._step = this._minStepNumber;
    }
    this.updated.emit();
  }

  back() {
    this._step--;
    if (this._step < this._minStepNumber) {
      this._step = this._maxStepNumber;
    }
    this.updated.emit();
  }
}
