// Plays the window sequence off one clock: anchor glow, wires drawing, eight windows rising and staying open on Logiciels and Données, where each then loads and becomes an editor. Talks to live.ts only through activeRoom.ts.

import { onActiveRoom, requestRoom } from '../activeRoom.ts';
import type { ActiveRoom } from '../activeRoom.ts';
import { announceInspector, onInspectorRequest } from '../inspector/inspectorChannel.ts';
import { FOCUS_SCALE, STAGE_MARGIN, focusQuad, stepFocus } from './focus.ts';
import type { Bounds } from './focus.ts';
import { matrix3dOf } from './homography.ts';
import { inspectBounds, inspectFades, inspectQuad, rectQuad, stepInspect } from './inspect.ts';
import type { InspectFades } from './inspect.ts';
import type { Corner, Quad } from './homography.ts';
import { LABEL_HEIGHT, LOGICAL, PLUG_LENGTH, chordControls, labelPoint, plugAngleDegrees, plugEnd, scaleOfQuad, socketEnd, splineCurves, splinePath } from './jackWires.ts';
import type { Box, WireEnd } from './jackWires.ts';
import { easeOut, mixQuads, ranksFrom } from './motion.ts';
import { indexOfRoom, readAnchors, readInspector, readScreens, readWires } from './screensDom.ts';
import type { ScreenView, WireView } from './screensDom.ts';
import { TOTAL_SECONDS, advanceTime, loadingEndsAt, progressAt, timelineOf, viewAt } from './sequence.ts';
import { fitViewBox, quadToStage, toStage } from './stage.ts';
import type { Fit } from './stage.ts';

const OPEN_LAYERS = ['logiciels', 'donnees'];
const EDITOR_LAYER = 'donnees';
const SPREAD_FROM = 'dpi';
const MAX_FRAME_SECONDS = 0.05;
const FADE_PROGRESS = 0.18;
const ROUTE_FROM = 0.45;
const SHADOW_OFFSET_PIXELS = 16;
const FOCUS_SHADOW_GAIN = 1;
const FOCUSED_LAYER = '5';
const FOCUSED_SHADOW_LAYER = '4';
const SHADOW_OPACITY = 0.9;
const HANG_RATIO = 0.12;
const MAX_HANG = 18;
const DASH_PATTERN = '1 2';

const smoothstep = (value: number): number => {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
};

const boxOf = ([[leftX, topY], , [rightX, bottomY]]: Quad): Box => ({ x: leftX, y: topY, width: rightX - leftX, height: bottomY - topY });

