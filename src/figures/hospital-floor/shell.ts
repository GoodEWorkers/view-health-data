import { corners, cylinder, haloOf, insetPlan, lineOnTop, onTop, planOutline, ring, slabOf, topTicks } from '../../iso/iso-kit.ts';
import type { Plan, Plane } from '../../iso/iso-kit.ts';
import { FEET_DEPTH, PROJECTION, at, byDepth, dots, line, solid } from './camera.ts';
import { BASEBOARD, BUILDING, ENTRANCE } from './model.ts';

const PLATE_HEIGHT = 12;
const FLANGE_HEIGHT = 1.6;
const FOOT_INSET = 26;
const SCREW_INSET = 10;
const GROOVE_INSET = 5;
const RULER: Plan = { x: -140, y: 100, w: 280, d: 7, r: 1 };
const RULER_HEIGHT = 0.6;
const TICK_STEP = 4;
const TICK_EVERY = 5;
const LABEL: Plan = { x: 152, y: -96, w: 10, d: 30, r: 1.2 };
const LABEL_HEIGHT = 0.8;
const COMPASS_CENTRE: Plane = [157, -55];
const COMPASS_RADIUS = 4;
const APRON_DEPTH = 9;
const APRON_HEIGHT = 1;
const APRON_MARGIN = 3;

export function baseboardSvg(): string {
  return [haloSvg(), feetSvg(), plateSvg(), screwsSvg(), rulerSvg(), labelSvg(), compassSvg(), apronSvg()].join('');
}

const haloSvg = () => `<path class="iso-halo" d="${haloOf(BASEBOARD, -FEET_DEPTH, PLATE_HEIGHT, PROJECTION)}"/>`;

function feetSvg(): string {
  const footCorners = byDepth(corners(BASEBOARD, FOOT_INSET), ([x, y]) => [x, y, 0]);
  return footCorners
    .map(([x, y]) => {
      const flange = solid(cylinder(x, y, 7, -FEET_DEPTH, FLANGE_HEIGHT, PROJECTION, 28), { tone: 'lo' });
      const foot = solid(cylinder(x, y, 5.4, -FEET_DEPTH + FLANGE_HEIGHT, FEET_DEPTH - PLATE_HEIGHT - FLANGE_HEIGHT, PROJECTION, 28), { tone: 'mid' });
      return flange + foot;
    })
    .join('');
}

const plateSvg = () =>
  solid(slabOf(BASEBOARD, -PLATE_HEIGHT, PLATE_HEIGHT, PROJECTION, 8, 1.6), { tone: 'mid' }) +
  line(planOutline(insetPlan(BASEBOARD, GROOVE_INSET), 0, PROJECTION), { tone: 'lo' });

function screwsSvg(): string {
  const screws = corners(BASEBOARD, SCREW_INSET);
  const rings = screws.map(([x, y]) => ring(x, y, 2.2, 0, PROJECTION, 16)).join('');
  return line(rings, { tone: 'lo' }) + dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 });
}

function rulerSvg(): string {
  const strip = solid(slabOf(RULER, 0, RULER_HEIGHT, PROJECTION, 3), { tone: 'lo', crease: 'none' });
  const ticks = topTicks(RULER.x + 4, RULER.x + RULER.w - 4, TICK_STEP, TICK_EVERY, RULER.y + 0.8, RULER_HEIGHT, [2, 3.6], PROJECTION);
  const ends = [RULER.x + 2, RULER.x + RULER.w - 2].map((x) => at([x, RULER.y + RULER.d / 2, RULER_HEIGHT]));
  return strip + line(ticks.minor, { tone: 'lo' }) + line(ticks.major, { tone: 'mid' }) + dots(ends, { size: 0.45 });
}

function labelSvg(): string {
  const plate = solid(slabOf(LABEL, 0, LABEL_HEIGHT, PROJECTION, 4), { tone: 'lo', crease: 'none' });
  const frame = line(planOutline(insetPlan(LABEL, 1.6), LABEL_HEIGHT, PROJECTION, 3), { tone: 'faint' });
  const rules = [22, 16, 9].map((length, index) => {
    const x = LABEL.x + 3 + index * 2;
    return lineOnTop([x, LABEL.y + 5], [x, LABEL.y + 5 + length], LABEL_HEIGHT, PROJECTION);
  });
  const screws = [LABEL.y + 2.4, LABEL.y + LABEL.d - 2.4].map((y) => at([LABEL.x + LABEL.w / 2, y, LABEL_HEIGHT]));
  return plate + frame + line(rules.join(''), { tone: 'lo', free: true }) + dots(screws, { size: 0.45 });
}

function compassSvg(): string {
  const [cx, cy] = COMPASS_CENTRE;
  const bezel = line(ring(cx, cy, COMPASS_RADIUS, 0, PROJECTION, 24), { tone: 'lo' });
  const shaft = line(lineOnTop([cx - COMPASS_RADIUS, cy], [cx + COMPASS_RADIUS, cy], 0, PROJECTION), { tone: 'lo' });
  const head = onTop([[cx - COMPASS_RADIUS, cy], [cx - 0.5, cy - 1.8], [cx - 0.5, cy + 1.8]], 0, PROJECTION, true);
  return bezel + shaft + line(head, { tone: 'mid' }) + dots([at([cx, cy, 0])], { size: 0.45 });
}

function apronSvg(): string {
  const apron: Plan = {
    x: BUILDING.x + BUILDING.w,
    y: -ENTRANCE.width / 2 - APRON_MARGIN,
    w: APRON_DEPTH,
    d: ENTRANCE.width + APRON_MARGIN * 2,
    r: 1.2,
  };
  const step = solid(slabOf(apron, 0, APRON_HEIGHT, PROJECTION, 4, 0.4), { tone: 'lo' });
  const tread = line(planOutline(insetPlan(apron, 1.4), APRON_HEIGHT, PROJECTION, 3), { tone: 'faint' });
  const screws = corners(apron, 2.4).map(([x, y]) => at([x, y, APRON_HEIGHT]));
  return step + tread + dots(screws, { size: 0.45 });
}
