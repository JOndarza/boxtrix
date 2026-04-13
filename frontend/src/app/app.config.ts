import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { httpInterceptor } from '@common/guards/http.interceptor';
import { provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import {
  matFastForward,
  matFastRewind,
  matPlayArrow,
  matSkipNext,
  matSkipPrevious,
} from '@ng-icons/material-icons/baseline';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpInterceptor])),
    provideIcons({ matSkipPrevious, matFastRewind, matPlayArrow, matFastForward, matSkipNext }),
    provideNgIconsConfig({ size: '2rem', color: '#FFF' }),
  ],
};
