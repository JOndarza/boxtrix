import { Component } from '@angular/core';
import { RewindManagerService } from '@shared/services/RewindManager.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.template.html',
  host: {
    class: 'app-footer',
  },
})
export class FooterComponent {
  private _steps = Array.from({ length: 50 }, (_, i) => i + 1);
  public get steps() {
    return this._steps;
  }

  constructor(private _rewind: RewindManagerService) {}

  first() {
    this._rewind.toFirst();
  }

  back() {
    this._rewind.back();
  }

  play() {}

  forward() {
    this._rewind.forward();
  }

  last() {
    this._rewind.toLast();
  }
}
