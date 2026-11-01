import { knurl, lineOnTop, sideArc, sideRing } from '../../../iso/iso-kit.ts';
import type { Plane } from '../../../iso/iso-kit.ts';
import { PROJECTION, dots, line, at } from '../camera.ts';
import { counter, monitor, sinkOn, trolley } from '../furniture.ts';
import { box, compose, faceAt, faceRect, floorMark, markup, post, prism, rect, screenOutline, sorted, topOutline } from '../parts.ts';
import type { Part } from '../parts.ts';

const TABLE = { plan: rect(-104, -62, 24, 8, 0.8), centre: [-92, -58] as Plane, top: 7.4, thickness: 1.4 };
const MATTRESS = rect(-103, -61.2, 22, 6.4, 1);
const MATTRESS_SEAMS = [-97, -86];
const LAMP = { stand: [-84, -78] as Plane, elbow: [-92, -70] as Plane, head: [-97, -58] as Plane, armWidth: 1.6 };
const LAMP_Z = { arm: 17.8, headRim: 14.6 };
const MACHINE = { plan: rect(-123, -63, 10, 10, 0.8), bottom: 1.6, height: 9.2 };
const CYLINDER_CENTRES: Plane[] = [[-125.3, -60.4], [-125.3, -55.6]];
const TROLLEY_ORIGIN: Plane = [-98, -49];
const SINK_COUNTER = rect(-70, -92.5, 22, 8, 0.6);
const SUPPLY_CABINET = rect(-147.5, -92.5, 18, 7, 0.6);
const SUPPLY_HEIGHT = 12;
const STOOL_CENTRE: Plane = [-80, -46];
const WALL_MONITOR = rect(-120, -92.5, 14, 0.9, 0.3);
const STERILE_ZONES = [rect(-127, -82, 58, 38, 3), rect(-125.6, -80.6, 55.2, 35.2, 2)];

export function theatreParts(): Part[] {
  return [
    ...STERILE_ZONES.map((zone) => floorMark(zone)),
    operatingTable(),
    lampStand(),
    lampBoom(),
    anaesthesiaMachine(),
    instrumentTrolley(),
    scrubSink(),
    wallMonitor(),
    supplyCabinet(),
    stool(),
  ];
}

function operatingTable(): Part {
  const [cx, cy] = TABLE.centre;
  const seams = MATTRESS_SEAMS.map((x) => lineOnTop([x, MATTRESS.y], [x, MATTRESS.y + MATTRESS.d], TABLE.top + TABLE.thickness + 0.8, PROJECTION)).join('');
  const topZ = TABLE.top + TABLE.thickness;
  return compose(
    [
      post([cx, cy], 5, 0, 0.8, { tone: 'lo', steps: 20 }),
      post([cx, cy], 2.2, 0.8, 5.4, { steps: 16, inner: line(sideArc(cx, cy, 2.2, 3.5, PROJECTION, 16), { tone: 'faint' }) }),
      post([cx, cy], 2.9, 6.2, TABLE.top - 6.2, { steps: 16 }),
      box(TABLE.plan, TABLE.top, TABLE.thickness, { tone: 'hi', bevel: 0.5 }),
      box(rect(-108.4, -60.5, 4.6, 5, 0.8), TABLE.top + 0.5, 1.2, { tone: 'hi', bevel: 0.3 }),
      box(MATTRESS, topZ, 0.8, { tone: 'mid', trim: line(seams, { tone: 'faint' }) }),
      box(rect(-102, -54, 20, 0.6, 0.2), TABLE.top + 0.3, 0.7, { tone: 'lo', bevel: 0 }),
    ],
    [cx, cy, 6],
  );
}

function lampStand(): Part {
  const [x, y] = LAMP.stand;
  return compose([
    post([x, y], 4.5, 0, 1, { tone: 'lo', steps: 20 }),
    post([x, y], 0.9, 1, LAMP_Z.arm - 1, { steps: 10, inner: line(sideArc(x, y, 0.9, 9, PROJECTION, 10), { tone: 'faint' }) }),
  ]);
}

function armRing([ax, ay]: Plane, [bx, by]: Plane, width: number): Plane[] {
  const length = Math.hypot(bx - ax, by - ay);
  const nx = (-(by - ay) / length) * (width / 2);
  const ny = ((bx - ax) / length) * (width / 2);
  return [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]];
}

function lampBoom(): Part {
  const { stand, elbow, head, armWidth } = LAMP;
  const [hx, hy] = head;
  const rimTop = LAMP_Z.headRim + 1.2;
  const armTop = LAMP_Z.arm + 1.2;
  const rim = post(head, 5.8, LAMP_Z.headRim, 1.2, { steps: 28, trim: line(knurl(hx, hy, 5.8, LAMP_Z.headRim, rimTop, 44, PROJECTION, 0.2), { tone: 'lo' }) });
  const body = post(head, 5.2, rimTop, 3.2, { steps: 28, inner: line(sideArc(hx, hy, 5.2, rimTop + 1.6, PROJECTION, 24), { tone: 'faint' }) });
  return compose(
    [
      prism(armRing(stand, elbow, armWidth), LAMP_Z.arm, 1.2, { tone: 'mid', bevel: 0.3 }),
      rim,
      body,
      prism(armRing(elbow, head, armWidth), LAMP_Z.arm + 1.2, 1.2, { tone: 'mid', bevel: 0.3 }),
      post(elbow, 1.3, armTop + 1.2, 0.6, { steps: 12 }),
      post(head, 1.4, armTop + 1.2, 0.6, { steps: 12 }),
    ],
    [hx, hy, 17],
  );
}

