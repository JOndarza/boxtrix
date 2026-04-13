import { NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import data from '@common/templates/inputV2.json';
import { ContextService } from '@shared/services/Context.service';
import { AppEvent, EventsService } from '@shared/services/Events.service';
import { ProcessorService } from '@shared/services/Processor.service';
import { debounceTime } from 'rxjs';

@Component({
  standalone: true,
  imports: [NgTemplateOutlet],
  selector: 'app-sidebar',
  templateUrl: './sidebar.template.html',
  host: {
    class: 'app-sidebar',
  },
})
export class SidebarComponent implements OnInit, AfterViewInit {
  get detail() {
    return this._context.detail;
  }

  constructor(
    private _events: EventsService,
    private _processor: ProcessorService,
    private _context: ContextService,
  ) {}

  ngOnInit(): void {
    this._events
      .get<string>(AppEvent.RAYCAST)
      .pipe(debounceTime(50))
      .subscribe(this.selectItem.bind(this));
  }

  ngAfterViewInit(): void {
    this._processor.sort(data as any);
  }

  load(event: any) {
    const files = event.target.files;
    if (files?.length) this._processor.load(files[0]);
  }

  clicked(item: RenderedController) {
    this._events.get<string>(AppEvent.CLICKED).next(item.id);
  }

  private selectItem(id: string) {
    this.detail?.fitted.forEach((x) => (x.selected = x.id === id));
  }
}
