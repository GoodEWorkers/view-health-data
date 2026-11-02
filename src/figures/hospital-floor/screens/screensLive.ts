// Plays the Logiciels sequence off one clock: the anchor computers glow in a wave, the jack wires draw themselves between the monitors, the eight windows rise and stay open. Leaving the layer runs the clock back. Talks to live.ts only through activeRoom.ts.

import { requestRoom } from '../activeRoom.ts';
import { matrix3dOf } from './homography.ts';
import type { Corner, Quad } from './homography.ts';
import { LABEL_HEIGHT, LOGICAL, PLUG_LENGTH, chordControls, labelPoint, plugAngleDegrees, plugEnd, scaleOfQuad, socketEnd, splineCurves, splinePath } from './jackWires.ts';
import type { Box, WireEnd } from './jackWires.ts';
import { easeOut, mixQuads, ranksFrom } from './motion.ts';
import { indexOfRoom, readAnchors, readScreens, readWires } from './screensDom.ts';
import type { ScreenView, WireView } from './screensDom.ts';
import { TOTAL_SECONDS, advanceTime, progressAt, timelineOf } from './sequence.ts';
import { fitViewBox, quadToStage, toStage } from './stage.ts';
import type { Fit } from './stage.ts';

const LAYER = 'logiciels';
const SPREAD_FROM = 'dpi';
const MAX_FRAME_SECONDS = 0.05;
const FADE_PROGRESS = 0.18;
const ROUTE_FROM = 0.45;
const SHADOW_OFFSET_PIXELS = 16;
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
  const [views, wires, anchors] = [readScreens(layer), readWires(layer), readAnchors(stage)];
  const timeline = timelineOf(views.length, wires.length);
  const ranks = ranksFrom(views.map(({ end }): Corner => [(end[0][0] + end[2][0]) / 2, (end[0][1] + end[2][1]) / 2]), indexOfRoom(SPREAD_FROM));

  let fit: Fit = { scale: 1, offsetX: 0, offsetY: 0 };
  let time = 0;
  let forward = false;
  let frame = 0;
  let lastTime = 0;
  let currentLayer = '';

  function measure(): void {
    const [stageBox, svgBox] = [stage!.getBoundingClientRect(), svg!.getBoundingClientRect()];
    fit = fitViewBox(svgBox.width, svgBox.height, { width: viewWidth, height: viewHeight }, svgBox.left - stageBox.left, svgBox.top - stageBox.top);
  }

  function placeScreen(view: ScreenView, rank: number): void {
    view.level = progressAt(timeline.open, rank, time);
    view.progress = still.matches ? 1 : easeOut(view.level);
    view.fade = still.matches ? view.level : Math.min(1, view.progress / FADE_PROGRESS);
    view.quad = quadToStage(fit, mixQuads(view.start, view.end, view.progress));
    const shown = view.level > 0;
    view.element.hidden = !shown;
    view.shadow.hidden = !shown;
    if (!shown) return;
    const matrix = matrix3dOf(LOGICAL.width, LOGICAL.height, view.quad);
    view.element.style.transform = matrix;
    view.element.style.opacity = view.fade.toFixed(3);
    view.shadow.style.transform = `translate(0px, ${(SHADOW_OFFSET_PIXELS * view.progress).toFixed(2)}px) ${matrix}`;
    view.shadow.style.setProperty('--lift', view.progress.toFixed(3));
    view.shadow.style.opacity = (view.fade * SHADOW_OPACITY).toFixed(3);
  }

  function placeWire(wire: WireView): void {
    const [from, to] = [views[wire.source]!, views[wire.target]!];
    const ends: [WireEnd, WireEnd] = [socketEnd(from.quad, 'bottom', wire.sourceSlot, wire.sourceCount), socketEnd(to.quad, 'top', wire.targetSlot, wire.targetCount)];
    const [start, finish] = [plugEnd(ends[0], PLUG_LENGTH * scaleOfQuad(from.quad)), plugEnd(ends[1], PLUG_LENGTH * scaleOfQuad(to.quad))];
    const route = wire.route.map((point) => toStage(fit, point));
    const share = smoothstep((Math.min(from.progress, to.progress) - ROUTE_FROM) / (1 - ROUTE_FROM));
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
    wire.group.setAttribute('opacity', (still.matches ? draw : 1).toFixed(3));
    wire.strokes.forEach((element) => {
      element.style.strokeDasharray = drawing ? DASH_PATTERN : 'none';
      element.style.strokeDashoffset = drawing ? String(1 - draw) : '0';
    });
    wire.plugs[1]!.style.visibility = draw >= 1 || (still.matches && visible) ? 'visible' : 'hidden';
    if (!wire.label) return;
    const [x, y] = labelPoint(curves, [wire.labelWidth, LABEL_HEIGHT], views.map((view) => boxOf(view.quad)));
    wire.label.style.visibility = visible ? 'visible' : 'hidden';
    wire.label.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  }

  function place(): void {
    views.forEach((view, index) => placeScreen(view, ranks[index]!));
    wires.forEach(placeWire);
    anchors.forEach(({ element, room }) => element.style.setProperty('--wave', easeOut(progressAt(timeline.glow, ranks[room]!, time)).toFixed(3)));
  }

  function tick(now: number): void {
    const seconds = lastTime ? Math.min((now - lastTime) / 1000, MAX_FRAME_SECONDS) : 0;
    lastTime = now;
    time = advanceTime(time, forward, seconds, still.matches);
    place();
    const moving = forward ? time < TOTAL_SECONDS : time > 0;
    frame = moving ? requestAnimationFrame(tick) : 0;
    if (!moving) lastTime = 0;
  }

  function steer(next: boolean): void {
    forward = next;
    layer.dataset.state = next ? 'up' : 'down';
    const atRest = next ? time >= TOTAL_SECONDS : time <= 0;
    if (!frame && !atRest) frame = requestAnimationFrame(tick);
  }

  function onClick(event: MouseEvent): void {
    if (currentLayer !== LAYER || !(event.target instanceof Element)) return;
    const room = event.target.closest<HTMLElement>('[data-window]')?.dataset.window ?? event.target.closest('[data-anchor]')?.closest('[data-room]')?.getAttribute('data-room');
    if (room) requestRoom({ action: 'pin', index: indexOfRoom(room) });
    else if (!event.target.closest('[data-wire]')) requestRoom({ action: 'release' });
  }

  function onWireHover(event: Event): void {
    const wire = event.target instanceof Element ? event.target.closest<SVGGElement>('[data-wire]') : null;
    const lit = event.type === 'pointerover' && wire ? [indexOfRoom(wire.dataset.from), indexOfRoom(wire.dataset.to)] : [];
    views.forEach(({ element }, index) => element.toggleAttribute('data-lit', lit.includes(index)));
  }

  stage.addEventListener('click', onClick);
  layer.addEventListener('pointerover', onWireHover);
  layer.addEventListener('pointerout', onWireHover);
  new ResizeObserver(() => {
    measure();
    place();
  }).observe(stage);

  const syncLayer = (): void => {
    currentLayer = layout.dataset.layer ?? '';
    steer(currentLayer === LAYER);
  };
  new MutationObserver(syncLayer).observe(layout, { attributes: true, attributeFilter: ['data-layer'] });
  syncLayer();
  measure();
  place();
}

document.querySelectorAll<HTMLElement>('[data-screens]').forEach(mount);
