import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ContextService } from '@shared/services/context.service';
import data from '@common/fakes/test01.json';
import { debounceTime } from 'rxjs';
import { AppEvent, EventsService } from '@shared/services/events.service';
import { StackPlacement } from '@common/classes/StackPlacement.class';

type SidebarListType = StackPlacement & { selected: boolean };

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
    private _context: ContextService
  ) {}

  ngOnInit(): void {
    this._events
      .get(AppEvent.LOADED)
      .pipe(debounceTime(500))
      .subscribe(this.populateSequence.bind(this));

    this._events
      .get<string>(AppEvent.RAYCAST)
      .pipe(debounceTime(100))
      .subscribe(this.selectItem.bind(this));
  }

  ngAfterViewInit(): void {
    this.load();
  }

  load() {
    this._context.loadData(data as any);
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
