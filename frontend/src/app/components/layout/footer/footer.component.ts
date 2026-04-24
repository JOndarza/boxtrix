import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIconComponent } from '@ng-icons/core';
import { RewindManagerService } from '@shared/services/RewindManager.service';

@Component({
  standalone: true,
  imports: [NgIconComponent, DecimalPipe],
  selector: 'app-footer',
  templateUrl: './footer.template.html',
  host: { class: 'app-footer' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent implements OnInit, OnDestroy {
  private readonly _rewind = inject(RewindManagerService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _cdr = inject(ChangeDetectorRef);

  // H2 — track play state for toggle button label
  readonly isPlaying = signal(false);
  private _playInterval?: ReturnType<typeof setInterval>;

  get step() {
    return this._rewind.step;
  }
  get maxStep() {
    return this._rewind.maxStep;
  }
  get hasData() {
    return this._rewind.hasData;
  }

  get scrubberPct(): number {
    if (!this.hasData || this.maxStep <= 1) return 0;
    return Math.round(((this.step - 1) / (this.maxStep - 1)) * 100);
  }

  ngOnInit(): void {
    // Re-render step counter on every step change (OnPush requires explicit trigger)
    this._rewind.updated
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this._cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this.stopPlay();
  }

  first(): void {
    this._rewind.toFirst();
  }

  back(): void {
    this._rewind.back();
  }

  // H2 — play auto-advances steps every 800ms; second press stops it
  play(): void {
    if (this._playInterval) {
      this.stopPlay();
    } else {
      this.isPlaying.set(true);
      this._playInterval = setInterval(() => this._rewind.forward(), 800);
    }
  }

  forward(): void {
    this._rewind.forward();
  }

  last(): void {
    this._rewind.toLast();
  }

  seek(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this._rewind.set(value, 1, this.maxStep);
  }

  private stopPlay(): void {
    if (this._playInterval) {
      clearInterval(this._playInterval);
      this._playInterval = undefined;
    }
    this.isPlaying.set(false);
  }
}
