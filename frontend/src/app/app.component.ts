import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommunicationService } from '@common/services/communication.service';
import { environment } from 'environment/environment';

import { CanvasComponent } from './components/canvas/canvas.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { GraphicsSettingsComponent } from './components/layout/graphics-settings/graphics-settings.component';
import { HeaderComponent } from './components/layout/header/header.component';
import { InputPanelComponent } from './components/layout/input-panel/input-panel.component';
import { KeyboardHelpComponent } from './components/layout/keyboard-help/keyboard-help.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { StatsComponent } from './components/layout/stats/stats.component';
import { WelcomeComponent } from './components/layout/welcome/welcome.component';

@Component({
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    GraphicsSettingsComponent,
    InputPanelComponent,
    KeyboardHelpComponent,
    SidebarComponent,
    StatsComponent,
    CanvasComponent,
    WelcomeComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.template.html',
  host: { class: 'app-root' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly _communication = inject(CommunicationService);

  readonly showWelcome = signal(true);

  constructor() {
    this._communication.setOriginAPI(environment.originApi);
  }
}
