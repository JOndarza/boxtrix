import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.template.html',
  host: {
    class: 'app-header',
  },
})
export class HeaderComponent {}
