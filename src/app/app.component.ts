import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ComponetsModule } from './components/components.module';

@Component({
  standalone: true,
  imports: [RouterOutlet, ComponetsModule],
  selector: 'app-root',
  templateUrl: './app.template.html',
  host: {
    class: 'app-root',
  },
})
export class AppComponent {}
