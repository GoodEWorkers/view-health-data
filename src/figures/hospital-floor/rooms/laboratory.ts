import { knurl, ring, sideArc, sideSeam } from '../../../iso/iso-kit.ts';
import type { Plan, Plane } from '../../../iso/iso-kit.ts';
import { PROJECTION, at, dots, line } from '../camera.ts';
import { fridge } from '../equipment.ts';
import { anchorMonitor, counter, keyboard, sinkOn } from '../furniture.ts';
import type { Screen } from '../furniture.ts';
import { asDevice, box, compose, dotsOnTop, faceRect, markup, post, rect, screwDots, sorted, topOutline } from '../parts.ts';
import type { Part } from '../parts.ts';
import { cart, cartDeckTop } from './carts.ts';

const BENCH_HEIGHT = 9;
const BENCH_DEPTH = 10;
export const SGL_SCREEN: Screen = { centre: [-14, 70.5], z: BENCH_HEIGHT, face: 'left' };
const ANALYSER_STEPS = 3;
const BOTTLE_HEIGHT = 3.6;

const ANALYSER = rect(-26, 50, 14, 8, 0.8);
const ANALYSER_HEIGHT = 9;
const CENTRIFUGE_AT: Plane = [-2, 53.5];
const BENCH_NEAR = rect(-28, 48.5, 44, BENCH_DEPTH, 0.6);
const BENCH_ISLAND = rect(-20, 67, 40, BENCH_DEPTH, 0.6);
const FRIDGE_PLAN = rect(-30, 76, 8, 8, 0.6);
const BENCH_EAST = rect(36, 48.5, 24, BENCH_DEPTH, 0.6);
const SAMPLE_RACK = rect(5.5, 50.5, 8, 4.5, 0.5);
const EAST_RACK = rect(46, 50.5, 8, 4.5, 0.5);
const BIN_AT: Plane = [55, 80];
const BASIN = rect(10, 68.5, 8, 7, 1.2);
const CART_AT: Plane = [40, 63];
const CART_SIZE: Plane = [14, 8];

export function laboratoryParts(): Part[] {
  return [
    benchWith(BENCH_NEAR, [asDevice(analyser()), centrifuge(), sampleRack(SAMPLE_RACK), bottle([-9.5, 55.5], BENCH_HEIGHT)]),
    benchWith(BENCH_ISLAND, islandRiders()),
    benchWith(BENCH_EAST, [sampleRack(EAST_RACK), ...[39.5, 42.5, 57].map((x) => bottle([x, 53.5], BENCH_HEIGHT))]),
    wasteBin(),
    fridge(FRIDGE_PLAN, 'left'),
    sampleCart(),
  ];
}

function benchWith(plan: Plan, riders: Part[]): Part {
  const anchor: [number, number, number] = [plan.x + plan.w / 2, plan.y + plan.d / 2, 0];
  const screws: Plane[] = [
    [plan.x + 1.6, plan.y + 1.6],
    [plan.x + 1.6, plan.y + plan.d - 1.6],
    [plan.x + plan.w - 1.6, plan.y + 1.6],
    [plan.x + plan.w - 1.6, plan.y + plan.d - 1.6],
  ];
  const trim = topOutline(plan, BENCH_HEIGHT, 1.2) + screwDots(screws, BENCH_HEIGHT);
  return compose([counter(plan, BENCH_HEIGHT), markup(trim, [anchor[0], anchor[1], BENCH_HEIGHT]), sorted(riders)], anchor);
}

function islandRiders(): Part[] {
  const sink = sinkOn(BASIN, BENCH_HEIGHT);
  const keys = asDevice(keyboard([-9, 72.5], BENCH_HEIGHT, 3.4, 9));
  return [sink, anchorMonitor(SGL_SCREEN), keys, bottle([-4, 70], BENCH_HEIGHT), bottle([-1.8, 74], BENCH_HEIGHT), bottle([0.6, 70.4], BENCH_HEIGHT)];
}

