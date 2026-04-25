import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import { AppEvent, EventsService } from '@shared/services/Events.service';
import { GraphicsService } from '@shared/services/Graphics.service';
import { InputPanelService } from '@shared/services/InputPanel.service';
import { ThemeService } from '@shared/services/Theme.service';

@Component({
  standalone: true,
  imports: [NgIconComponent],
  selector: 'app-header',
  templateUrl: './header.template.html',
  host: { class: 'app-header' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly _theme    = inject(ThemeService);
  private readonly _graphics = inject(GraphicsService);
  private readonly _input    = inject(InputPanelService);
  private readonly _events   = inject(EventsService);

  get isDark()           { return this._theme.isDark; }
  get isPanelOpen()      { return this._graphics.isPanelOpen; }
  get isInputPanelOpen() { return this._input.isPanelOpen; }

  toggleTheme(): void         { this._theme.toggle(); }
  toggleGraphicsPanel(): void  { this._graphics.togglePanel(); }
  toggleInputPanel(): void    { this._input.toggle(); }
  takeScreenshot(): void      { this._events.get(AppEvent.SCREENSHOT).next(); }
}
