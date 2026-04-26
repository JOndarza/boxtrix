import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppEvent, EventsService } from '@shared/services/Events.service';

@Component({
  standalone: true,
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.template.html',
  host: { class: 'app-loading-overlay' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlayComponent implements OnInit {
  private readonly _events = inject(EventsService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly visible = signal(false);

  ngOnInit(): void {
    this._events
      .get(AppEvent.LOADING)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.visible.set(true));

    this._events
      .get(AppEvent.RENDERED)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.visible.set(false));

    this._events
      .get(AppEvent.LOAD_ERROR)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.visible.set(false));
  }
}
