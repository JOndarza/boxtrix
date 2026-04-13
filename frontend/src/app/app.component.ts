import { Component } from '@angular/core';
import {
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

import { CanvasComponent } from './components/canvas/canvas.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { HeaderComponent } from './components/layout/header/header.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { CommunicationService } from '@common/services/communication.service';
import { environment } from 'environment/environment';

// https://fonts.google.com/icons?icon.query=skip
// https://ng-icons.github.io/ng-icons/#/browse-icons

@Component({
  standalone: true,
  imports: [HeaderComponent, FooterComponent, SidebarComponent, CanvasComponent],
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
export class AppComponent {
  constructor(private _communication: CommunicationService) {
    this._communication.setOriginAPI(environment.originApi);
  }
}
