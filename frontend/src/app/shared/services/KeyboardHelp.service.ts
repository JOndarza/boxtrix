import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KeyboardHelpService {
  readonly visible = signal(false);

  toggle(): void {
    this.visible.update((v) => !v);
  }

  close(): void {
    this.visible.set(false);
  }
}
