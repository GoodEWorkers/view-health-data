// Hovering a cable of Réseau (or a first touch tap) walks a packet along it and lights its hops in the strip at the bottom of the side panel. A click (or a second tap) opens the view of a cable or a piece of gear.

import { activates } from '../touchArm.ts';
import { announceNetworkTrace, requestNetworkView } from './networkChannel.ts';
import { walkAt } from './trace.ts';

const NETWORK_LAYER = 'reseau';
const FIREWALL = '[data-equipment="firewall-eai"]';
const TELECOM = '[data-equipment="telecom-eai"]';
const BEAD_RADIUS = 2.4;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const MILLISECONDS = 1000;

const stopsOf = (cable: Element): number[] => (cable.getAttribute('data-stops') ?? '').split(',').filter(Boolean).map(Number);

function mount(figure: HTMLElement): void {
  const svg = figure.querySelector<SVGSVGElement>('.iso-svg');
  const layout = document.querySelector<HTMLElement>('.layout');
  const packetLayer = svg?.querySelector('[data-packets]');
  if (!svg || !layout || !packetLayer) return;

  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const cables = new Map([...svg.querySelectorAll<SVGGElement>('[data-cable]')].map((cable) => [cable.dataset.trace ?? '', cable]));
  const firewall = svg.querySelector<SVGGElement>(FIREWALL);
  const bead = document.createElementNS(SVG_NAMESPACE, 'circle');
  bead.setAttribute('r', String(BEAD_RADIUS));
  bead.dataset.trace = '';

  let traced: SVGGElement | null = null;
  let hops: HTMLElement[] = [];
  let started = 0;
  let frame = 0;

  const isNetwork = (): boolean => layout.dataset.layer === NETWORK_LAYER;

  function showPanel(key: string | null): void {
    document.querySelectorAll<HTMLElement>('ol[data-trace]').forEach((list) => (list.hidden = list.dataset.trace !== key));
    document.querySelectorAll<HTMLElement>('[data-trace-panel]').forEach((panel) => {
      const showing = panel.querySelector('ol[data-trace]:not([hidden])') !== null;
      panel.querySelectorAll<HTMLElement>('[data-trace-hint]').forEach((hint) => (hint.hidden = showing));
    });
    document.querySelectorAll<HTMLElement>('[data-open-flow]').forEach((button) => button.toggleAttribute('data-current', button.dataset.openFlow === key));
    hops = key === null ? [] : [...document.querySelectorAll<HTMLElement>(`ol[data-trace]:not([hidden]) > li`)];
  }

  function light(hop: number): void {
    hops.forEach((item, index) => item.toggleAttribute('data-here', index === hop));
  }

  function step(now: number): void {
    if (!traced) return;
    const core = traced.querySelector<SVGPathElement>('.cable-core');
    const { share, hop, visible } = walkAt(stopsOf(traced), (now - started) / MILLISECONDS);
    if (core && visible) {
      const point = core.getPointAtLength(share * core.getTotalLength());
      bead.setAttribute('cx', point.x.toFixed(1));
      bead.setAttribute('cy', point.y.toFixed(1));
      packetLayer!.append(bead);
    } else bead.remove();
    light(hop);
    frame = requestAnimationFrame(step);
  }

  function stop(): void {
    cancelAnimationFrame(frame);
    frame = 0;
    bead.remove();
    light(-1);
    traced?.removeAttribute('data-traced');
    firewall?.style.setProperty('--crossing', '0');
    traced = null;
  }

  function trace(cable: SVGGElement | null): void {
    if (cable === traced) return;
    stop();
    if (!cable || !isNetwork()) return;
    traced = cable;
    cable.toggleAttribute('data-traced', true);
    const key = cable.dataset.trace ?? null;
    showPanel(key);
    announceNetworkTrace({ key });
    bead.style.setProperty('--room', cable.style.getPropertyValue('--family'));
    firewall?.style.setProperty('--crossing', cable.querySelector('.cable-gate') ? '1' : '0');
    started = performance.now();
    if (still.matches) light(0);
    else frame = requestAnimationFrame(step);
  }

  const cableOf = (target: EventTarget | null): SVGGElement | null => {
    const element = target instanceof Element ? target : null;
    const flow = element?.closest<HTMLElement>('[data-open-flow]')?.dataset.openFlow;
    return flow === undefined ? (element?.closest<SVGGElement>('[data-cable]') ?? null) : (cables.get(flow) ?? null);
  };

  figure.addEventListener('pointerover', (event) => event.pointerType !== 'touch' && trace(cableOf(event.target)));
  document.addEventListener(
    'pointerdown',
    (event) => event.pointerType === 'touch' && cableOf(event.target) !== traced && trace(null),
    true,
  );
  document.addEventListener('focusin', (event) => trace(event.target instanceof Element && event.target.matches(':focus-visible') ? cableOf(event.target) : null));
  document.addEventListener('focusout', () => trace(null));
  figure.addEventListener('pointerleave', (event) => event.pointerType !== 'touch' && trace(null));
  new MutationObserver(() => isNetwork() || trace(null)).observe(layout, { attributes: true, attributeFilter: ['data-layer'] });

  figure.addEventListener('click', (event) => {
    if (!isNetwork() || !(event.target instanceof Element)) return;
    const cable = event.target.closest<SVGGElement>('[data-cable]');
    const telecom = event.target.closest(TELECOM);
    const opensFlow = cable?.dataset.trace !== undefined;
    const opensRules = event.target.closest(FIREWALL) !== null;
    if (!opensFlow && !opensRules && !telecom) return;
    if (!activates(event)) {
      trace(cable ?? null);
      return;
    }
    if (opensFlow) requestNetworkView({ action: 'open', view: 'flow', key: cable!.dataset.trace!, opener: cable! });
    else if (opensRules) requestNetworkView({ action: 'open', view: 'rules', opener: firewall ?? undefined });
    else requestNetworkView({ action: 'open', view: 'partners', opener: telecom ?? undefined });
  });
}

document.querySelectorAll<HTMLElement>('.hospital-floor').forEach(mount);
