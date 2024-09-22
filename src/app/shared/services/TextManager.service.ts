import { Injectable } from '@angular/core';
import { IPosition } from '@common/interfaces/Data.interface';
import _ from 'lodash';
import { ColorRepresentation, Mesh, MeshBasicMaterial, Object3D } from 'three';
import {
  TextGeometry,
  TextGeometryParameters,
} from 'three/examples/jsm/geometries/TextGeometry';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';

export const enum FontType {
  HELVETIKER_REGULAR = 'helvetiker_regular.typeface.json',
}

export interface IText {
  label: string;
  position?: IPosition | undefined;
  font?: FontType | undefined;
  color?: ColorRepresentation | undefined;
  geometryParameters?: Partial<TextGeometryParameters>;
}

@Injectable({ providedIn: 'root' })
export class TextManager {
  private _defaultFontType: FontType = FontType.HELVETIKER_REGULAR;
  private _defaulColor: ColorRepresentation = 0xffffff;
  private _textGeometryParameters: Partial<TextGeometryParameters> = {
    size: 0.5,
    depth: 0.1,
  };

  addTo(obj3D: Object3D, ...texts: IText[]) {
    if (!obj3D || !texts || !texts.length) return;

    const groups = _.chain(texts)
      .groupBy((x) => x.font)
      .mapValues((group) => _.groupBy(group, (x) => x.color))
      .value();

    _.forEach(groups, (groupFont, fontType) =>
      _.forEach(groupFont, (groupColor, color) => {
        const loader = new FontLoader();
        loader.load(this.fixFontGroupings(fontType), (font) => {
          const material = new MeshBasicMaterial({
            color: this.fixColorGroupings(color),
          });
          material.color.convertSRGBToLinear();

          groupColor.forEach((text) =>
            this.setGeometry(obj3D, text, {
              font,
              material,
            })
          );
        });
      })
    );
  }

  private fixFontGroupings(font: string) {
    switch (font) {
      case '':
      case 'undefined':
      case 'null':
        return this._defaultFontType;
      default:
        return font;
    }
  }

  private fixColorGroupings(color: string) {
    switch (color) {
      case '':
      case 'undefined':
      case 'null':
        return this._defaulColor;
      default:
        return color;
    }
  }

  private setGeometry(
    obj3D: Object3D,
    text: IText,
    render: { font: Font; material: MeshBasicMaterial }
  ) {
    const geometry = new TextGeometry(text.label, {
      font: render.font,
      ...this._textGeometryParameters,
    });

    const mesh = new Mesh(geometry, render.material);
    mesh.position.set(
      text.position?.x || 0,
      text.position?.y || 0,
      text.position?.z || 0
    );
    obj3D.add(mesh);
  }
}
