import { lineOnTop, sideRing, sideSeam, topTicks } from '../../../iso/iso-kit.ts';
import { PROJECTION, at, dots, line } from '../camera.ts';
import { box, compose, dotsOnTop, faceDots, faceRect, post, rect, screenOutline, sorted, stacked, topOutline } from '../parts.ts';
import type { Part } from '../parts.ts';

const PLINTH = rect(-146.5, 30, 31, 16, 1.2);
const PLINTH_HEIGHT = 2;
const GANTRY = rect(-146, 31, 30, 13, 3);
const GANTRY_HEIGHT = 22;
const GANTRY_TOP = PLINTH_HEIGHT + GANTRY_HEIGHT;
const BODY_SEAM_Z = 9;
const BORE = { x: -131, z: 14, outer: 8.5, inner: 7 };
const PLATE = rect(BORE.x - 9.5, GANTRY.y + GANTRY.d, 19, 1.5, 0.4);
const PLATE_BOTTOM = 4.5;
const PLATE_HEIGHT = 19;
const PLATE_FACE_Y = PLATE.y + PLATE.d;
const SCREW_SIZE = 0.5;

const RAIL = rect(BORE.x - 2, PLATE_FACE_Y + 0.5, 4, 31, 0.6);
const RAIL_HEIGHT = 1.2;
const POST_YS = [PLATE_FACE_Y + 9.5, PLATE_FACE_Y + 21.5];
const TABLE = rect(BORE.x - 3.5, PLATE_FACE_Y, 7, 28.5, 0.6);
const TABLE_BOTTOM = 8;
const TABLE_HEIGHT = 1.4;
const MATTRESS = rect(BORE.x - 2.7, PLATE_FACE_Y + 1, 5.4, 26.5, 1);
const PILLOW = rect(BORE.x - 2.7, PLATE_FACE_Y + 1, 5.4, 6.5, 1.2);
const STRAP_Y = PLATE_FACE_Y + 23.5;

const INJECTOR_AT = [-120, 60] as const;
const INJECTOR_HEAD = { size: 4.4, bottom: 14, height: 4 };

export function gantry(): Part {
  const plinth = box(PLINTH, 0, PLINTH_HEIGHT, { tone: 'lo', trim: dots([[-146, 45], [-116, 45]].map(([x, y]) => at([x, y, PLINTH_HEIGHT])), { size: SCREW_SIZE }) });
  const housing = box(GANTRY, PLINTH_HEIGHT, GANTRY_HEIGHT, {
    tone: 'hi',
    bevel: 0.6,
    inner: line(sideSeam(GANTRY, BODY_SEAM_Z, PROJECTION, 3), { tone: 'faint' }),
    trim: gantryDetail(),
  });
  return compose([plinth, housing, borePlate()]);
}

function gantryDetail(): string {
  const panel = line(faceRect(GANTRY, 'left', 25.5, 29, 13, 20), { tone: 'lo' });
  const buttons = faceDots(GANTRY, 'left', 27.25, 8.5, 1, 3, 1.5);
  const statusBar = line(faceRect(GANTRY, 'left', 1, 4.5, 19.5, 21), { tone: 'lo' });
  const vents = dotsOnTop(GANTRY.x + 5, GANTRY.y + 2.4, 9, 4, 2.8, GANTRY_TOP, 'mid');
  return panel + buttons + statusBar + vents + topOutline(GANTRY, GANTRY_TOP, 1.2);
}

function borePlate(): Part {
  const centre = (radius: number) => sideRing([BORE.x, PLATE_FACE_Y, BORE.z], radius, 'y', PROJECTION, 32);
  const corners = [PLATE.x + 2, PLATE.x + PLATE.w - 2].flatMap((x) => [PLATE_BOTTOM + 2, PLATE_BOTTOM + PLATE_HEIGHT - 2].map((z) => at([x, PLATE_FACE_Y, z])));
  const trim = line(centre(BORE.outer), { tone: 'mid' }) + line(centre(BORE.inner), { tone: 'lo' }) + dots(corners, { size: SCREW_SIZE });
  return box(PLATE, PLATE_BOTTOM, PLATE_HEIGHT, { tone: 'hi', bevel: 0.4, trim });
}

export function patientTable(): Part {
  const ticks = topTicks(RAIL.y + 3, RAIL.y + RAIL.d - 3, 4, 5, RAIL.x + 0.6, RAIL_HEIGHT, [1.6, 2.8], PROJECTION, 'y');
  const rail = box(RAIL, 0, RAIL_HEIGHT, {
    tone: 'lo',
    crease: 'none',
    bevel: 0,
    trim:
      line(ticks.minor, { tone: 'lo' }) +
      line(ticks.major, { tone: 'mid' }) +
      dots([RAIL.y + 1.4, RAIL.y + RAIL.d - 1.4].map((y) => at([BORE.x, y, RAIL_HEIGHT])), { size: SCREW_SIZE }),
  });
  const posts = POST_YS.flatMap((y) => [
    post([BORE.x, y], 1.6, RAIL_HEIGHT, TABLE_BOTTOM - RAIL_HEIGHT, { steps: 12 }),
    post([BORE.x, y], 2.2, TABLE_BOTTOM - 0.8, 0.8, { steps: 12 }),
  ]);
  const top = box(TABLE, TABLE_BOTTOM, TABLE_HEIGHT, { tone: 'mid', bevel: 0.4, trim: topOutline(TABLE, TABLE_BOTTOM + TABLE_HEIGHT, 0.7) });
  const mattressTop = TABLE_BOTTOM + TABLE_HEIGHT + 1.2;
  const strap = line(lineOnTop([MATTRESS.x, STRAP_Y], [MATTRESS.x + MATTRESS.w, STRAP_Y], mattressTop, PROJECTION), { tone: 'faint' });
  const mattress = box(MATTRESS, TABLE_BOTTOM + TABLE_HEIGHT, 1.2, { tone: 'lo', bevel: 0.3, trim: strap });
  const pillow = box(PILLOW, mattressTop, 1.4, { tone: 'lo', bevel: 0.3 });
  return compose([rail, sorted(posts), top, stacked(mattress, [pillow])]);
}

export function injector(): Part {
  const [x, y] = INJECTOR_AT;
  const { size, bottom, height } = INJECTOR_HEAD;
  const head = rect(x - size / 2, y - size / 2, size, size, 0.8);
  return compose([
    post([x, y], 3, 0, 0.8, { tone: 'lo' }),
    post([x, y], 0.9, 0.8, bottom - 0.8, { steps: 10 }),
    box(head, bottom, height, { tone: 'mid', trim: screenOutline(head, 'left', bottom, bottom + height) + topOutline(head, bottom + height, 0.8) }),
  ]);
}