function anaesthesiaMachine(): Part {
  const { plan, bottom, height } = MACHINE;
  const topZ = bottom + height;
  const frontY = plan.y + plan.d;
  const drawers = [
    [2.2, 5.4],
    [6.2, 9.4],
  ].map(([from, to]) => line(faceRect(plan, 'left', 1.2, 8.8, from, to), { tone: 'faint' }));
  const gauges = [3.2, 6.8].map((along) => line(sideRing([plan.x + along, frontY, topZ - 1.8], 0.9, 'y', PROJECTION, 12), { tone: 'lo' }));
  const handles = dots([at([plan.x + 5, frontY, 4.6]), at([plan.x + 5, frontY, 8.2])], { size: 0.5, tone: 'mid' });
  const wheels = [0, 1].flatMap((sx) =>
    [0, 1].map((sy) => post([plan.x + 1.4 + sx * (plan.w - 2.8), plan.y + 1.4 + sy * (plan.d - 2.8)], 0.9, 0, bottom, { tone: 'lo', steps: 8 })),
  );
  const cylinders = CYLINDER_CENTRES.map((centre) =>
    compose([
      post(centre, 1.7, 0, 13, { steps: 14, inner: line(sideArc(centre[0], centre[1], 1.7, 11.2, PROJECTION, 12), { tone: 'faint' }) }),
      post(centre, 0.8, 13, 1.6, { steps: 8 }),
      box(rect(centre[0] - 0.4, centre[1] - 1.1, 0.8, 2.2, 0.2), 14.6, 0.8, { tone: 'lo', bevel: 0 }),
    ]),
  );
  const body = box(plan, bottom, height, { tone: 'mid', bevel: 0.5, trim: drawers.join('') + gauges.join('') + handles });
  const plate = box(rect(plan.x - 0.5, plan.y - 0.5, plan.w + 1, plan.d + 1, 0.8), topZ, 0.8, { tone: 'mid', bevel: 0.3, trim: topOutline(plan, topZ + 0.8, 1) });
  const screen = monitor([plan.x + plan.w / 2, plan.y + 4.5], topZ + 0.8, 'left');
  return compose([sorted(cylinders), sorted(wheels), body, plate, screen], [plan.x + plan.w / 2, plan.y + plan.d / 2, 6]);
}

function instrumentTrolley(): Part {
  const [x, y] = TROLLEY_ORIGIN;
  const shelfTop = 6.2;
  const tray = box(rect(x + 1.2, y + 1.2, 11.6, 5.6, 0.6), shelfTop, 0.5, { tone: 'lo', trim: topOutline(rect(x + 1.2, y + 1.2, 11.6, 5.6, 0.6), shelfTop + 0.5, 0.7) });
  const trayTop = shelfTop + 0.5;
  const instruments = [
    box(rect(x + 2.4, y + 2.2, 5, 0.7, 0.2), trayTop, 0.4, { tone: 'hi', bevel: 0 }),
    box(rect(x + 3.4, y + 3.8, 6, 0.8, 0.2), trayTop, 0.5, { tone: 'hi', bevel: 0 }),
    box(rect(x + 2.6, y + 5.2, 4.2, 0.7, 0.2), trayTop, 0.4, { tone: 'hi', bevel: 0 }),
    post([x + 10.4, y + 4], 1.2, trayTop, 1.2, { tone: 'mid', steps: 12 }),
  ];
  return compose([trolley(TROLLEY_ORIGIN, [14, 8]), tray, sorted(instruments)], [x + 7, y + 4, 4]);
}

function scrubSink(): Part {
  const topZ = 9;
  const bench = counter(SINK_COUNTER, topZ);
  const splash = box(rect(SINK_COUNTER.x, SINK_COUNTER.y, SINK_COUNTER.w, 0.8, 0.2), topZ, 4, { tone: 'lo', bevel: 0.2 });
  const basin = sinkOn(rect(SINK_COUNTER.x + 4, SINK_COUNTER.y + 1.6, 12, 5, 1), topZ);
  const bottles = [SINK_COUNTER.x + 18, SINK_COUNTER.x + 20.4].map((x) => box(rect(x, SINK_COUNTER.y + 1.2, 1.6, 1.4, 0.4), topZ, 3.4, { tone: 'mid', bevel: 0.2 }));
  return compose([bench, splash, basin, sorted(bottles)], [SINK_COUNTER.x + 11, SINK_COUNTER.y + 4, 5]);
}

function wallMonitor(): Part {
  const panel = WALL_MONITOR;
  const bottom = 5;
  const height = 7;
  const led = dots([at(faceAt(panel, 'left', panel.w / 2, bottom + 0.6))], { size: 0.45, tone: 'mid' });
  return box(panel, bottom, height, { bevel: 0.2, trim: screenOutline(panel, 'left', bottom, bottom + height) + led });
}

function supplyCabinet(): Part {
  const { x, y, w, d } = SUPPLY_CABINET;
  const handles = dots([at([x + w / 2 - 0.8, y + d, 6]), at([x + w / 2 + 0.8, y + d, 6])], { size: 0.5, tone: 'mid' });
  return compose([counter(SUPPLY_CABINET, SUPPLY_HEIGHT), markup(handles, [x, y, 6])], [x + 9, y + 3.5, 6]);
}

function stool(): Part {
  const [x, y] = STOOL_CENTRE;
  return compose([
    post([x, y], 2.6, 0, 0.8, { tone: 'lo', steps: 14 }),
    post([x, y], 0.7, 0.8, 3.4, { steps: 8 }),
    post([x, y], 2.7, 4.2, 1.1, { steps: 16, bevel: 0.3 }),
  ]);
}
