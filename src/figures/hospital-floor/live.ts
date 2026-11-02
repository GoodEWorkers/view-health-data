// Lights one room from the highlight (hover, a focused legend key, the idle tour) in one eased frame loop and marks the selected room; clicks and keys select, hover never does. The pointed and selected rooms go on .layout for the flow filter.

import { DEPARTMENTS } from '../../content/departments.ts';
import { DEFAULT_LAYER, layerById } from '../../content/layers.ts';
import type { LayerId } from '../../content/layers.ts';
import { announceSelection, onRoomRequest } from './activeRoom.ts';
import { mountLayerSwitch } from './layerSwitch.ts';
import { NO_ACTIVE_ROOM, createPackets } from './packets.ts';
import { revealSelectionBar } from './revealPanel.ts';
import { FIRST_ROOM, escape, focusIn, focusOut, focusedOf, highlightedOf, hover, leave, select, setTourEnabled, startInteraction, stepSelection, tourRunning, tourTick } from './selection.ts';
import type { Interaction } from './selection.ts';
import { createTooltip } from './tooltip.ts';
import { ROOM_ARM_PREFIX, activates, armKeyOf, disarm, isArmed, isTouching, trackPointer } from './touchArm.ts';
import { follow, wrapIndex } from './tour.ts';

const DWELL_SECONDS = 2.8;
const FOLLOW_SECONDS = 0.3;
const MAX_FRAME_SECONDS = 1 / 30;
const FIRST_FRAME_SECONDS = 1 / 60;
const SETTLE_EPSILON = 0.01;
const HALF_LEVEL = 0.5;
const VIEWPORT_MARGIN = '120px 0px';
const ARROW_STEPS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
const ROOM_KEYS = '[data-keys="rooms"] .iso-key';
const OVERLAYS = '[data-inspector], [data-network-views]';
const ROOM_COUNT = DEPARTMENTS.length;
const LAST_ROOM = ROOM_COUNT - 1;
const TOOLTIP_HINT = 'Cliquer pour les détails';
const TOUCH_HINT = 'Touchez encore pour les détails';
const TOUCH_LIFT_PIXELS = 80;
const PACKET_LAYER: LayerId = 'reseau';
const MILLISECONDS = 1000;
const SELECTED_NONE = 'Aucune salle sélectionnée';

const roomIdOf = (index: number | null): string | undefined => (index === null ? undefined : DEPARTMENTS[index]?.id);

