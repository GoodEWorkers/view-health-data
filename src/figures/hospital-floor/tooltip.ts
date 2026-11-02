// The pointer tooltip: a paper card, room name over its action, that follows the mouse with a short lag, flips away from the viewport edges, and is never shown for touch or keyboard. Under reduced motion it has no lag.

import { follow } from './tour.ts';

const CURSOR_GAP = 16;
const EDGE_MARGIN = 8;
const FOLLOW_SECONDS = 0.07;
const SETTLE_PIXELS = 0.4;
const MAX_FRAME_SECONDS = 1 / 30;

export type Point = { readonly x: number; readonly y: number };
export type Size = { readonly width: number; readonly height: number };

export const tooltipPlacement = (pointer: Point, card: Size, viewport: Size): Point => {
  const fitsRight = pointer.x + CURSOR_GAP + card.width <= viewport.width - EDGE_MARGIN;
  const fitsBelow = pointer.y + CURSOR_GAP + card.height <= viewport.height - EDGE_MARGIN;
  return {
    x: Math.max(EDGE_MARGIN, fitsRight ? pointer.x + CURSOR_GAP : pointer.x - CURSOR_GAP - card.width),
    y: Math.max(EDGE_MARGIN, fitsBelow ? pointer.y + CURSOR_GAP : pointer.y - CURSOR_GAP - card.height),
  };
};

export type Tooltip = {
  readonly show: (title: string, hint: string, pointer: Point) => void;
  readonly move: (pointer: Point) => void;
  readonly hide: () => void;
};

export function createTooltip(still: MediaQueryList): Tooltip {
  const card = Object.assign(document.createElement('div'), { className: 'floor-tooltip', hidden: true });
  const title = document.createElement('strong');
  const hint = document.createElement('span');
  card.setAttribute('aria-hidden', 'true');
  card.append(title, hint);
  document.body.append(card);

  let current: Point = { x: 0, y: 0 };
  let target: Point = current;
  let frame = 0;
  let lastTime = 0;

  const paint = (): void => {
    card.style.transform = `translate3d(${current.x.toFixed(1)}px, ${current.y.toFixed(1)}px, 0)`;
  };

  function aim(pointer: Point): void {
    target = tooltipPlacement(pointer, { width: card.offsetWidth, height: card.offsetHeight }, { width: innerWidth, height: innerHeight });
  }

  function tick(now: number): void {
    const seconds = lastTime ? Math.min((now - lastTime) / 1000, MAX_FRAME_SECONDS) : 0;
    lastTime = now;
    current = { x: follow(current.x, target.x, seconds, FOLLOW_SECONDS), y: follow(current.y, target.y, seconds, FOLLOW_SECONDS) };
    const settled = Math.hypot(target.x - current.x, target.y - current.y) < SETTLE_PIXELS;
    if (settled) current = target;
    paint();
    frame = settled ? 0 : requestAnimationFrame(tick);
    if (settled) lastTime = 0;
  }

  function follows(): void {
    if (still.matches) {
      current = target;
      paint();
    } else if (!frame) frame = requestAnimationFrame(tick);
  }

  return {
    show(text, action, pointer) {
      const wasHidden = card.hidden;
      title.textContent = text;
      hint.textContent = action;
      card.hidden = false;
      aim(pointer);
      if (wasHidden) current = target;
      follows();
    },
    move(pointer) {
      if (card.hidden) return;
      aim(pointer);
      follows();
    },
    hide() {
      card.hidden = true;
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    },
  };
}
