import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RewindManagerService {
  private _maxStepNumber = 0;
  private _minStepNumber = 0;

  private _step = -1;
  public get step() {
    return this._step;
  }

  readonly updated = new Subject<void>();

  set(stepNumber: number, minStepNumber: number, maxStepNumber: number) {
    this._step = stepNumber;
    this._minStepNumber = minStepNumber;
    this._maxStepNumber = maxStepNumber;
  }

  toFirst() {
    this._step = this._minStepNumber;
    this.updated.next();
  }

  toLast() {
    this._step = this._maxStepNumber;
    this.updated.next();
  }

  forward() {
    this._step++;
    if (this._step > this._maxStepNumber) {
      this._step = this._minStepNumber;
    }
    this.updated.next();
  }

  back() {
    this._step--;
    if (this._step < this._minStepNumber) {
      this._step = this._maxStepNumber;
    }
    this.updated.next();
  }
}
