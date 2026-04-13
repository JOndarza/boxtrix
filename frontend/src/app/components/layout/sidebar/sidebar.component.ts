import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import { ContextService } from '@shared/services/Context.service';
import { AppEvent, EventsService } from '@shared/services/Events.service';
import { ProcessorService } from '@shared/services/Processor.service';
import { debounceTime } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.template.html',
  host: { class: 'app-sidebar' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  private readonly _events = inject(EventsService);
  private readonly _processor = inject(ProcessorService);
  private readonly _context = inject(ContextService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _cdr = inject(ChangeDetectorRef);

  // H1 — loading/error state for file upload feedback
  readonly isLoading = signal(false);
  readonly uploadError = signal<string | null>(null);

  get detail() {
    return this._context.detail;
  }

  // M2 — convert Three.js ColorValue (string | number) to CSS color string
  colorOf(item: RenderedController): string {
    const c = item.color;
    return typeof c === 'number'
      ? `#${c.toString(16).padStart(6, '0')}`
      : String(c);
  }

  ngOnInit(): void {
    // C1 — all subscriptions unsubscribe on destroy
    this._events
      .get(AppEvent.RAYCAST)
      .pipe(debounceTime(50), takeUntilDestroyed(this._destroyRef))
      .subscribe((id) => this.selectItem(id));

    // H1 — toggle loading state in sync with the algorithm lifecycle
    this._events
      .get(AppEvent.LOADING)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this.isLoading.set(true);
        this.uploadError.set(null);
      });

    // Re-render with OnPush after scene is ready; clear loading state
    this._events
      .get(AppEvent.RENDERED)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this.isLoading.set(false);
        this._cdr.markForCheck();
      });
  }

  load(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files?.length) return;

    try {
      this._processor.load(files[0]);
    } catch (err) {
      this.isLoading.set(false);
      this.uploadError.set(err instanceof Error ? err.message : 'Upload failed.');
    }
  }

  clicked(item: RenderedController): void {
    this._events.get(AppEvent.CLICKED).next(item.id);
  }

  private selectItem(id: string): void {
    this.detail?.fitted.forEach((x) => (x.selected = x.id === id));
    this._cdr.markForCheck();
  }
}
