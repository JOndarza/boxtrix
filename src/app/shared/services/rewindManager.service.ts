import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RewindManagerService {
  private _maxStepNumber = 0;
  private _minStepNumber = 0;

  private _stepNumber = -1;
  public get stepNumber() {
    return this._stepNumber;
  }

  set(stepNumber: number, minStepNumber: number, maxStepNumber: number) {
    this._stepNumber = stepNumber;
    this._minStepNumber = minStepNumber;
    this._maxStepNumber = maxStepNumber;
  }

  lastest() {
    this._stepNumber = this._maxStepNumber;
  }

  forward() {
    this._stepNumber++;
    if (this._stepNumber > this._maxStepNumber) {
      this._stepNumber = this._minStepNumber;
    }
  }

  back() {
    this._stepNumber--;
    if (this._stepNumber < this._minStepNumber) {
      this._stepNumber = this._maxStepNumber;
    }
  }
}
