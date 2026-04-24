import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContextService } from '@shared/services/Context.service';
import { AppEvent, EventsService } from '@shared/services/Events.service';

const UNFITTED = 'UNFITTED';

@Component({
  standalone: true,
  imports: [DecimalPipe],
  selector: 'app-stats',
  templateUrl: './stats.template.html',
  host: { class: 'app-stats' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsComponent implements OnInit {
  private readonly _context = inject(ContextService);
  private readonly _events = inject(EventsService);
  private readonly _cdr = inject(ChangeDetectorRef);
  private readonly _destroyRef = inject(DestroyRef);

  get hasData(): boolean {
    return !!this._context.project;
  }

  get units(): string {
    return this._context.project?.units ?? 'cm';
  }

  /** Total volume of all storage areas (excl. virtual UNFITTED area). */
  get availableVol(): number {
    return (
      this._context.project?.areas
        .filter((a) => a.name !== UNFITTED)
        .reduce((s, a) => s + a.means.width * a.means.height * a.means.depth, 0) ?? 0
    );
  }

  /** Volume of all fitted boxes (post-rotation dimensions). */
  get occupiedVol(): number {
    return (
      this._context.detail?.fitted.reduce(
        (s, b) => s + b.fixedMeans.width * b.fixedMeans.height * b.fixedMeans.depth,
        0,
      ) ?? 0
    );
  }

  /** Volume of items that could not be placed. */
  get unfittedVol(): number {
    return (
      this._context.detail?.unfitted.reduce(
        (s, b) => s + b.fixedMeans.width * b.fixedMeans.height * b.fixedMeans.depth,
        0,
      ) ?? 0
    );
  }

  get wastedVol(): number {
    return Math.max(0, this.availableVol - this.occupiedVol);
  }

  get efficiencyPct(): number {
    if (!this.availableVol) return 0;
    return Math.round((this.occupiedVol / this.availableVol) * 100);
  }

  get fittedCount(): number {
    return this._context.detail?.fitted.length ?? 0;
  }

  get unfittedCount(): number {
    return this._context.detail?.unfitted.length ?? 0;
  }

  ngOnInit(): void {
    this._events
      .get(AppEvent.RENDERED)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this._cdr.markForCheck());
  }
}
