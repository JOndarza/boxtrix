import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OrganizeService } from '@common/api/services/Organize.service';
import {
  NgIconComponent,
  provideIcons,
  provideNgIconsConfig,
} from '@ng-icons/core';
import {
  matFastForward,
  matFastRewind,
  matPlayArrow,
  matSkipNext,
  matSkipPrevious,
} from '@ng-icons/material-icons/baseline';
import { ProcessorService } from '@shared/services/Processor.service';

import { ComponentsModule } from './components/components.module';
import { CommunicationService } from '@common/services/communication.service';
import { environment } from 'environment/environment';

// https://fonts.google.com/icons?icon.query=skip
// https://ng-icons.github.io/ng-icons/#/browse-icons

@Component({
  standalone: true,
  imports: [RouterOutlet, ComponentsModule, NgIconComponent],
  viewProviders: [
    OrganizeService,
    ProcessorService,
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
export class AppComponent {
  constructor(private _comunication: CommunicationService) {
    this._comunication.setOriginAPI(environment.originApi);
  }
}
