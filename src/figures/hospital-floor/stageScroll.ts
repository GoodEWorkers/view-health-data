// On phones the stage scrolls sideways: it opens centred on the plan, brings the selected room and its key into view, and drops the zoom hint at the first gesture.

import { DEPARTMENTS } from '../../content/departments.ts';
import { onSelection } from './activeRoom.ts';
import { isPhone } from './phone.ts';

const MOVED_PIXELS = 1;
const ROOM_FLOOR = '.room-floor';

const behaviourOf = (still: MediaQueryList): ScrollBehavior => (still.matches ? 'auto' : 'smooth');

function mount(figure: HTMLElement): void {
  const scroller = figure.querySelector<HTMLElement>('[data-stage-scroll]');
  if (!scroller) return;
  const hint = figure.querySelector<HTMLElement>('[data-stage-hint]');
  const strip = figure.querySelector<HTMLElement>('[data-keys="rooms"]');
  const keys = [...figure.querySelectorAll<HTMLElement>('[data-keys="rooms"] .iso-key')];
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let restLeft = 0;

  const hideHint = (): void => {
    if (hint) hint.hidden = true;
  };

  function centre(): void {
    if (!isPhone()) return;
    scroller!.scrollLeft = (scroller!.scrollWidth - scroller!.clientWidth) / 2;
    restLeft = scroller!.scrollLeft;
  }

  function reveal(index: number): void {
    const id = DEPARTMENTS[index]?.id;
    const room = id && scroller!.querySelector(`[data-room="${id}"] ${ROOM_FLOOR}`);
    if (!room) return;
    const [view, box] = [scroller!.getBoundingClientRect(), room.getBoundingClientRect()];
    if (box.left >= view.left && box.right <= view.right) return;
    scroller!.scrollTo({ left: scroller!.scrollLeft + box.left + box.width / 2 - view.left - view.width / 2, behavior: behaviourOf(still) });
  }

  function revealKey(index: number): void {
    const key = keys[index];
    if (!key || !strip) return;
    const [lane, box] = [strip.getBoundingClientRect(), key.getBoundingClientRect()];
    strip.scrollTo({ left: strip.scrollLeft + box.left + box.width / 2 - lane.left - lane.width / 2, behavior: behaviourOf(still) });
  }

  requestAnimationFrame(() => {
    centre();
    scroller.addEventListener('pointerdown', hideHint, { once: true, passive: true });
    scroller.addEventListener('wheel', hideHint, { once: true, passive: true });
    scroller.addEventListener('scroll', () => Math.abs(scroller.scrollLeft - restLeft) > MOVED_PIXELS && hideHint(), { passive: true });
    window.visualViewport?.addEventListener('resize', hideHint, { once: true });
  });
  onSelection(({ selected }) => {
    if (selected === null || !isPhone()) return;
    reveal(selected);
    revealKey(selected);
  });
}

document.querySelectorAll<HTMLElement>('.hospital-floor').forEach(mount);
