import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { KeyboardHelpService } from '@shared/services/KeyboardHelp.service';

@Component({
  standalone: true,
  selector: 'app-keyboard-help',
  templateUrl: './keyboard-help.template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyboardHelpComponent {
  private readonly _help = inject(KeyboardHelpService);

  readonly visible = this._help.visible;

  close(): void {
    this._help.close();
  }
}
