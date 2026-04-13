import { Injectable } from '@angular/core';
import { IPosition } from '@common/dtos/Data.interface';
import { ColorRepresentation, Mesh, MeshBasicMaterial, Object3D } from 'three';
import {
  TextGeometry,
  TextGeometryParameters,
} from 'three/examples/jsm/geometries/TextGeometry.js';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

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

type GroupedTexts = Record<string, Record<string, IText[]>>;

@Injectable({ providedIn: 'root' })
export class TextManagerService {
  private _defaultFontType: FontType = FontType.HELVETIKER_REGULAR;
  private _defaultColor: ColorRepresentation = 0xffffff;
  private _textGeometryParameters: Partial<TextGeometryParameters> = {
    size: 0.5,
    depth: 0.1,
  };

  addTo(obj3D: Object3D, ...texts: IText[]) {
    if (!obj3D || !texts || !texts.length) return;

    const groups = this.groupByFontAndColor(texts);

    Object.entries(groups).forEach(([fontType, groupFont]) =>
      Object.entries(groupFont).forEach(([color, groupColor]) => {
        const loader = new FontLoader();
        loader.load(this.normalizeFontKey(fontType), (font) => {
          const material = new MeshBasicMaterial({
            color: this.normalizeColorKey(color),
          });
          material.color.convertSRGBToLinear();

          groupColor.forEach((text) =>
            this.setGeometry(obj3D, text, { font, material }),
          );
        });
      }),
    );
  }

  private groupByFontAndColor(texts: IText[]): GroupedTexts {
    const result: GroupedTexts = {};
    for (const text of texts) {
      const fontKey = String(text.font);
      const colorKey = String(text.color);
      if (!result[fontKey]) result[fontKey] = {};
      if (!result[fontKey][colorKey]) result[fontKey][colorKey] = [];
      result[fontKey][colorKey].push(text);
    }
    return result;
  }

  private normalizeFontKey(font: string) {
    switch (font) {
      case '':
      case 'undefined':
      case 'null':
        return this._defaultFontType;
      default:
        return font;
    }
  }

  private normalizeColorKey(color: string) {
    switch (color) {
      case '':
      case 'undefined':
      case 'null':
        return this._defaultColor;
      default:
        return color;
    }
  }

  private setGeometry(
    parent: Object3D,
    text: IText,
    render: { font: Font; material: MeshBasicMaterial },
  ) {
    const geometry = new TextGeometry(text.label, {
      font: render.font,
      ...this._textGeometryParameters,
      ...text.geometryParameters,
    });

    const mesh = new Mesh(geometry, render.material);
    mesh.position.set(
      text.position?.x || 0,
      text.position?.y || 0,
      text.position?.z || 0,
    );
    parent.add(mesh);
  }
}
