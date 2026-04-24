import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppEvent, EventsService } from '@shared/services/Events.service';
import { ProcessorService } from '@shared/services/Processor.service';
import { take } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-welcome',
  templateUrl: './welcome.template.html',
  host: { class: 'app-welcome' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent implements OnInit {
  private readonly _events = inject(EventsService);
  private readonly _processor = inject(ProcessorService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly dismissed = output<void>();

  ngOnInit(): void {
    // Auto-dismiss when the first render completes (file uploaded from elsewhere)
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

  load(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files?.length) return;
    this._processor.load(files[0]);
  }
}
