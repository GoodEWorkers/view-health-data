// Lane routing for the jack wires on a coarse grid: A* over (cell, heading) with a bend cost and a congestion cost, so wires run in the gutters between screens, side by side on parallel lanes, and never enter a screen. Pure, in viewBox units.

import type { Corner } from './homography.ts';
import type { Box } from './jackWires.ts';

const CELL = 3;
export type Request = { readonly from: Corner; readonly leave: Corner; readonly to: Corner; readonly arrive: Corner };
export type Frame = { readonly width: number; readonly height: number };

const SCREEN_MARGIN = 3;
const FRAME_MARGIN = 9;
const STEP_COST = 10;
const BEND_COST = 24;
const LANE_COST = 12;
const CROSS_COST = 6;
const SPREAD = 2;
const HEADINGS: readonly Corner[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const NOT_VISITED = -1;

type Grid = {
  readonly columns: number;
  readonly rows: number;
  readonly blocked: Uint8Array;
  readonly horizontal: Uint8Array;
  readonly vertical: Uint8Array;
};

const centreOf = (index: number, columns: number): Corner => [((index % columns) + 0.5) * CELL, (Math.floor(index / columns) + 0.5) * CELL];

function gridFor(obstacles: readonly Box[], { width, height }: Frame): Grid {
  const columns = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const blocked = new Uint8Array(columns * rows);
  for (let index = 0; index < blocked.length; index++) {
    const [x, y] = centreOf(index, columns);
    const outside = x < FRAME_MARGIN || y < FRAME_MARGIN || x > width - FRAME_MARGIN || y > height - FRAME_MARGIN;
    const inside = obstacles.some((box) => x > box.x - SCREEN_MARGIN && x < box.x + box.width + SCREEN_MARGIN && y > box.y - SCREEN_MARGIN && y < box.y + box.height + SCREEN_MARGIN);
    blocked[index] = outside || inside ? 1 : 0;
  }
  return { columns, rows, blocked, horizontal: new Uint8Array(columns * rows), vertical: new Uint8Array(columns * rows) };
}

const cellIndexOf = ({ columns, rows }: Grid, [x, y]: Corner): number =>
  Math.min(rows - 1, Math.max(0, Math.floor(y / CELL))) * columns + Math.min(columns - 1, Math.max(0, Math.floor(x / CELL)));

const headingOf = ([x, y]: Corner): number => (Math.abs(x) > Math.abs(y) ? (x > 0 ? 0 : 2) : y > 0 ? 1 : 3);

function enterCost(grid: Grid, cell: number, heading: number): number {
  const along = heading % 2 === 0 ? grid.horizontal : grid.vertical;
  const across = heading % 2 === 0 ? grid.vertical : grid.horizontal;
  return STEP_COST + along[cell]! * LANE_COST + (across[cell] === SPREAD + 1 ? CROSS_COST : 0);
}

function commit(grid: Grid, cells: readonly number[], headings: readonly number[]): void {
  cells.forEach((cell, step) => {
    const isHorizontal = headings[step]! % 2 === 0;
    const lane = isHorizontal ? grid.horizontal : grid.vertical;
    const stride = isHorizontal ? grid.columns : 1;
    for (let offset = -SPREAD; offset <= SPREAD; offset++) {
      const target = cell + offset * stride;
      if (target >= 0 && target < lane.length) lane[target] = Math.max(lane[target]!, SPREAD + 1 - Math.abs(offset));
    }
  });
}

class MinHeap {
  private readonly scores: number[] = [];
  private readonly items: number[] = [];

  get size(): number {
    return this.items.length;
  }

  push(score: number, item: number): void {
    let at = this.items.push(item) - 1;
    this.scores.push(score);
    while (at > 0 && this.scores[(at - 1) >> 1]! > score) {
      const parent = (at - 1) >> 1;
      [this.scores[at], this.items[at]] = [this.scores[parent]!, this.items[parent]!];
      at = parent;
    }
    this.scores[at] = score;
    this.items[at] = item;
  }

  pop(): number {
    const top = this.items[0]!;
    const lastScore = this.scores.pop()!;
    const lastItem = this.items.pop()!;
    if (this.items.length > 0) {
      let at = 0;
      for (;;) {
        const left = 2 * at + 1;
        const child = left + 1 < this.items.length && this.scores[left + 1]! < this.scores[left]! ? left + 1 : left;
        if (child >= this.items.length || this.scores[child]! >= lastScore) break;
        [this.scores[at], this.items[at]] = [this.scores[child]!, this.items[child]!];
        at = child;
      }
      this.scores[at] = lastScore;
      this.items[at] = lastItem;
    }
    return top;
  }
}

const LEAD_CELLS = 3;

function openLeads(grid: Grid, { from, leave, to, arrive }: Request): () => void {
  const opened: [number, number][] = [];
  const open = (point: Corner, heading: Corner): void => {
    const cell = cellIndexOf(grid, point);
    const [dx, dy] = heading;
    for (let step = 0; step <= LEAD_CELLS; step++) {
      const target = cell + step * (dy * grid.columns + dx);
      if (target >= 0 && target < grid.blocked.length) {
        opened.push([target, grid.blocked[target]!]);
        grid.blocked[target] = 0;
      }
    }
  };
  open(from, [Math.sign(leave[0]), Math.sign(leave[1])]);
  open(to, [-Math.sign(arrive[0]), -Math.sign(arrive[1])]);
  return () => opened.reverse().forEach(([cell, value]) => (grid.blocked[cell] = value));
}

function search(grid: Grid, { from, leave, to, arrive }: Request): { cells: number[]; headings: number[] } | null {
  const [first, goal, arrival] = [cellIndexOf(grid, from), cellIndexOf(grid, to), headingOf(arrive)];
  const states = grid.columns * grid.rows * 4;
  const cost = new Float32Array(states).fill(Infinity);
  const parent = new Int32Array(states).fill(NOT_VISITED);
  const heap = new MinHeap();
  const [goalColumn, goalRow] = [goal % grid.columns, Math.floor(goal / grid.columns)];
  const estimate = (cell: number): number => (Math.abs((cell % grid.columns) - goalColumn) + Math.abs(Math.floor(cell / grid.columns) - goalRow)) * STEP_COST;
  const begin = first * 4 + headingOf(leave);
  cost[begin] = 0;
  heap.push(estimate(first), begin);
  while (heap.size > 0) {
    const state = heap.pop();
    const [cell, heading] = [state >> 2, state & 3];
    if (cell === goal) {
      const cells = [cell];
      const headings = [heading];
      for (let at = parent[state]!; at !== NOT_VISITED; at = parent[at]!) {
        cells.unshift(at >> 2);
        headings.unshift(at & 3);
      }
      return { cells, headings };
    }
    const options = state === begin ? [heading] : [heading, (heading + 1) % 4, (heading + 3) % 4];
    for (const next of options) {
      const [dx, dy] = HEADINGS[next]!;
      const [column, row] = [(cell % grid.columns) + dx, Math.floor(cell / grid.columns) + dy];
      const target = row * grid.columns + column;
      const unreachable = column < 0 || row < 0 || column >= grid.columns || row >= grid.rows || (grid.blocked[target] === 1 && target !== goal);
      if (unreachable || (target === goal && next !== arrival)) continue;
      const spent = cost[state]! + enterCost(grid, target, next) + (next === heading ? 0 : BEND_COST);
      const key = target * 4 + next;
      if (spent < cost[key]!) {
        cost[key] = spent;
        parent[key] = state;
        heap.push(spent + estimate(target), key);
      }
    }
  }
  return null;
}

function corners(grid: Grid, { cells, headings }: { cells: number[]; headings: number[] }, { from, to }: Request): Corner[] {
  const turns = cells.map((cell, step) => ({ cell, turn: step > 0 && step < cells.length - 1 && headings[step] !== headings[step + 1] })).filter(({ turn }) => turn);
  const inner = turns.map(({ cell }) => [...centreOf(cell, grid.columns)] as [number, number]);
  const [leaveHeading, arriveHeading] = [headings[1] ?? headings[0]!, headings.at(-1)!];
  if (inner.length > 0) {
    if (leaveHeading % 2 === 1) inner[0]![0] = from[0];
    else inner[0]![1] = from[1];
    const last = inner.at(-1)!;
    if (arriveHeading % 2 === 1) last[0] = to[0];
    else last[1] = to[1];
  }
  return [from, ...inner, to];
}

export function routeWires(requests: readonly Request[], obstacles: readonly Box[], frame: Frame): (Corner[] | null)[] {
  const grid = gridFor(obstacles, frame);
  const order = requests.map((request, index) => ({ request, index, length: Math.abs(request.to[0] - request.from[0]) + Math.abs(request.to[1] - request.from[1]) })).sort((first, second) => second.length - first.length);
  const routes: (Corner[] | null)[] = requests.map(() => null);
  for (const { request, index } of order) {
    const close = openLeads(grid, request);
    const found = search(grid, request);
    close();
    if (!found) continue;
    commit(grid, found.cells, found.headings);
    routes[index] = corners(grid, found, request);
  }
  return routes;
}