const setData = (element: HTMLElement, name: 'focusRoom' | 'selectedRoom', value: string | undefined): void => {
  if (value === undefined) delete element.dataset[name];
  else if (element.dataset[name] !== value) element.dataset[name] = value;
};

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

  const layout = figure.closest<HTMLElement>('.layout');
  const title = figure.querySelector<HTMLElement>('[data-corner="title"]');
  const hint = figure.querySelector<HTMLElement>('[data-corner="hint"]');
  const keyElements = [...figure.querySelectorAll<HTMLElement>(ROOM_KEYS)];
  const ownersOf = (element: Element): number[] =>
    (element.getAttribute('data-room') ?? element.getAttribute('data-from') ?? '').split(' ').map((token) => DEPARTMENTS.findIndex(({ id }) => id === token));
  const rooms: RoomView[] = DEPARTMENTS.map(({ id }, index) => ({
    groups: [...stage.querySelectorAll<SVGElement>(`[data-room~="${id}"], [data-from="${id}"]`)].map((element) => ({ element, owners: ownersOf(element) })),
    key: keyElements[index],
    level: 0,
  }));
  const announcer = Object.assign(document.createElement('span'), { className: 'hospital-floor-announcer' });
  announcer.setAttribute('aria-live', 'polite');
  figure.append(announcer);

  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const packets = createPackets(stage, still);
  const tooltip = createTooltip(still);
  const idleReadout = readout.textContent ?? '';
  let state: Interaction = startInteraction();
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let shownIndex = NO_ACTIVE_ROOM;
  let activeLayer: LayerId = DEFAULT_LAYER;
  let flowing = false;
  let idleTimer = 0;

  function write(room: RoomView): void {
    room.groups.forEach(({ element, owners }) => {
      const glow = Math.max(...owners.map((owner) => rooms[owner]?.level ?? 0));
      element.style.setProperty('--glow', glow.toFixed(3));
    });
    if (room.key) room.key.toggleAttribute('data-active', room.level > HALF_LEVEL);
  }

  function markSelected(): void {
    rooms.forEach((room, index) => {
      room.groups.forEach(({ element, owners }) => element.toggleAttribute('data-selected', state.selected !== null && owners.includes(state.selected)));
      room.key?.setAttribute('aria-pressed', String(index === state.selected));
    });
  }

  const sendPackets = (): void => {
    packets?.setActiveRoom(activeLayer === PACKET_LAYER ? shownIndex : NO_ACTIVE_ROOM);
    flowing = packets !== null && activeLayer === PACKET_LAYER;
  };

  const say = (index: number): void => {
    if (index === shownIndex) return;
    shownIndex = index;
    readout.textContent = index === NO_ACTIVE_ROOM ? idleReadout : readoutOf(index);
    sendPackets();
  };

  function markFocus(): void {
    if (!layout) return;
    setData(layout, 'focusRoom', roomIdOf(focusedOf(state)));
    setData(layout, 'selectedRoom', roomIdOf(state.selected));
  }

  function step(seconds: number): boolean {
    const active = highlightedOf(state);
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
    say(rooms[brightest]!.level >= HALF_LEVEL ? brightest : NO_ACTIVE_ROOM);
    return moving;
  }

  function tick(now: number): void {
    const seconds = lastTime ? Math.min((now - lastTime) / 1000, MAX_FRAME_SECONDS) : FIRST_FRAME_SECONDS;
    lastTime = now;
    state = tourTick(state, seconds, DWELL_SECONDS, ROOM_COUNT);
    const moving = step(seconds);
    if (packets && flowing) flowing = packets.advance(seconds);
    const animating = visible && (moving || flowing);
    frame = animating ? requestAnimationFrame(tick) : 0;
    if (!animating && visible && tourRunning(state)) sleepUntilNextRoom();
  }

  function sleepUntilNextRoom(): void {
    const wait = DWELL_SECONDS - state.tour.elapsed;
    idleTimer = window.setTimeout(() => {
      state = tourTick(state, wait, DWELL_SECONDS, ROOM_COUNT);
      kick();
    }, wait * MILLISECONDS);
  }

  function kick(): void {
    window.clearTimeout(idleTimer);
    if (still.matches) {
      step(0);
      return;
    }
    if (frame || !visible) return;
    lastTime = 0;
    frame = requestAnimationFrame(tick);
  }

  function apply(next: Interaction): void {
    const changed = next.selected !== state.selected;
    state = next;
    markFocus();
    if (changed) {
      markSelected();
      announceSelection({ selected: state.selected });
      announcer.textContent = state.selected === null ? SELECTED_NONE : `Salle sélectionnée : ${readoutOf(state.selected)}`;
    }
    kick();
  }

  const roomIndexOf = (target: EventTarget | null): number => {
    const element = target instanceof Element ? target : null;
    if (!element || element.closest(OVERLAYS)) return -1;
    const token = element.closest('[data-cable], [data-wire]')?.getAttribute('data-from') ?? element.closest('[data-room]')?.getAttribute('data-room')?.split(' ')[0];
    return DEPARTMENTS.findIndex(({ id }) => id === token);
  };

  const keyIndexOf = (target: EventTarget | null): number => {
    const key = target instanceof Element ? target.closest('.iso-key') : null;
    return key instanceof HTMLElement ? keyElements.indexOf(key) : -1;
  };

  const targetRoomOf = (target: EventTarget | null): number => {
    const fromKey = keyIndexOf(target);
    return fromKey >= 0 ? fromKey : roomIndexOf(target);
  };

  const onFigure = <Name extends keyof HTMLElementEventMap>(name: Name, handler: (event: HTMLElementEventMap[Name]) => void): void =>
    figure.addEventListener(name, handler);

  onFigure('pointerover', (event) => {
    if (event.pointerType === 'touch') return;
    const index = targetRoomOf(event.target);
    apply(hover(state, index >= 0 ? index : null));
    if (index < 0) tooltip.hide();
    else tooltip.show(`${index + 1} · ${readoutOf(index)}`, TOOLTIP_HINT, { x: event.clientX, y: event.clientY });
  });
  onFigure('pointermove', (event) => event.pointerType !== 'touch' && tooltip.move({ x: event.clientX, y: event.clientY }));
  onFigure('pointerleave', (event) => {
    if (event.pointerType === 'touch') return;
    tooltip.hide();
    apply(leave(state));
  });
  const clearPreview = (): void => {
    disarm();
    tooltip.hide();
    apply(leave(state));
  };
  onFigure('click', (event) => {
    const index = targetRoomOf(event.target);
    if (index < 0) {
      if (isTouching()) clearPreview();
      return;
    }
    if (activates(event)) {
      tooltip.hide();
      apply(select(state, index));
      if (isTouching() && (keyIndexOf(event.target) >= 0 || armKeyOf(event.target)?.startsWith(ROOM_ARM_PREFIX))) revealSelectionBar();
      return;
    }
    apply(hover(state, index));
    tooltip.show(`${index + 1} · ${readoutOf(index)}`, TOUCH_HINT, { x: event.clientX, y: event.clientY - TOUCH_LIFT_PIXELS });
  });
  document.addEventListener(
    'pointerdown',
    (event) => {
      trackPointer(event);
      const outside = !(event.target instanceof Node && figure.contains(event.target));
      if (event.pointerType === 'touch' && outside && (isArmed() || state.pointerInside)) clearPreview();
    },
    true,
  );
  window.addEventListener('scroll', () => tooltip.hide(), { capture: true, passive: true });
  onFigure('focusin', (event) => {
    if (!(event.target instanceof Element) || !event.target.matches(':focus-visible')) return;
    const index = keyIndexOf(event.target);
    apply(focusIn(state, index >= 0 ? index : null));
  });
  onFigure('focusout', (event) => {
    if (event.relatedTarget instanceof Node && figure.contains(event.relatedTarget)) return;
    apply(focusOut(state));
  });
  onFigure('keydown', (event) => {
    const keyed = keyIndexOf(event.target);
    if ((event.key === 'Enter' || event.key === ' ') && keyed >= 0) {
      event.preventDefault();
      apply(select(state, keyed));
      return;
    }
    const stepBy = ARROW_STEPS[event.key];
    const jump = event.key === 'Home' ? FIRST_ROOM : event.key === 'End' ? LAST_ROOM : undefined;
    if (stepBy === undefined && jump === undefined) return;
    event.preventDefault();
    apply(jump === undefined ? stepSelection(state, stepBy ?? 0, ROOM_COUNT) : select(state, jump));
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !event.defaultPrevented) apply(escape(state));
  });

  onRoomRequest((request) => {
    if (request.action === 'select') apply(select(state, wrapIndex(request.index, ROOM_COUNT)));
    else if (request.action === 'deselect') apply(escape(state));
    else announceSelection({ selected: state.selected });
  });

  keyElements.forEach((key) => {
    key.tabIndex = 0;
    key.setAttribute('role', 'button');
    key.setAttribute('aria-pressed', 'false');
  });
  new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1]?.isIntersecting ?? false;
      state = setTourEnabled(state, visible && !still.matches);
      if (visible) kick();
    },
    { rootMargin: VIEWPORT_MARGIN },
  ).observe(figure);
  mountLayerSwitch((layer) => {
    activeLayer = layer;
    const { title: plateTitle, hint: plateHint } = layerById(layer);
    if (title) title.textContent = plateTitle;
    if (hint) hint.textContent = plateHint;
    sendPackets();
    kick();
  });
  step(0);
}

document.querySelectorAll<HTMLElement>('.hospital-floor').forEach(mount);
