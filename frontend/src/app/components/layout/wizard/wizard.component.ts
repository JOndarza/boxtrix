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
import { LegendComponent } from '@components/layout/legend/legend.component';
import { downloadFile } from '@common/functions/download.function';
import { AppEvent, EventsService } from '@shared/services/Events.service';
import { InputPanelService } from '@shared/services/InputPanel.service';
import { ProcessorService } from '@shared/services/Processor.service';
import { take } from 'rxjs';

@Component({
  standalone: true,
  imports: [InputPanelComponent, LegendComponent],
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

  downloadTemplate(): void {
    const template = {
      id: 'my-project',
      areas: [{ id: 'shelf-1', width: 100, height: 50, depth: 30, x: 0, y: 0, z: 0 }],
      boxes: [
        { id: 'box-1', width: 20, height: 15, depth: 10 },
        { id: 'box-2', width: 25, height: 12, depth: 8 },
      ],
      constraints: { units: 'cm' },
    };
    downloadFile(JSON.stringify(template, null, 2), 'boxtrix-template.json');
  }
}
