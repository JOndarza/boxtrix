import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CanvasComponent } from './canvas/canvas.component';
import { FooterComponent } from './layout/footer/footer.component';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { NgIconComponent } from '@ng-icons/core';

@NgModule({
  imports: [CommonModule, NgIconComponent],
  declarations: [
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    CanvasComponent,
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    CanvasComponent,
  ],
})
export class ComponetsModule {}
