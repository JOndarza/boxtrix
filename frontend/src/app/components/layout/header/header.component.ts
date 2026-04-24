import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import { GraphicsService } from '@shared/services/Graphics.service';
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
  private readonly _theme = inject(ThemeService);
  private readonly _graphics = inject(GraphicsService);

  get isDark() { return this._theme.isDark; }
  get isPanelOpen() { return this._graphics.isPanelOpen; }

  toggleTheme(): void { this._theme.toggle(); }
  toggleGraphicsPanel(): void { this._graphics.togglePanel(); }
}
