// Lights one room at a time from hover, focus, arrows or an idle tour, in one eased frame loop; shows the room's panel block, titles the plate after the layer, and sends packets down the active room's cables. A cable lights its source room.

import { DEPARTMENTS } from '../../content/departments.ts';
import { DEFAULT_LAYER, layerById, panelVisibility } from '../../content/layers.ts';
import type { LayerId } from '../../content/layers.ts';
import { announceActiveRoom, onRoomRequest } from './activeRoom.ts';
import type { ActiveRoom } from './activeRoom.ts';
import { mountLayerSwitch } from './layerSwitch.ts';
import { NO_ACTIVE_ROOM, createPackets } from './packets.ts';
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
const ROOM_KEYS = '[data-keys="rooms"] .iso-key';
const ROOM_COUNT = DEPARTMENTS.length;
const FIRST_ROOM = 0;

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
  const panels = DEPARTMENTS.map(({ id }) => document.querySelector<HTMLElement>(`[data-panel="${id}"]`));
  const announcer = Object.assign(document.createElement('span'), { className: 'hospital-floor-announcer' });
  announcer.setAttribute('aria-live', 'polite');
  figure.append(announcer);

  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const packets = createPackets(stage, still);
  const interaction: { tour: TourState; pinned: number | null; deliberate: boolean; hovering: boolean; focused: boolean } = {
    tour: { index: 0, elapsed: 0 },
    pinned: null,
    deliberate: false,
    hovering: false,
    focused: false,
  };
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let shownIndex = -1;
  let touchTimer = 0;
  let activeLayer: LayerId = DEFAULT_LAYER;
  let published: ActiveRoom | null = null;
  let flowing = false;

  const activeIndex = () => interaction.pinned ?? interaction.tour.index;
  const isEngaged = () => interaction.pinned !== null || interaction.hovering || interaction.focused;
  const isTouring = () => !still.matches && visible && !interaction.hovering && !interaction.focused && interaction.pinned === null;

  function write(room: RoomView): void {
    room.groups.forEach(({ element, owners }) => {
      const glow = Math.max(...owners.map((owner) => rooms[owner]?.level ?? 0));
      element.style.setProperty('--glow', glow.toFixed(3));
    });
    if (room.key) room.key.toggleAttribute('data-active', room.level > HALF_LEVEL);
  }

  function showPanel(roomIndex: number, layer: LayerId): void {
    panelVisibility(roomIndex, layer, ROOM_COUNT).forEach((shownLayer, index) => {
      const panel = panels[index];
      if (!panel) return;
      panel.hidden = shownLayer === null;
      panel.querySelectorAll<HTMLElement>('[data-layer]').forEach((block) => {
        block.hidden = block.dataset.layer !== shownLayer;
      });
    });
  }

  const sendPackets = (): void => {
    packets?.setActiveRoom(activeLayer === DEFAULT_LAYER ? NO_ACTIVE_ROOM : shownIndex);
    flowing = packets !== null && activeLayer !== DEFAULT_LAYER;
  };

  const say = (index: number): void => {
    if (index === shownIndex) return;
    shownIndex = index;
    readout.textContent = readoutOf(index);
    showPanel(index, activeLayer);
    sendPackets();
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

  function publish(force = false): void {
    const room = { index: activeIndex(), engaged: isEngaged(), deliberate: interaction.pinned !== null && interaction.deliberate };
    if (!force && published?.index === room.index && published.engaged === room.engaged && published.deliberate === room.deliberate) return;
    published = room;
    announceActiveRoom(room);
  }

  function tick(now: number): void {
    const seconds = lastTime ? Math.min((now - lastTime) / 1000, MAX_FRAME_SECONDS) : FIRST_FRAME_SECONDS;
    lastTime = now;
    if (isTouring()) interaction.tour = advanceTour(interaction.tour, seconds, DWELL_SECONDS, ROOM_COUNT);
    publish();
    const moving = step(seconds);
    if (packets) flowing = packets.advance(seconds);
    frame = visible && (moving || isTouring() || flowing) ? requestAnimationFrame(tick) : 0;
  }

  function kick(): void {
    publish();
    if (still.matches) {
      step(0);
      return;
    }
    if (frame || !visible) return;
    lastTime = 0;
    frame = requestAnimationFrame(tick);
  }

  function pin(index: number, announce: boolean, deliberate = announce): void {
    const room = wrapIndex(index, ROOM_COUNT);
    interaction.deliberate = deliberate || (interaction.pinned === room && interaction.deliberate);
    interaction.pinned = room;
    if (announce) announcer.textContent = readoutOf(interaction.pinned);
    kick();
  }

  function release(): void {
    interaction.pinned = null;
    interaction.tour = { ...interaction.tour, elapsed: 0 };
    kick();
  }

  const roomIndexOf = (target: EventTarget | null): number => {
    const element = target instanceof Element ? target : null;
    const token = element?.closest('[data-cable]')?.getAttribute('data-from') ?? element?.closest('[data-room]')?.getAttribute('data-room')?.split(' ')[0];
    return DEPARTMENTS.findIndex(({ id }) => id === token);
  };

  const keyIndexOf = (target: EventTarget | null): number => {
    const key = target instanceof Element ? target.closest('.iso-key') : null;
    return key instanceof HTMLElement ? keyElements.indexOf(key) : -1;
  };

  const onFigure = <Name extends keyof HTMLElementEventMap>(name: Name, handler: (event: HTMLElementEventMap[Name]) => void): void =>
    figure.addEventListener(name, handler);

  onFigure('pointerover', (event) => {
    interaction.hovering = true;
    const fromKey = keyIndexOf(event.target);
    const index = fromKey >= 0 ? fromKey : roomIndexOf(event.target);
    if (index >= 0) pin(index, false);
    else publish();
    if (event.pointerType === 'touch') {
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(release, TOUCH_HOLD_MILLISECONDS);
    }
  });
  onFigure('pointerleave', (event) => {
    interaction.hovering = false;
    if (event.pointerType !== 'touch' && !interaction.focused) release();
    kick();
  });
  onFigure('focusin', (event) => {
    interaction.focused = true;
    const index = keyIndexOf(event.target);
    if (index >= 0) pin(index, true);
    else kick();
  });
  onFigure('focusout', (event) => {
    if (event.relatedTarget instanceof Node && figure.contains(event.relatedTarget)) return;
    interaction.focused = false;
    if (!interaction.hovering) release();
  });
  onFigure('keydown', (event) => {
    const stepBy = ARROW_STEPS[event.key];
    const jump = event.key === 'Home' ? 0 : event.key === 'End' ? ROOM_COUNT - 1 : undefined;
    if (stepBy === undefined && jump === undefined) return;
    event.preventDefault();
    pin(jump ?? activeIndex() + (stepBy ?? 0), true);
  });

  onRoomRequest((request) => {
    if (request.action === 'pin') pin(request.index, false, true);
    else if (request.action === 'release') release();
    else publish(true);
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
  mountLayerSwitch((layer) => {
    activeLayer = layer;
    interaction.hovering = figure.matches(':hover');
    interaction.focused = figure.contains(document.activeElement);
    const { title: plateTitle, hint: plateHint } = layerById(layer);
    if (title) title.textContent = plateTitle;
    if (hint) hint.textContent = plateHint;
    showPanel(Math.max(shownIndex, FIRST_ROOM), layer);
    sendPackets();
    kick();
  });
  step(0);
}

document.querySelectorAll<HTMLElement>('.hospital-floor').forEach(mount);
