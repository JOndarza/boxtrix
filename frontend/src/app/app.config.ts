import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { httpInterceptor } from '@common/guards/http.interceptor';
import { provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import {
  matCameraAlt,
  matFastForward,
  matFastRewind,
  matPause,
  matPlayArrow,
  matSettings,
  matSkipNext,
  matSkipPrevious,
} from '@ng-icons/material-icons/baseline';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpInterceptor])),
    provideIcons({ matSkipPrevious, matFastRewind, matPlayArrow, matPause, matFastForward, matSkipNext, matSettings, matCameraAlt }),
    provideNgIconsConfig({ size: '2rem', color: '#FFF' }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
