import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommunicationService } from '@common/services/communication.service';
import { environment } from 'environment/environment';

import { CanvasComponent } from './components/canvas/canvas.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { GraphicsSettingsComponent } from './components/layout/graphics-settings/graphics-settings.component';
import { HeaderComponent } from './components/layout/header/header.component';
import { InputPanelComponent } from './components/layout/input-panel/input-panel.component';
import { KeyboardHelpComponent } from './components/layout/keyboard-help/keyboard-help.component';
import { LegendComponent } from './components/layout/legend/legend.component';
import { LoadingOverlayComponent } from './components/layout/loading-overlay/loading-overlay.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { StatsComponent } from './components/layout/stats/stats.component';
import { WizardComponent } from './components/layout/wizard/wizard.component';
import { InputPanelService } from './shared/services/InputPanel.service';

@Component({
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    InputPanelComponent,
    LegendComponent,
    SidebarComponent,
    WizardComponent,
    LoadingOverlayComponent,
    // Deferred: Angular creates lazy chunks for these automatically
    CanvasComponent,
    GraphicsSettingsComponent,
    KeyboardHelpComponent,
    StatsComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.template.html',
  host: { class: 'app-root' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly _communication = inject(CommunicationService);
  private readonly _inputPanel    = inject(InputPanelService);

  readonly showWizard  = signal(true);
  readonly isPanelOpen = this._inputPanel.isPanelOpen;

  constructor() {
    this._communication.setOriginAPI(environment.originApi);
  }

  closePanel(): void {
    this._inputPanel.close();
  }
}
