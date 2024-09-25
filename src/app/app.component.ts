import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  NgIconComponent,
  provideIcons,
  provideNgIconsConfig,
} from '@ng-icons/core';

import { ComponetsModule } from './components/components.module';

import {
  matPlayArrow,
  matFastForward,
  matFastRewind,
  matSkipPrevious,
  matSkipNext,
} from '@ng-icons/material-icons/baseline';

// https://fonts.google.com/icons?icon.query=skip
// https://ng-icons.github.io/ng-icons/#/browse-icons

@Component({
  standalone: true,
  imports: [RouterOutlet, ComponetsModule, NgIconComponent],
  viewProviders: [
    provideIcons({
      matSkipPrevious,
      matFastRewind,
      matPlayArrow,
      matFastForward,
      matSkipNext,
    }),
    provideNgIconsConfig({
      size: '2rem',
      color: '#FFF',
    }),
  ],
  selector: 'app-root',
  templateUrl: './app.template.html',
  host: {
    class: 'app-root',
  },
})
export class AppComponent {}
