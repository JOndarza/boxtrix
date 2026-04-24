import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputPanelService } from '@shared/services/InputPanel.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  selector: 'app-input-panel',
  templateUrl: './input-panel.template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputPanelComponent {
  private readonly _panel = inject(InputPanelService);
  private readonly _fb    = inject(FormBuilder);

  readonly isPanelOpen    = this._panel.isPanelOpen;
  readonly units          = this._panel.units;
  readonly validationError = signal<string | null>(null);

  readonly form = this._fb.group({
    areas: this._fb.array([this._newAreaGroup()]),
    boxes: this._fb.array([this._newBoxGroup()]),
  });

  get areas(): FormArray<FormGroup> { return this.form.get('areas') as FormArray<FormGroup>; }
  get boxes(): FormArray<FormGroup> { return this.form.get('boxes') as FormArray<FormGroup>; }

  @HostListener('document:keydown.escape')
  close(): void { this._panel.close(); }

  // ── Areas ─────────────────────────────────────────────────────────────────
  addArea(): void {
    this.areas.push(this._newAreaGroup());
  }

  removeArea(i: number): void {
    if (this.areas.length > 1) {
      this.areas.removeAt(i);
    } else {
      this.areas.at(0).reset({ name: '', width: '', height: '', depth: '' });
    }
  }

  onAreaDepthEnter(i: number): void {
    if (i === this.areas.length - 1) this.addArea();
  }

  // ── Boxes ──────────────────────────────────────────────────────────────────
  addBox(): void {
    this.boxes.push(this._newBoxGroup());
  }

  removeBox(i: number): void {
    if (this.boxes.length > 1) {
      this.boxes.removeAt(i);
    } else {
      this.boxes.at(0).reset({ name: '', width: '', height: '', depth: '', qty: '1' });
    }
  }

  onBoxQtyEnter(i: number): void {
    if (i === this.boxes.length - 1) this.addBox();
  }

  // ── Units ──────────────────────────────────────────────────────────────────
  setUnits(event: Event): void {
    this._panel.units.set((event.target as HTMLSelectElement).value as 'cm' | 'in' | 'mm');
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  run(): void {
    const areas = this.areas.value;
    const boxes = this.boxes.value;

    const validAreas = areas.filter((r: { width: string; height: string; depth: string }) =>
      +r.width > 0 && +r.height > 0 && +r.depth > 0);
    const validBoxes = boxes.filter((r: { width: string; height: string; depth: string }) =>
      +r.width > 0 && +r.height > 0 && +r.depth > 0);

    if (!validAreas.length) { this.validationError.set('Add at least one area with dimensions.'); return; }
    if (!validBoxes.length) { this.validationError.set('Add at least one box with dimensions.'); return; }

    this.validationError.set(null);
    this._panel.run(areas, boxes);
  }

  exportJson(): void {
    this._panel.exportJson(this.areas.value, this.boxes.value);
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private _newAreaGroup(): FormGroup {
    return this._fb.group({
      name:   [''],
      width:  ['', Validators.min(0.01)],
      height: ['', Validators.min(0.01)],
      depth:  ['', Validators.min(0.01)],
    });
  }

  private _newBoxGroup(): FormGroup {
    return this._fb.group({
      name:   [''],
      width:  ['', Validators.min(0.01)],
      height: ['', Validators.min(0.01)],
      depth:  ['', Validators.min(0.01)],
      qty:    ['1'],
    });
  }
}
