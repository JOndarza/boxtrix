import { Injectable, signal } from '@angular/core';
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

  readonly isPlaying = signal(false);
  private _playInterval?: ReturnType<typeof setInterval>;

  togglePlay(): void {
    if (this._playInterval) {
      this.stopPlay();
    } else {
      this.isPlaying.set(true);
      this._playInterval = setInterval(() => this.forward(), 800);
    }
  }

  stopPlay(): void {
    if (this._playInterval) {
      clearInterval(this._playInterval);
      this._playInterval = undefined;
    }
    this.isPlaying.set(false);
  }

  set(stepNumber: number, minStepNumber: number, maxStepNumber: number): void {
    this._step = stepNumber;
    this._minStepNumber = minStepNumber;
    this._maxStepNumber = maxStepNumber;
    this.updated.next();
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
