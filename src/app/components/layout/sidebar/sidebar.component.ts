import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ContextService } from '@shared/services/context.service';
import data from '@common/fakes/test01.json';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.template.html',
  host: {
    class: 'app-sidebar',
  },
})
export class SidebarComponent implements OnInit, AfterViewInit {
  [x: string]: any;
  private _sequence!: {
    name: string;
    id: string;
    w: number;
    h: number;
    d: number;
    selected?: boolean;
  }[];
  public get sequence() {
    return this._sequence;
  }

  constructor(private _context: ContextService) {}

  ngOnInit(): void {
    this._context.loaded
      .pipe(debounceTime(500))
      .subscribe(this.populateSequence.bind(this));
    this._context.raycast
      .pipe(debounceTime(100))
      .subscribe(this.selectItem.bind(this));
  }

  ngAfterViewInit(): void {
    this.load();
  }

  load() {
    this._context.loadData(data as any);
  }

  clicked(id: string) {
    this._context.clicked.emit(id);
  }

  private populateSequence() {
    const a = this._context.input.containers
      .map((x) =>
        x.stack.placements.map((p) => ({
          name: p.stackable.name,
          id: p.stackable.id,
          w: p.stackable.dx,
          h: p.stackable.dy,
          d: p.stackable.dz,
        }))
      )
      .flatMap((x) => x);

    this._sequence = a;
  }

  private selectItem(id: string) {
    this.sequence.forEach((x) => (x.selected = x.id === id));
  }
}
