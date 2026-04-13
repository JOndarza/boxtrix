import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommunicationService } from '@common/services/communication.service';
import { environment } from 'environment/environment';

import { CanvasComponent } from './components/canvas/canvas.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { HeaderComponent } from './components/layout/header/header.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';

// https://fonts.google.com/icons?icon.query=skip
// https://ng-icons.github.io/ng-icons/#/browse-icons

@Component({
  standalone: true,
  imports: [HeaderComponent, FooterComponent, SidebarComponent, CanvasComponent],
  selector: 'app-root',
  templateUrl: './app.template.html',
  host: { class: 'app-root' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly _communication = inject(CommunicationService);

  constructor() {
    this._communication.setOriginAPI(environment.originApi);
  }
}
