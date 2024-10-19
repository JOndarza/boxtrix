import { Injectable } from '@angular/core';
import { ColorRepresentation } from 'three';

@Injectable({ providedIn: 'root' })
export class ContantsService {
  private _ANGULAR_VELOCITY = 0.01;
  public get ANGULAR_VELOCITY() {
    return this._ANGULAR_VELOCITY;
  }

  //#region GRID
  private _GRID_SPACING = 10;
  public get GRID_SPACING() {
    return this._GRID_SPACING;
  }
  //#endregion GRID

  //#region BOX
  private _BOX_OPACITY = 0.7;
  public get BOX_OPACITY() {
    return this._BOX_OPACITY;
  }

  private _BOX_METALNESS = 0.2;
  public get BOX_METALNESS() {
    return this._BOX_METALNESS;
  }

  private _BOX_ROUGHNESS = 1;
  public get BOX_ROUGHNESS() {
    return this._BOX_ROUGHNESS;
  }

  private _BOX_COLOR_UNSET: ColorRepresentation = '#000';
  public get BOX_COLOR_UNSET() {
    return this._BOX_COLOR_UNSET;
  }

  private _BOX_COLOR_RAYCAST: ColorRepresentation = '#FF0000';
  public get BOX_COLOR_RAYCAST() {
    return this._BOX_COLOR_RAYCAST;
  }

  private _BOX_COLOR_CLICKED: ColorRepresentation = '#FFAA00';
  public get BOX_COLOR_CLICKED() {
    return this._BOX_COLOR_CLICKED;
  }
  //#endregion BOX
}
