import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OrganizeService } from '@common/api/services/Organize.service';
import { Area } from '@common/classes/rendered/Area.class';
import { Project } from '@common/classes/rendered/Project.class';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import { IBox, IInput } from '@common/dtos/Input.interface';
import { IOrganizedArea, IOutput } from '@common/dtos/Output.interface';
import { Corner } from '@common/enums/Corner.enum';
import { newId } from '@common/functions/id.function';

import { AppEvent, EventsService } from './Events.service';

// Edge cases covered:
//  1. Multiple areas with very different shapes (wide/flat drawer, tall cabinet, small showcase)
//  2. Standard Funkos — typical base case (14×19×10)
//  3. Oversized 10" Funkos — need taller areas (22×32×18)
//  4. Ultra-thin comics (depth 1 cm) — high-density horizontal packing
//  5. Thick omnibus volumes (depth 3 cm) — moderate depth
//  6. Acrylic dividers (depth 0.5 cm) — near-zero depth edge
//  7. Flat art books — large footprint, fit only in the flat drawer
//  8. Cube-shaped items — rotation is symmetric, tests algorithm's orientation handling
//  9. Very small items (5×4×3 cm pin boxes) — tiny volume edge
// 10. LEGO Technic — wide & tall, tight fit in main shelf (48×38 vs 50×40)
// 11. Board games — flat & wide, routed to drawer
// 12. GUARANTEED UNFITTED — three items whose minimum dimension exceeds every area's minimum
const DEMO_INPUT: IInput = {
  id: 'mega-demo',
  name: 'Mega Demo — Ultimate Collector Storage',
  constraints: { units: 'cm', stackable: true, maxStackHeight: 80 },
  areas: [
    // Largest area — processes first; fits most mid-size items.
    // accessCorner=BottomFrontRight: shelf has its access on the right side, so
    // boxes pile up from the right edge inward to keep the right corridor clear.
    // exitCorridor blocks a 30×40×35 strip at x=0 — that's the actual access path.
    {
      id: 'Main Shelf',
      width: 120, height: 40, depth: 35, x: 0, y: 0, z: 0,
      accessCorner: Corner.BottomFrontRight,
      exitCorridor: { x: 0, y: 0, z: 0, width: 30, height: 40, depth: 35 },
    },
    // Tall narrow cabinet — ideal for large figures
    { id: 'Display Cabinet', width: 50, height: 90, depth: 28, x: 125, y: 0, z: 0, accessCorner: Corner.BottomFrontLeft },
    // Upper shelf — shorter height stress-tests 10" Funkos
    { id: 'Upper Shelf', width: 120, height: 25, depth: 35, x: 0, y: 45, z: 0, accessCorner: Corner.BottomBackLeft },
    // Very flat drawer — only 12 cm tall, forces flat items (books, board games)
    { id: 'Flat Drawer', width: 80, height: 12, depth: 50, x: 0, y: -15, z: 0, accessCorner: Corner.BottomFrontLeft },
    // Tiny showcase — only a single small Funko fits; everything else overflows
    { id: 'Micro Showcase', width: 18, height: 24, depth: 12, x: 125, y: 95, z: 0, accessCorner: Corner.BottomFrontLeft },
  ],
  boxes: [
    // Standard Funkos (14×19×10 cm, 0.3 kg) ─────────────────────────────
    { id: 'Funko — Spider-Man',      width: 14, height: 19, depth: 10, weight: 0.30 },
    { id: 'Funko — Batman',          width: 14, height: 19, depth: 10, weight: 0.30 },
    { id: 'Funko — Iron Man',        width: 14, height: 19, depth: 10, weight: 0.30 },
    { id: 'Funko — Darth Vader',     width: 14, height: 19, depth: 10, weight: 0.30 },
    { id: 'Funko — Goku SSJ',        width: 14, height: 22, depth: 10, weight: 0.35 },
    { id: 'Funko — Link (Zelda)',     width: 14, height: 19, depth: 10, weight: 0.30 },
    { id: 'Funko — Master Chief',    width: 14, height: 19, depth: 10, weight: 0.30 },
    { id: 'Funko — Samus Aran',      width: 14, height: 19, depth: 10, weight: 0.30 },
    { id: 'Funko — Pikachu',         width: 14, height: 16, depth: 10, weight: 0.25 },
    { id: 'Funko — Thanos',          width: 14, height: 22, depth: 10, weight: 0.40 },
    { id: 'Funko — Deadpool',        width: 14, height: 19, depth: 10, weight: 0.30 },
    { id: 'Funko — Wolverine',       width: 14, height: 19, depth: 10, weight: 0.30 },
    { id: 'Funko — Yoda',            width: 14, height: 19, depth: 10, weight: 0.30 },
    { id: 'Funko — Mandalorian',     width: 14, height: 22, depth: 10, weight: 0.35 },

    // Oversized 10" Funkos (22×32×18 cm) — too tall for Upper Shelf (25 h) ──
    { id: 'Funko 10" — Hulk',        width: 22, height: 32, depth: 18, weight: 1.20 },
    { id: 'Funko 10" — Thanos',      width: 22, height: 32, depth: 18, weight: 1.20 },
    { id: 'Funko 10" — Galactus',    width: 22, height: 36, depth: 18, weight: 1.40 },

    // Ultra-thin comics (depth 1 cm) — high-density horizontal packing ────
    { id: 'Comic — Amazing Spider-Man #1', width: 17, height: 26, depth: 1, weight: 0.15 },
    { id: 'Comic — X-Men #1',              width: 17, height: 26, depth: 1, weight: 0.15 },
    { id: 'Comic — Watchmen #1',           width: 17, height: 26, depth: 1, weight: 0.15 },
    { id: 'Comic — Sandman #1',            width: 17, height: 26, depth: 1, weight: 0.15 },
    { id: 'Comic — Batman: Year One',      width: 17, height: 26, depth: 1, weight: 0.15 },
    { id: 'Comic — Saga #1',               width: 17, height: 26, depth: 1, weight: 0.15 },
    { id: 'Comic — Akira Vol.1',           width: 17, height: 26, depth: 1, weight: 0.15 },
    { id: 'Comic — Berserk Vol.1',         width: 17, height: 26, depth: 1, weight: 0.15 },
    { id: 'Comic — One Piece Vol.1',       width: 17, height: 26, depth: 1, weight: 0.15 },
    { id: 'Comic — Naruto Vol.1',          width: 17, height: 26, depth: 1, weight: 0.15 },

    // Thick manga omnibus (depth 3 cm) ────────────────────────────────────
    { id: 'Omnibus — Berserk Deluxe Vol.1',    width: 17, height: 26, depth: 3, weight: 0.40 },
    { id: 'Omnibus — One Piece Deluxe Vol.1',  width: 17, height: 26, depth: 3, weight: 0.40 },
    { id: 'Omnibus — Vagabond Deluxe Vol.1',   width: 17, height: 26, depth: 3, weight: 0.40 },

    // Near-zero depth: acrylic dividers (0.5 cm) ─────────────────────────
    { id: 'Acrylic Divider A', width: 17, height: 26, depth: 0.5, weight: 0.10 },
    { id: 'Acrylic Divider B', width: 17, height: 26, depth: 0.5, weight: 0.10 },

    // LEGO sets ───────────────────────────────────────────────────────────
    { id: 'LEGO — Millennium Falcon Mini', width: 26, height: 19, depth:  6, weight: 0.80 },
    { id: 'LEGO — X-Wing Mini',            width: 22, height: 16, depth:  6, weight: 0.65 },
    // Tight fit: 48×38 barely under Main Shelf 120×40 — tests boundary precision
    { id: 'LEGO — Technic Supercar',       width: 48, height: 38, depth: 10, weight: 2.20 },

    // Flat art books — large footprint, only fit in the 12 cm tall drawer ─
    { id: 'Art Book — The Art of Dark Souls', width: 35, height: 5, depth: 28, weight: 2.00 },
    { id: 'Art Book — The Art of Zelda',      width: 30, height: 4, depth: 24, weight: 1.50 },

    // Cube-shaped items — symmetric rotation, algorithm must not loop ──────
    { id: 'Display Cube — Metal Gear Solid', width: 20, height: 20, depth: 20, weight: 0.50 },
    { id: 'Display Cube — Final Fantasy VII', width: 15, height: 15, depth: 15, weight: 0.40 },

    // Very small items (pin-box scale) ────────────────────────────────────
    { id: 'Pin Box — Spider-Man',  width: 6, height: 4, depth: 3, weight: 0.05 },
    { id: 'Pin Box — Batman',      width: 6, height: 4, depth: 3, weight: 0.05 },
    { id: 'Watch Box — Gamer Ed.', width: 15, height: 10, depth: 15, weight: 0.50 },

    // Board games — flat & wide, fill the drawer ──────────────────────────
    { id: 'Board Game — Wingspan',  width: 29, height: 8, depth: 29, weight: 1.50 },
    { id: 'Board Game — Pandemic',  width: 28, height: 6, depth: 28, weight: 1.20 },
    { id: 'Board Game — Catan',     width: 27, height: 7, depth: 27, weight: 1.10 },

    // GUARANTEED UNFITTED — min dimension exceeds every area's min dimension
    // All areas have at least one dimension ≤ 35 cm; these items need ≥ 55 in all dims
    { id: 'UNFITTED — Giant Statue (80×80×80 cm)',      width: 80, height: 80, depth: 80, weight: 15.0 },
    { id: 'UNFITTED — Shipping Crate (75×70×60 cm)',    width: 75, height: 70, depth: 60, weight: 20.0 },
    { id: 'UNFITTED — Exhibition Pedestal (55×55×55)', width: 55, height: 55, depth: 55, weight:  8.0 },
  ],
};

