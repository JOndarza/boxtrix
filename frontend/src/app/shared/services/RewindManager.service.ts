import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RewindManagerService {
  private _maxStepNumber = 0;
  public get maxStep() {
    return this._maxStepNumber;
  }

  private _minStepNumber = 0;
  public get minStep() {
    return this._minStepNumber;
  }

  private _step = -1;
  public get step() {
    return this._step;
  }

  public get hasData() {
    return this._step >= 0;
  }

  readonly updated = new Subject<void>();

  set(stepNumber: number, minStepNumber: number, maxStepNumber: number): void {
    this._step = stepNumber;
    this._minStepNumber = minStepNumber;
    this._maxStepNumber = maxStepNumber;
  }

  toFirst(): void {
    this._step = this._minStepNumber;
    this.updated.next();
  }

  toLast(): void {
    this._step = this._maxStepNumber;
    this.updated.next();
  }

  forward(): void {
    this._step++;
    if (this._step > this._maxStepNumber) {
      this._step = this._minStepNumber;
    }
    this.updated.next();
  }

  back(): void {
    this._step--;
    if (this._step < this._minStepNumber) {
      this._step = this._maxStepNumber;
    }
    this.updated.next();
  }
}
