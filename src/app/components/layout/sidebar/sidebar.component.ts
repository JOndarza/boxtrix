import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ContextService } from '@shared/services/context.service';
import { debounceTime } from 'rxjs';
import { AppEvent, EventsService } from '@shared/services/events.service';
import { StackPlacement } from '@common/classes/StackPlacement.class';
import { ProcessorService } from '@shared/services/Processor.service';

type SidebarListType = StackPlacement & { selected: boolean };
// import data from '@common/templates/input.json';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.template.html',
  host: {
    class: 'app-sidebar',
  },
})
export class SidebarComponent implements OnInit, AfterViewInit {
  [x: string]: any;
  private _sequence!: SidebarListType[];
  public get sequence() {
    return this._sequence;
  }

  constructor(
    private _events: EventsService,
    private _processor: ProcessorService,
    private _context: ContextService
  ) {}

  ngOnInit(): void {
    this._events
      .get(AppEvent.RENDERED)
      .pipe(debounceTime(500))
      .subscribe(this.populateSequence.bind(this));

    this._events
      .get<string>(AppEvent.RAYCAST)
      .pipe(debounceTime(100))
      .subscribe(this.selectItem.bind(this));
  }

  ngAfterViewInit(): void {}

  load(event: any) {
    const files = event.target.files;
    if (files?.length) this._processor.load(files[0]);
  }

  clicked(item: SidebarListType) {
    this._events.get(AppEvent.CLICKED).emit(item.stackable.id);
  }

  private populateSequence() {
    const a = this._context.input.containers
      .map((x) => x.stack.placements.map((p) => p))
      .flatMap((x) => x);

    this._sequence = a as SidebarListType[];
  }

  private selectItem(id: string) {
    this.sequence?.forEach((x) => (x.selected = x.stackable.id === id));
  }
}
