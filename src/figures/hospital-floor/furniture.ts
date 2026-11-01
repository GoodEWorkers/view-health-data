import { insetPlan, planOutline, sideRing } from '../../iso/iso-kit.ts';
import type { Plan, Plane, Tone } from '../../iso/iso-kit.ts';
import { PROJECTION, at, dots, line } from './camera.ts';
import type { Side } from './model.ts';
import {
  box,
  compose,
  dotsOnTop,
  faceAt,
  faceLength,
  faceLine,
  post,
  rect,
  screenOutline,
  sorted,
} from './parts.ts';
import type { Face, Part } from './parts.ts';

const SEAM_PITCH = 12;
const TOP_THICKNESS = 1;
const SEAM_FACE: Face = 'left';
const CHAIR = { seat: 5.6, seatBottom: 3.2, seatThickness: 1.1, leg: 0.9, backThickness: 0.8, backHeight: 5 };
const MONITOR = { width: 6.4, thickness: 0.9, height: 4.4, stemHeight: 1.6, footWidth: 2.6, footDepth: 3.4 };
const WHEEL = { radius: 0.9, height: 2.2 };

function panelSeams(plan: Plan, bottom: number, top: number, pitch = SEAM_PITCH): string {
  const length = faceLength(plan, SEAM_FACE);
  const count = Math.max(0, Math.ceil(length / pitch) - 1);
  const seams = Array.from({ length: count }, (_, index) => {
    const along = ((index + 1) * length) / (count + 1);
    return faceLine(plan, SEAM_FACE, along, along, bottom, top);
  });
  return line(seams.join(''), { tone: 'faint' });
}

export function counter(plan: Plan, height: number, tone: Tone = 'mid', topTone: Tone = tone): Part {
  const bodyPlan = insetPlan(plan, 0.5);
  const bodyHeight = height - TOP_THICKNESS;
  const body = box(bodyPlan, 0, bodyHeight, { tone, trim: panelSeams(bodyPlan, 0, bodyHeight) });
  const top = box(plan, bodyHeight, TOP_THICKNESS, { tone: topTone, bevel: 0.3 });
  return compose([body, top]);
}

export function monitor(centre: Plane, z: number, face: Face = 'left', screen = true): Part {
  const [cx, cy] = centre;
  const { width, thickness, height, stemHeight, footWidth, footDepth } = MONITOR;
  const facesX = face === 'front';
  const panel = facesX ? rect(cx - thickness / 2, cy - width / 2, thickness, width, 0.2) : rect(cx - width / 2, cy - thickness / 2, width, thickness, 0.2);
  const foot = facesX ? rect(cx - footWidth / 2, cy - footDepth / 2, footWidth, footDepth, 0.4) : rect(cx - footDepth / 2, cy - footWidth / 2, footDepth, footWidth, 0.4);
  const panelBottom = z + 0.5 + stemHeight;
  const led = dots([at(faceAt(panel, face, width / 2, panelBottom + 0.35))], { size: 0.4, tone: 'mid' });
  const mount = line(sideRing(faceAt(panel, face, width / 2, panelBottom + height / 2), 1, facesX ? 'x' : 'y', PROJECTION, 14), { tone: 'faint' });
  const trim = screen ? screenOutline(panel, face, panelBottom, panelBottom + height) + led : mount;
  return compose([
    box(foot, z, 0.5, { bevel: 0.2 }),
    post(centre, 0.55, z + 0.5, stemHeight, { steps: 8 }),
    box(panel, panelBottom, height, { bevel: 0.2, trim }),
  ]);
}

export function keyboard(origin: Plane, z: number, length = 10, depth = 3.4, tone: Tone = 'lo'): Part {
  const [x, y] = origin;
  const columns = Math.floor((depth - 0.8) / 1.1) + 1;
  const rows = Math.floor((length - 1.2) / 1.1) + 1;
  const keys = dotsOnTop(x + 0.5, y + 0.6, columns, rows, 1.1, z + 0.5);
  return box(rect(x, y, depth, length, 0.5), z, 0.5, { tone, bevel: 0.2, trim: keys });
}

const CHAIR_BACKS: Record<Side, (cx: number, cy: number) => Plan> = {
  front: (cx, cy) => rect(cx - CHAIR.seat / 2, cy - CHAIR.seat / 2, CHAIR.backThickness, CHAIR.seat, 0.3),
  back: (cx, cy) => rect(cx + CHAIR.seat / 2 - CHAIR.backThickness, cy - CHAIR.seat / 2, CHAIR.backThickness, CHAIR.seat, 0.3),
  left: (cx, cy) => rect(cx - CHAIR.seat / 2, cy - CHAIR.seat / 2, CHAIR.seat, CHAIR.backThickness, 0.3),
  right: (cx, cy) => rect(cx - CHAIR.seat / 2, cy + CHAIR.seat / 2 - CHAIR.backThickness, CHAIR.seat, CHAIR.backThickness, 0.3),
};

export function chair([cx, cy]: Plane, facing: Side, tone: Tone = 'mid'): Part {
  const { seat, seatBottom, seatThickness, leg, backHeight } = CHAIR;
  const reach = seat / 2 - leg / 2 - 0.3;
  const legs = [-1, 1].flatMap((sx) =>
    [-1, 1].map((sy) => box(rect(cx + sx * reach - leg / 2, cy + sy * reach - leg / 2, leg, leg, 0.2), 0, seatBottom, { tone: 'lo', bevel: 0 })),
  );
  const seatPart = box(rect(cx - seat / 2, cy - seat / 2, seat, seat, 0.8), seatBottom, seatThickness, { tone, bevel: 0.3 });
  const back = box(CHAIR_BACKS[facing](cx, cy), seatBottom + seatThickness, backHeight, { tone, bevel: 0.2 });
  return compose([sorted(legs), sorted([seatPart, back])]);
}

export function trolley([x, y]: Plane, [length, width]: Plane, tone: Tone = 'mid'): Part {
  const wheels = [0, 1].flatMap((sx) =>
    [0, 1].map((sy) => post([x + 1.6 + sx * (length - 3.2), y + 1.6 + sy * (width - 3.2)], WHEEL.radius, 0, WHEEL.height, { tone: 'lo', steps: 8 })),
  );
  const deck = box(rect(x, y, length, width, 0.8), WHEEL.height, 0.8, { tone, bevel: 0.3 });
  const uprights = [0, 1].flatMap((sx) =>
    [0, 1].map((sy) => box(rect(x + 0.4 + sx * (length - 1.2), y + 0.4 + sy * (width - 1.2), 0.8, 0.8, 0.2), 3, 2.6, { tone: 'lo', bevel: 0 })),
  );
  const shelf = box(rect(x, y, length, width, 0.8), 5.6, 0.6, { tone, bevel: 0.3 });
  return compose([sorted(wheels), deck, sorted(uprights), shelf]);
}

export function sinkOn(basin: Plan, z: number): Part {
  const tapAt: Plane = [basin.x + 0.9, basin.y + basin.d / 2];
  const outline = line(planOutline(insetPlan(basin, 0.6), z, PROJECTION, 3), { tone: 'lo' });
  const tap = compose([
    post(tapAt, 0.5, z, 3, { steps: 8 }),
    box(rect(tapAt[0] - 0.4, tapAt[1] - 0.4, 2.6, 0.8, 0.2), z + 3, 0.7, { bevel: 0 }),
  ]);
  return compose([{ svg: outline, depth: tap.depth - 1 }, tap], [tapAt[0], tapAt[1], z]);
}
