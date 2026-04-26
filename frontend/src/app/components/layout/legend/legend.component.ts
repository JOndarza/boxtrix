import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-legend',
  templateUrl: './legend.template.html',
  host: { class: 'wizard-legend', role: 'complementary', 'aria-label': 'Field glossary' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendComponent {}
