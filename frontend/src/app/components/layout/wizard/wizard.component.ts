import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IInput } from '@common/dtos/Input.interface';
import { AppEvent, EventsService } from '@shared/services/Events.service';
import { ProcessorService } from '@shared/services/Processor.service';
import { take } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-wizard',
  templateUrl: './wizard.template.html',
  host: { class: 'app-wizard' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardComponent {
  private readonly _processor = inject(ProcessorService);
  private readonly _events = inject(EventsService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly dismissed = output<void>();

  readonly step = signal<1 | 2>(1);
  readonly pendingInput = signal<IInput | null>(null);
  readonly parseError = signal<string | null>(null);

  constructor() {
    // Auto-dismiss if a render completes from an external trigger (e.g. sidebar re-upload)
    this._events
      .get(AppEvent.RENDERED)
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.dismiss());
  }

  dismiss(): void {
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
      this.pendingInput.set(input);
      this.step.set(2);
    } catch {
      this.parseError.set('Could not parse the file. Make sure it is a valid BoxTrix JSON.');
    }
  }

  back(): void {
    this.step.set(1);
    this.pendingInput.set(null);
    this.parseError.set(null);
  }

  onRun(): void {
    const input = this.pendingInput();
    if (!input) return;
    this._processor.sort(input);
    this.dismiss();
  }
}