function mount(layer: HTMLElement): void {
  const stage = layer.closest<HTMLElement>('.iso-stage');
  const svg = stage?.querySelector<SVGSVGElement>('.iso-svg');
  const layout = document.querySelector<HTMLElement>('.layout');
  if (!stage || !svg || !layout) return;

  const [viewWidth, viewHeight] = (layer.dataset.view ?? '').split(' ').map(Number) as [number, number];
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const [views, wires, anchors, inspector] = [readScreens(layer), readWires(layer), readAnchors(stage), readInspector(layer)];
  const timeline = timelineOf(views.length, wires.length);
  const ranks = ranksFrom(views.map(({ end }): Corner => [(end[0][0] + end[2][0]) / 2, (end[0][1] + end[2][1]) / 2]), indexOfRoom(SPREAD_FROM));

  let fit: Fit = { scale: 1, offsetX: 0, offsetY: 0 };
  let bounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  let inspectArea: Bounds = bounds;
  let focused: number | null = null;
  let inspected: number | null = null;
  let inspectFrom = 0;
  let inspectLevel = 0;
  let activeRoom: ActiveRoom | null = null;
  let time = 0;
  let dataTime = 0;
  let forward = false;
  let editing = false;
  let frame = 0;
  let lastTime = 0;
  let currentLayer = '';

  function measure(): void {
    const [stageBox, svgBox] = [stage!.getBoundingClientRect(), svg!.getBoundingClientRect()];
    fit = fitViewBox(svgBox.width, svgBox.height, { width: viewWidth, height: viewHeight }, svgBox.left - stageBox.left, svgBox.top - stageBox.top);
    bounds = { x: STAGE_MARGIN, y: STAGE_MARGIN, width: stageBox.width - 2 * STAGE_MARGIN, height: stageBox.height - 2 * STAGE_MARGIN };
    inspectArea = inspectBounds(stageBox.width, stageBox.height);
    inspector?.panel.style.setProperty('width', `${inspectArea.width}px`);
    inspector?.panel.style.setProperty('height', `${inspectArea.height}px`);
  }

  function placeScreen(view: ScreenView, index: number, rank: number, fades: InspectFades): void {
    view.level = progressAt(timeline.open, rank, time);
    view.progress = still.matches ? 1 : easeOut(view.level);
    view.fade = still.matches ? view.level : Math.min(1, view.progress / FADE_PROGRESS);
    const content = editing && time >= TOTAL_SECONDS ? viewAt(dataTime, rank) : { mode: 'skeleton', progress: 0 };
    view.element.dataset.content = content.mode;
    view.element.style.setProperty('--load', (still.matches ? 1 : content.progress).toFixed(3));
    const lifted = easeOut(view.focus);
    view.base = quadToStage(fit, mixQuads(view.start, view.end, view.progress));
    view.quad = focusQuad(view.base, lifted, bounds, FOCUS_SCALE);
    const shown = view.level > 0;
    view.element.hidden = !shown;
    view.shadow.hidden = !shown;
    if (!shown) return;
    const matrix = matrix3dOf(LOGICAL.width, LOGICAL.height, view.quad);
    view.element.style.transform = matrix;
    const inspectShare = index === inspectFrom ? fades.opener : fades.backdrop;
    view.element.style.opacity = (view.fade * inspectShare).toFixed(3);
    const depth = view.progress * (1 + FOCUS_SHADOW_GAIN * lifted);
    view.element.style.zIndex = view.focus > 0 ? FOCUSED_LAYER : '';
    view.shadow.style.zIndex = view.focus > 0 ? FOCUSED_SHADOW_LAYER : '';
    view.shadow.style.transform = `translate(0px, ${(SHADOW_OFFSET_PIXELS * depth).toFixed(2)}px) ${matrix}`;
    view.shadow.style.setProperty('--lift', depth.toFixed(3));
    view.shadow.style.opacity = (view.fade * SHADOW_OPACITY * inspectShare).toFixed(3);
  }

  function placeWire(wire: WireView, fades: InspectFades): void {
    const [from, to] = [views[wire.source]!, views[wire.target]!];
    const ends: [WireEnd, WireEnd] = [socketEnd(from.quad, 'bottom', wire.sourceSlot, wire.sourceCount), socketEnd(to.quad, 'top', wire.targetSlot, wire.targetCount)];
    const [start, finish] = [plugEnd(ends[0], PLUG_LENGTH * scaleOfQuad(from.quad)), plugEnd(ends[1], PLUG_LENGTH * scaleOfQuad(to.quad))];
    const route = wire.route.map((point) => toStage(fit, point));
    const relaxed = 1 - Math.max(easeOut(from.focus), easeOut(to.focus));
    const share = smoothstep((Math.min(from.progress, to.progress) - ROUTE_FROM) / (1 - ROUTE_FROM)) * relaxed;
    const hang = Math.min(Math.hypot(finish[0] - start[0], finish[1] - start[1]) * HANG_RATIO, MAX_HANG * fit.scale);
    const curves = splineCurves(chordControls(start, finish, route, share, hang));
    const path = splinePath(curves);
    wire.paths.forEach((element) => element.setAttribute('d', path));
    [from, to].forEach((view, index) => {
      const [x, y] = ends[index]!.point;
      wire.plugs[index]!.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${plugAngleDegrees(ends[index]!.outward).toFixed(2)}) scale(${scaleOfQuad(view.quad).toFixed(4)})`);
    });
    const draw = progressAt(timeline.draw, wire.index, time);
    const visible = draw > 0;
    const drawing = visible && draw < 1 && !still.matches;
    wire.group.style.visibility = visible ? 'visible' : 'hidden';
    wire.group.setAttribute('opacity', ((still.matches ? draw : 1) * fades.backdrop).toFixed(3));
    wire.strokes.forEach((element) => {
      element.style.strokeDasharray = drawing ? DASH_PATTERN : 'none';
      element.style.strokeDashoffset = drawing ? String(1 - draw) : '0';
    });
    wire.plugs[1]!.style.visibility = draw >= 1 || (still.matches && visible) ? 'visible' : 'hidden';
    if (!wire.label) return;
    const [x, y] = labelPoint(curves, [wire.labelWidth, LABEL_HEIGHT], views.map((view) => boxOf(view.quad)));
    wire.label.style.visibility = visible && inspectLevel === 0 ? 'visible' : 'hidden';
    wire.label.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  }

  function placeInspector(fades: InspectFades): void {
    if (!inspector) return;
    inspector.root.hidden = inspected === null && inspectLevel === 0;
    if (inspector.root.hidden || inspectArea.width <= 0 || inspectArea.height <= 0) return;
    const quad = still.matches ? rectQuad(inspectArea) : inspectQuad(views[inspectFrom]!.base, easeOut(inspectLevel), inspectArea);
    inspector.panel.style.transform = matrix3dOf(inspectArea.width, inspectArea.height, quad);
    inspector.panel.style.opacity = fades.panel.toFixed(3);
    inspector.scrim.style.opacity = (1 - fades.backdrop).toFixed(3);
  }

  function place(): void {
    const fades = inspectFades(inspectLevel, still.matches);
    views.forEach((view, index) => placeScreen(view, index, ranks[index]!, fades));
    wires.forEach((wire) => placeWire(wire, fades));
    placeInspector(fades);
    anchors.forEach(({ element, room }) => element.style.setProperty('--wave', easeOut(progressAt(timeline.glow, ranks[room]!, time)).toFixed(3)));
  }

  function tick(now: number): void {
    const seconds = lastTime ? Math.min((now - lastTime) / 1000, MAX_FRAME_SECONDS) : 0;
    lastTime = now;
    time = advanceTime(time, forward, seconds, still.matches);
    dataTime = editing && time >= TOTAL_SECONDS ? dataTime + seconds : 0;
    views.forEach((view, index) => (view.focus = stepFocus(view.focus, focused === index ? 1 : 0, seconds, still.matches)));
    const inspectTarget = inspected === null ? 0 : 1;
    inspectLevel = stepInspect(inspectLevel, inspectTarget, seconds, still.matches);
    place();
    const focusing = views.some((view, index) => view.focus !== (focused === index ? 1 : 0)) || inspectLevel !== inspectTarget;
    const moving = (forward ? time < TOTAL_SECONDS : time > 0) || (editing && dataTime < loadingEndsAt(views.length)) || focusing;
    frame = moving ? requestAnimationFrame(tick) : 0;
    if (!moving) lastTime = 0;
  }

  function focusOn(index: number | null): void {
    focused = index;
    views.forEach(({ element }, position) => element.toggleAttribute('data-focus', position === index));
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function inspect(index: number | null): void {
    if (index === inspected) return;
    inspected = index;
    if (index !== null) inspectFrom = index;
    focusOn(null);
    placeInspector(inspectFades(inspectLevel, still.matches));
    announceInspector({ index });
  }

  function steer(open: boolean, edit: boolean): void {
    [forward, editing] = [open, edit];
    if (!open || edit) focusOn(null);
    if (!edit) inspect(null);
    layer.dataset.state = open ? 'up' : 'down';
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function onClick(event: MouseEvent): void {
    if (!OPEN_LAYERS.includes(currentLayer) || !(event.target instanceof Element) || event.target.closest('[data-inspector]')) return;
    const clicked = indexOfRoom(event.target.closest<HTMLElement>('[data-window]')?.dataset.window);
    if (clicked >= 0) {
      requestRoom({ action: 'pin', index: clicked });
      if (currentLayer === EDITOR_LAYER) inspect(clicked);
      else focusOn(focused === clicked ? null : clicked);
      return;
    }
    if (event.target.closest('[data-wire]')) return;
    const room = event.target.closest('[data-anchor]')?.closest('[data-room]')?.getAttribute('data-room');
    if (room) requestRoom({ action: 'pin', index: indexOfRoom(room) });
    else {
      requestRoom({ action: 'release' });
      focusOn(null);
    }
  }

  function showRange(view: ScreenView, key: string | undefined): void {
    const wanted = view.ranges.some(({ dataset }) => dataset.range === key) ? key : view.mainRange;
    view.ranges.forEach((range) => range.toggleAttribute('data-on', range.dataset.range === wanted));
  }

  function onWireHover(event: Event): void {
    const wire = event.target instanceof Element ? event.target.closest<SVGGElement>('[data-wire]') : null;
    const hovered = event.type === 'pointerover' ? wire : null;
    const [source, target] = hovered ? [indexOfRoom(hovered.dataset.from), indexOfRoom(hovered.dataset.to)] : [-1, -1];
    views.forEach((view, index) => {
      view.element.toggleAttribute('data-lit', index === source || index === target);
      showRange(view, index === source ? hovered?.dataset.sourceRange : index === target ? hovered?.dataset.targetRange : undefined);
    });
  }

  stage.addEventListener('click', onClick);
  stage.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.target !== stage || currentLayer !== EDITOR_LAYER || !activeRoom?.deliberate) return;
    event.preventDefault();
    inspect(activeRoom.index);
  });
  document.addEventListener('keydown', (event) => event.key === 'Escape' && (inspected === null ? focusOn(null) : inspect(null)));
  onInspectorRequest((request) => inspect(request.action === 'open' && currentLayer === EDITOR_LAYER ? request.index : null));
  onActiveRoom((room) => {
    activeRoom = room;
    if (inspected !== null && room.deliberate && room.index !== inspected) inspect(room.index);
  });
  requestRoom({ action: 'sync' });
  layer.addEventListener('pointerover', onWireHover);
  layer.addEventListener('pointerout', onWireHover);
  new ResizeObserver(() => {
    measure();
    place();
  }).observe(stage);

  const syncLayer = (): void => {
    currentLayer = layout.dataset.layer ?? '';
    steer(OPEN_LAYERS.includes(currentLayer), currentLayer === EDITOR_LAYER);
  };
  new MutationObserver(syncLayer).observe(layout, { attributes: true, attributeFilter: ['data-layer'] });
  syncLayer();
  measure();
  place();
}

document.querySelectorAll<HTMLElement>('[data-screens]').forEach(mount);