@Injectable({ providedIn: 'root' })
export class ProcessorService {
  private readonly _events = inject(EventsService);
  private readonly _organize = inject(OrganizeService);

  loadDemo(): void {
    this._events.get(AppEvent.LOADING).next();
    // structuredClone needed: sort() mutates ids/names in-place; a shallow spread would
    // corrupt DEMO_INPUT.areas and DEMO_INPUT.boxes on the second run
    this.sort(structuredClone(DEMO_INPUT));
  }

  load(file: File): void {
    if (!file) throw Error('Without file.');

    this._events.get(AppEvent.LOADING).next();

    switch (file.type) {
      case 'application/json':
        this.loadJSON(file);
        break;
      default:
        throw Error('File without support.');
    }
  }

  async sort(input: IInput): Promise<void> {
    this.cleanInput(input);

    input.id = newId();
    input.areas?.forEach((x) => {
      x.name = x.id;
      x.id = newId();
    });
    input.boxes?.forEach((x) => {
      x.name = x.id;
      x.id = newId();
    });

    const labelTime = 'Algorithm in';
    console.time(labelTime);

    try {
      const output = await firstValueFrom(this._organize.sort(input));
      const project = this.handle(input, output);
      console.timeEnd(labelTime);
      this._events.get(AppEvent.LOADED).next(project);
    } catch (error) {
      console.timeEnd(labelTime);
      console.error('Sort failed:', error);
      const msg = error instanceof Error ? error.message : 'Backend error — check the JSON and try again.';
      this._events.get(AppEvent.LOAD_ERROR).next(msg);
    }
  }

