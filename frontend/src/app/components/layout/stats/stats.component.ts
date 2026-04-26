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

  get availableVol(): number   { return this._context.project?.stats.availableVolume ?? 0; }
  get occupiedVol(): number    { return this._context.project?.stats.occupiedVolume  ?? 0; }
  get unfittedVol(): number    { return this._context.project?.stats.unplacedVolume  ?? 0; }
  get wastedVol(): number      { return this._context.project?.stats.wastedVolume    ?? 0; }
  get efficiencyPct(): number  { return this._context.project?.stats.efficiencyPct   ?? 0; }
  get fittedCount(): number    { return this._context.project?.stats.placedCount     ?? 0; }
  get unfittedCount(): number  { return this._context.project?.stats.unplacedCount   ?? 0; }

  ngOnInit(): void {
    this._events
      .get(AppEvent.RENDERED)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this._cdr.markForCheck());
  }
}
