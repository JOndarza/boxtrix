import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InputPanelComponent } from '@components/layout/input-panel/input-panel.component';
import { AppEvent, EventsService } from '@shared/services/Events.service';
import { InputPanelService } from '@shared/services/InputPanel.service';
import { ProcessorService } from '@shared/services/Processor.service';
import { take } from 'rxjs';

@Component({
  standalone: true,
  imports: [InputPanelComponent],
  selector: 'app-wizard',
  templateUrl: './wizard.template.html',
  host: { class: 'app-wizard' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardComponent {
  private readonly _processor = inject(ProcessorService);
  private readonly _events    = inject(EventsService);
  private readonly _inputPanel = inject(InputPanelService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly dismissed = output<void>();
  readonly step       = signal<1 | 2>(1);
  readonly parseError = signal<string | null>(null);

  constructor() {
    this._events
      .get(AppEvent.RENDERED)
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.dismiss());
  }

  dismiss(): void {
    this._inputPanel.wizardMode.set(false);
    this._inputPanel.close();
    this.dismissed.emit();
  }

  loadDemo(): void {
    this._processor.loadDemo();
    this.dismiss();
  }

  async onFileSelected(event: Event): Promise<void> {
    const files = (event.target as HTMLInputElement).files;
    if (!files?.length) return;

    this.parseError.set(null);
    try {
      const input = await this._processor.parseJson(files[0]);
      this._inputPanel.loadFromInput(input);
      this._inputPanel.wizardMode.set(true);
      this.step.set(2);
    } catch {
      this.parseError.set('Could not parse the file. Make sure it is a valid BoxTrix JSON.');
    }
  }

  back(): void {
    this._inputPanel.wizardMode.set(false);
    this._inputPanel.close();
    this.step.set(1);
    this.parseError.set(null);
  }
}