  private cleanInput(data: IInput): void {
    if (!data.constraints) data.constraints = { units: 'cm' };
    if (!data.areas) data.areas = [];
    if (!data.boxes) data.boxes = [];
  }

  private loadJSON(file: File): void {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      const json = JSON.parse(reader.result as string);
      this.sort(json as IInput);
    };
    reader.onerror = () => {
      throw reader.error;
    };
  }

  private handle(input: IInput, output: IOutput): Project {
    const areas = this.mapAreas(input, output);
    return new Project(areas, input.constraints?.units ?? 'cm');
  }

  private mapAreas(input: IInput, output: IOutput): Area[] {
    const areas: Area[] = [];
    let previous: Area | null = null;

    for (let i = 0; i < output.areas.length; i++) {
      const organized = output.areas[i];

      const area = new Area(organized.id, organized.name || '', organized.detail, {
        means: organized,
        position: organized,
        exitCorridor: organized.exitCorridor,
      });

      const items = this.mapItems(organized, input.boxes);
      area.setItems(items);

      if (organized.fixedMeans) area.fixedMeans.set(organized.fixedMeans);

      if (organized.unplaced) {
        // UNFITTED items stay fixed in the scene — skip the rewind step system entirely.
        // globalStep -1 signals "always visible" to checkVisibility in the canvas.
        items.forEach((item) => item.setGlobalStep(-1));
        areas.push(area);
        continue;
      }

      area.setGlobalStep(i);
      area.setGlobalSteps(previous?.itemCount ?? 0);

      previous = area;
      areas.push(area);
    }

    return areas;
  }

  private mapItems(organized: IOrganizedArea, originals: IBox[]): RenderedController[] {
    return (
      organized.boxes?.map((box) => {
        const item = originals.find((i) => i.id === box.id) || ({} as IBox);
        return new RenderedController(item.id, item.name || '', item.detail || '', {
          type: 'box',
          targetable: true,
          position: { x: box.position.x, y: box.position.y, z: box.position.z },
          means: item,
          rotation: box.rotation,
        });
      }) ?? []
    );
  }
}