function analyser(): Part {
  const { x, y, d } = ANALYSER;
  const top = BENCH_HEIGHT + ANALYSER_HEIGHT;
  const seamHeight = BENCH_HEIGHT + 2.2;
  const body = box(ANALYSER, BENCH_HEIGHT, ANALYSER_HEIGHT, {
    tone: 'hi',
    steps: ANALYSER_STEPS,
    inner: line(sideSeam(ANALYSER, seamHeight, PROJECTION, ANALYSER_STEPS), { tone: 'faint' }),
    trim: topOutline(ANALYSER, top, 1.2) + dotsOnTop(x + 2, y + 1.8, 6, 2, 1.4, top),
  });
  const glass = rect(x + 1.6, y + d, 7.4, 0.7, 0.2);
  const glassBottom = BENCH_HEIGHT + 4.6;
  const window = box(glass, glassBottom, 4.4, {
    tone: 'mid',
    trim: line(faceRect(glass, 'left', 0.7, 6.7, glassBottom + 0.7, glassBottom + 3.7), { tone: 'faint' }),
  });
  const panel = rect(x + 10, y + d, 2.8, 0.5, 0.2);
  const keypad = box(panel, glassBottom, 4.4, {
    tone: 'mid',
    bevel: 0,
    trim: dots([0.7, 1.4, 2.1].map((along) => at([panel.x + along, panel.y + panel.d, glassBottom + 3.4])), { size: 0.45, tone: 'mid' }),
  });
  const lamp = dots([at([x + 0.8, y + d, top - 1.4])], { size: 0.5, tone: 'hi' });
  return compose([body, markup(lamp, [x + 0.8, y + d, top]), window, keypad]);
}

function centrifuge(): Part {
  const [x, y] = CENTRIFUGE_AT;
  const radius = 4.4;
  const bandHeight = 1.3;
  const bodyHeight = 3.4;
  const body = post([x, y], radius, BENCH_HEIGHT, bodyHeight, {
    tone: 'mid',
    bevel: 0.3,
    inner: line(sideArc(x, y, radius, BENCH_HEIGHT + bandHeight, PROJECTION, 18), { tone: 'faint' }),
    trim: line(knurl(x, y, radius, BENCH_HEIGHT, BENCH_HEIGHT + bandHeight, 40, PROJECTION, 0.3), { tone: 'lo' }),
  });
  const lidBottom = BENCH_HEIGHT + bodyHeight;
  const lidTop = lidBottom + 1.2;
  const hub = line(ring(x, y, 1.6, lidTop, PROJECTION, 14), { tone: 'lo' }) + dots([at([x, y, lidTop])], { size: 0.5, tone: 'hi' });
  const lid = post([x, y], 3.8, lidBottom, 1.2, { tone: 'hi', bevel: 0.3, trim: hub });
  return compose([body, lid]);
}

function sampleRack(plan: Plan): Part {
  const tubes = dotsOnTop(plan.x + 1.2, plan.y + 1, 6, 3, 1.2, BENCH_HEIGHT + 0.8, 'mid');
  return box(plan, BENCH_HEIGHT, 0.8, { tone: 'lo', bevel: 0.2, trim: tubes });
}

function wasteBin(): Part {
  const lidTop = 6.4;
  const hinge = line(ring(BIN_AT[0], BIN_AT[1], 1.4, lidTop, PROJECTION, 12), { tone: 'faint' });
  return compose([post(BIN_AT, 2.6, 0, 6, { tone: 'mid', bevel: 0.3 }), post(BIN_AT, 2.9, 6, 0.8, { tone: 'lo', bevel: 0.2, trim: hinge })]);
}

function bottle([x, y]: Plane, z: number): Part {
  const cap = line(ring(x, y, 0.55, z + BOTTLE_HEIGHT, PROJECTION, 8), { tone: 'mid' });
  return post([x, y], 1, z, BOTTLE_HEIGHT, { tone: 'lo', steps: 10, trim: cap });
}

function sampleCart(): Part {
  const [x, y] = CART_AT;
  const crates = [0, 1].map((index) => box(rect(x + 1.2 + index * 5.6, y + 1.2, 5, 5.6, 0.3), cartDeckTop, 2.4 + index, { bevel: 0.2 }));
  return cart(CART_AT, CART_SIZE, crates);
}
