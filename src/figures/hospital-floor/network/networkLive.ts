// Plays the Réseau sequence off one clock: zones tint the floor, the gear glows from the server room outwards, cables draw themselves and close their firewall gates; leaving runs it back. It only reads the layer from the layout.

import { ranksFrom } from '../screens/motion.ts';
import { TOTAL_SECONDS, advanceTime } from '../screens/sequence.ts';
import { drawProgressAt, gateShowAt, networkTimelineOf, pulseAt, revealedDashArray, waveProgressAt, zoneShowAt } from './networkSequence.ts';

const NETWORK_LAYER = 'reseau';
const WAVE_ORIGIN = 'firewall-eai';
const MAX_FRAME_SECONDS = 0.05;
const DIGITS = 3;

type GearView = { readonly element: SVGGElement; readonly rank: number };
type CableView = {
  readonly group: SVGGElement;
  readonly glow: SVGPathElement | null;
  readonly core: SVGPathElement | null;
  readonly length: number;
  readonly dash: readonly number[];
  readonly gates: readonly SVGPathElement[];
};

const centreOf = (element: SVGGraphicsElement): [number, number] => {
  const { x, y, width, height } = element.getBBox();
  return [x + width / 2, y + height / 2];
};

function mount(figure: HTMLElement): void {
  const svg = figure.querySelector<SVGSVGElement>('.iso-svg');
  const layout = document.querySelector<HTMLElement>('.layout');
  if (!svg || !layout) return;

  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const gearElements = [...svg.querySelectorAll<SVGGElement>('[data-equipment]')];
  const origin = Math.max(0, gearElements.findIndex((element) => element.dataset.equipment === WAVE_ORIGIN));
  const ranks = ranksFrom(gearElements.map(centreOf), origin);
  const gear: GearView[] = gearElements.map((element, index) => ({ element, rank: ranks[index]! }));
  const cables: CableView[] = [...svg.querySelectorAll<SVGGElement>('[data-cable]')].map((group) => {
    const core = group.querySelector<SVGPathElement>('.cable-core');
    return {
      group,
      glow: group.querySelector<SVGPathElement>('.cable-glow'),
      core,
      length: core?.getTotalLength() ?? 0,
      dash: (group.dataset.dash ?? '').split(' ').filter(Boolean).map(Number),
      gates: [...group.querySelectorAll<SVGPathElement>('.cable-gate, .cable-gate-halo')],
    };
  });
  const timeline = networkTimelineOf(gear.length, cables.length);

  let time = 0;
  let forward = false;
  let frame = 0;
  let lastTime = 0;

  function placeCable({ group, glow, core, length, dash, gates }: CableView, index: number, share: number): void {
    const draw = still.matches ? share : drawProgressAt(timeline, index, time);
    const drawing = draw > 0 && draw < 1 && !still.matches;
    group.style.visibility = draw > 0 ? 'visible' : 'hidden';
    group.setAttribute('opacity', (still.matches ? share : 1).toFixed(DIGITS));
    if (glow) glow.style.strokeDasharray = drawing ? revealedDashArray([], draw * length, length) : '';
    if (core) core.style.strokeDasharray = drawing ? revealedDashArray(dash, draw * length, length) : '';
    gates.forEach((gate) => (gate.style.opacity = (still.matches ? 1 : gateShowAt(draw)).toFixed(DIGITS)));
  }

  function place(): void {
    const share = time / TOTAL_SECONDS;
    figure.style.setProperty('--zone-show', (still.matches ? share : zoneShowAt(time)).toFixed(DIGITS));
    gear.forEach(({ element, rank }) => element.style.setProperty('--wave', (still.matches ? 0 : pulseAt(waveProgressAt(timeline, rank, time))).toFixed(DIGITS)));
    cables.forEach((cable, index) => placeCable(cable, index, share));
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

  const syncLayer = (): void => {
    forward = layout.dataset.layer === NETWORK_LAYER;
    if (!frame) frame = requestAnimationFrame(tick);
  };
  new MutationObserver(syncLayer).observe(layout, { attributes: true, attributeFilter: ['data-layer'] });
  place();
  syncLayer();
}

document.querySelectorAll<HTMLElement>('.hospital-floor').forEach(mount);
