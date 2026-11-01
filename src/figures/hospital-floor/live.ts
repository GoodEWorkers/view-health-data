// Lights one room at a time from hover, focus, arrow keys or an idle tour, eased by exponential follow in one animation frame loop; shows the active room's department panel.

import { DEPARTMENTS } from '../../content/departments.ts';
import { advanceTour, follow, wrapIndex } from './tour.ts';
import type { TourState } from './tour.ts';

const DWELL_SECONDS = 2.8;
const FOLLOW_SECONDS = 0.3;
const MAX_FRAME_SECONDS = 1 / 30;
const FIRST_FRAME_SECONDS = 1 / 60;
const SETTLE_EPSILON = 0.002;
const HALF_LEVEL = 0.5;
const TOUCH_HOLD_MILLISECONDS = 3600;
const VIEWPORT_MARGIN = '120px 0px';
const ARROW_STEPS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
const ROOM_COUNT = DEPARTMENTS.length;

type GroupView = { readonly element: SVGElement; readonly owners: readonly number[] };
type RoomView = { readonly groups: readonly GroupView[]; readonly key: HTMLElement | undefined; level: number };

const readoutOf = (index: number): string => {
  const { acronym, roomName } = DEPARTMENTS[index]!;
  return acronym === roomName ? roomName : `${acronym} · ${roomName}`;
};

function mount(figure: HTMLElement): void {
  const stage = figure.querySelector<HTMLElement>('.iso-stage');
  const readout = figure.querySelector<HTMLElement>('[data-readout]');
  if (!stage || !readout) return;

  const keyElements = [...figure.querySelectorAll<HTMLElement>('.iso-key')];
  const ownersOf = (element: Element): number[] =>
    (element.getAttribute('data-room') ?? '').split(' ').map((token) => DEPARTMENTS.findIndex(({ id }) => id === token));
  const rooms: RoomView[] = DEPARTMENTS.map(({ id }, index) => ({
    groups: [...stage.querySelectorAll<SVGElement>(`[data-room~="${id}"]`)].map((element) => ({ element, owners: ownersOf(element) })),
    key: keyElements[index],
    level: 0,
  }));
  const panels = DEPARTMENTS.map(({ id }) => document.querySelector<HTMLElement>(`[data-panel="${id}"]`));
  const announcer = Object.assign(document.createElement('span'), { className: 'hospital-floor-announcer' });
  announcer.setAttribute('aria-live', 'polite');
  figure.append(announcer);

  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const interaction: { tour: TourState; pinned: number | null; hovering: boolean; focused: boolean } = {
    tour: { index: 0, elapsed: 0 },
    pinned: null,
    hovering: false,
    focused: false,
  };
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let shownIndex = -1;
  let touchTimer = 0;

  const activeIndex = () => interaction.pinned ?? interaction.tour.index;
  const isTouring = () => !still.matches && visible && !interaction.hovering && !interaction.focused && interaction.pinned === null;

  function write(room: RoomView): void {
    room.groups.forEach(({ element, owners }) => {
      const glow = Math.max(...owners.map((owner) => rooms[owner]?.level ?? 0));
      element.style.setProperty('--glow', glow.toFixed(3));
    });
    if (room.key) room.key.toggleAttribute('data-active', room.level > HALF_LEVEL);
  }

  const say = (index: number): void => {
    if (index === shownIndex) return;
    shownIndex = index;
    readout.textContent = readoutOf(index);
    panels.forEach((panel, panelIndex) => {
      if (panel) panel.hidden = panelIndex !== index;
    });
  };

  function step(seconds: number): boolean {
    const active = activeIndex();
    let moving = false;
    rooms.forEach((room, index) => {
      const target = index === active ? 1 : 0;
      const next = still.matches ? target : follow(room.level, target, seconds, FOLLOW_SECONDS);
      const level = Math.abs(next - target) < SETTLE_EPSILON ? target : next;
      if (level !== room.level) {
        room.level = level;
        write(room);
      }
      moving ||= level !== target;
    });
    const brightest = rooms.reduce((best, room, index) => (room.level > rooms[best]!.level ? index : best), 0);
    if (rooms[brightest]!.level >= HALF_LEVEL) say(brightest);
    return moving;
  }

  function tick(now: number): void {
    const seconds = lastTime ? Math.min((now - lastTime) / 1000, MAX_FRAME_SECONDS) : FIRST_FRAME_SECONDS;
    lastTime = now;
    if (isTouring()) interaction.tour = advanceTour(interaction.tour, seconds, DWELL_SECONDS, ROOM_COUNT);
    const moving = step(seconds);
    frame = visible && (moving || isTouring()) ? requestAnimationFrame(tick) : 0;
  }

  function kick(): void {
    if (still.matches) {
      step(0);
      return;
    }
    if (frame || !visible) return;
    lastTime = 0;
    frame = requestAnimationFrame(tick);
  }

  function pin(index: number, announce: boolean): void {
    interaction.pinned = wrapIndex(index, ROOM_COUNT);
    if (announce) announcer.textContent = readoutOf(interaction.pinned);
    kick();
  }

  function release(): void {
    interaction.pinned = null;
    interaction.tour = { ...interaction.tour, elapsed: 0 };
    kick();
  }

  const roomIndexOf = (target: EventTarget | null): number => {
    const token = target instanceof Element ? target.closest('[data-room]')?.getAttribute('data-room')?.split(' ')[0] : undefined;
    return DEPARTMENTS.findIndex(({ id }) => id === token);
  };

  const keyIndexOf = (target: EventTarget | null): number => {
    const key = target instanceof Element ? target.closest('.iso-key') : null;
    return key instanceof HTMLElement ? keyElements.indexOf(key) : -1;
  };

  figure.addEventListener('pointerover', (event) => {
    interaction.hovering = true;
    const fromKey = keyIndexOf(event.target);
    const index = fromKey >= 0 ? fromKey : roomIndexOf(event.target);
    if (index >= 0) pin(index, false);
    if (event.pointerType === 'touch') {
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(release, TOUCH_HOLD_MILLISECONDS);
    }
  });
  figure.addEventListener('pointerleave', (event) => {
    interaction.hovering = false;
    if (event.pointerType !== 'touch' && !interaction.focused) release();
    kick();
  });
  figure.addEventListener('focusin', (event) => {
    interaction.focused = true;
    const index = keyIndexOf(event.target);
    if (index >= 0) pin(index, true);
    else kick();
  });
  figure.addEventListener('focusout', (event) => {
    if (event.relatedTarget instanceof Node && figure.contains(event.relatedTarget)) return;
    interaction.focused = false;
    if (!interaction.hovering) release();
  });
  figure.addEventListener('keydown', (event) => {
    const stepBy = ARROW_STEPS[event.key];
    const jump = event.key === 'Home' ? 0 : event.key === 'End' ? ROOM_COUNT - 1 : undefined;
    if (stepBy === undefined && jump === undefined) return;
    event.preventDefault();
    pin(jump ?? activeIndex() + (stepBy ?? 0), true);
  });

  keyElements.forEach((key) => {
    key.tabIndex = 0;
    key.setAttribute('role', 'button');
  });
  new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1]?.isIntersecting ?? false;
      if (visible) kick();
    },
    { rootMargin: VIEWPORT_MARGIN },
  ).observe(figure);
  step(0);
}

document.querySelectorAll<HTMLElement>('.hospital-floor').forEach(mount);
