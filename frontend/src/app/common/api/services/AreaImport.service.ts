import { Injectable } from '@angular/core';
import { IAreaImportResult } from '@common/dtos/AreaImportResult.interface';

import { ApiServiceBase } from '../apiService.base';

@Injectable({ providedIn: 'root' })
export class AreaImportService extends ApiServiceBase {
  override endpoint = 'areas';

  importDxf(file: File, defaultHeight: number) {
    const form = new FormData();
    form.append('file', file);
    form.append('defaultHeight', defaultHeight.toString());
    return this.post<IAreaImportResult[], FormData>('import-dxf', form);
  }
}
