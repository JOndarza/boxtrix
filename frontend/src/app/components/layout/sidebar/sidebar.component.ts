import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Area } from '@common/classes/rendered/Area.class';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import { ContextService } from '@shared/services/Context.service';
import { AppEvent, EventsService } from '@shared/services/Events.service';
import { ProcessorService } from '@shared/services/Processor.service';
import { debounceTime } from 'rxjs';

const UNFITTED = 'UNFITTED';
const COLLAPSED_WIDTH = 36;
const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 280;

@Component({
  standalone: true,
  imports: [DecimalPipe],
  selector: 'app-sidebar',
  templateUrl: './sidebar.template.html',
  host: {
    class: 'app-sidebar',
    '[class.collapsed]': 'isCollapsed()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _events = inject(EventsService);
  private readonly _processor = inject(ProcessorService);
  private readonly _context = inject(ContextService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _cdr = inject(ChangeDetectorRef);

  readonly isLoading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly isCollapsed = signal(false);

  private _currentWidth = DEFAULT_WIDTH;

  get detail() {
    return this._context.detail;
  }

  get units(): string {
    return this._context.project?.units ?? 'cm';
  }

  /** Fitted areas only (excludes the virtual UNFITTED area). */
  get fittedAreas(): Area[] {
    return this._context.project?.areas.filter((a) => a.name !== UNFITTED) ?? [];
  }

  /** Total fitted item count across all areas. */
  get totalFitted(): number {
    return this.fittedAreas.reduce((n, a) => n + a.items.length, 0);
  }

  /** Volume fill percentage for a given area (0-100). */
  fillPct(area: Area): number {
    const total = area.means.width * area.means.height * area.means.depth;
    if (!total) return 0;
    const used = area.items.reduce(
      (s, i) => s + i.fixedMeans.width * i.fixedMeans.height * i.fixedMeans.depth,
      0,
    );
    return Math.round((used / total) * 100);
  }

  colorOf(item: RenderedController): string {
    const c = item.color;
    return typeof c === 'number'
      ? `#${c.toString(16).padStart(6, '0')}`
      : String(c);
  }

  ngOnInit(): void {
    this._events
      .get(AppEvent.RAYCAST)
      .pipe(debounceTime(50), takeUntilDestroyed(this._destroyRef))
      .subscribe((id) => this.selectItem(id));

    this._events
      .get(AppEvent.LOADING)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this.isLoading.set(true);
        this.uploadError.set(null);
      });

    this._events
      .get(AppEvent.RENDERED)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this.isLoading.set(false);
        this._cdr.markForCheck();
      });

    this._events
      .get(AppEvent.LOAD_ERROR)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((msg) => {
        this.isLoading.set(false);
        this.uploadError.set(msg);
        this._cdr.markForCheck();
      });

    this._applyWidth(DEFAULT_WIDTH, true);
  }

  toggleCollapse(): void {
    const collapsing = !this.isCollapsed();
    this.isCollapsed.set(collapsing);
    this._applyWidth(collapsing ? COLLAPSED_WIDTH : this._currentWidth, true);
  }

  onHandleMouseDown(event: MouseEvent): void {
    if (this.isCollapsed()) return;
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = this._currentWidth;
    this._applyWidth(startWidth, false);

    const onMove = (e: MouseEvent) => {
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + e.clientX - startX));
      this._currentWidth = next;
      this._applyWidth(next, false);
    };

    const onUp = () => {
      this._applyWidth(this._currentWidth, true);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
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

  private _applyWidth(px: number, animated: boolean): void {
    const el = this._el.nativeElement as HTMLElement;
    el.style.transition = animated ? 'width 0.2s ease' : 'none';
    el.style.width = `${px}px`;
  }
}
