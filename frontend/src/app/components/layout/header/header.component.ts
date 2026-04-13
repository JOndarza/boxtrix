import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.template.html',
  host: { class: 'app-header' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}
