// Drives the fullscreen views of the Réseau layer over the stage: flow sheet, rule table, partners, glossary. The panel grows from what was clicked on the inspector's motion; Escape, × or the scrim closes it; Left and Right step through a room's flows.

import { neighbourIndex, stepOfKey } from '../inspector/navigation.ts';
import { matrix3dOf } from '../screens/homography.ts';
import type { Bounds } from '../screens/focus.ts';
import { inspectBounds, inspectFades, inspectQuad, rectQuad, stepInspect } from '../screens/inspect.ts';
import { easeOut } from '../screens/motion.ts';
import { matchesQuery } from './glossaryFilter.ts';
import { announceNetworkView, isNetworkView, onNetworkTrace, onNetworkViewRequest, requestNetworkView } from './networkChannel.ts';
import type { NetworkViewRequest } from './networkChannel.ts';

const NETWORK_LAYER = 'reseau';
const MAX_FRAME_SECONDS = 0.05;
const CENTRE_PROXY = { width: 48, height: 28 };
const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
const NO_RULE_NOTE = 'Ce flux ne change pas de zone : aucune règle du pare-feu ne s\'applique.';

function mount(root: HTMLElement): void {
  const stage = root.parentElement;
  const layout = document.querySelector<HTMLElement>('.layout');
  const panel = root.querySelector<HTMLElement>('[data-panel]');
  const scrim = root.querySelector<HTMLElement>('[data-scrim]');
  if (!stage || !layout || !panel || !scrim) return;

  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const articles = [...root.querySelectorAll<HTMLElement>('[data-view]')];
  const flows = articles.filter((article) => article.dataset.view === 'flow');
  const field = root.querySelector<HTMLInputElement>('[data-glossary-filter]');
  const terms = [...root.querySelectorAll<HTMLElement>('[data-search]')];
  const count = root.querySelector<HTMLElement>('[data-glossary-count]');
  const empty = root.querySelector<HTMLElement>('[data-glossary-empty]');
  const hitNote = root.querySelector<HTMLElement>('[data-hit-note]');
  const defaultNote = hitNote?.textContent ?? '';

  let area: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  let current: HTMLElement | null = null;
  let opener: Element | null = null;
  let lastKey: string | null = null;
  let from = rectQuad(area);
  let level = 0;
  let target: 0 | 1 = 0;
  let frame = 0;
  let lastTime = 0;

  function measure(): void {
    const box = stage!.getBoundingClientRect();
    area = inspectBounds(box.width, box.height);
    panel!.style.setProperty('width', `${area.width}px`);
    panel!.style.setProperty('height', `${area.height}px`);
  }

  function openerQuad(element: Element | null) {
    const box = stage!.getBoundingClientRect();
    const rect = element !== null && stage!.contains(element) ? element.getBoundingClientRect() : null;
    const [width, height] = rect ? [rect.width, rect.height] : [CENTRE_PROXY.width, CENTRE_PROXY.height];
    return rectQuad({ x: rect ? rect.left - box.left : (box.width - width) / 2, y: rect ? rect.top - box.top : (box.height - height) / 2, width, height });
  }

  function place(): void {
    const fades = inspectFades(level, still.matches);
    const quad = still.matches ? rectQuad(area) : inspectQuad(from, easeOut(level), area);
    panel!.style.transform = matrix3dOf(area.width, area.height, quad);
    panel!.style.opacity = fades.panel.toFixed(3);
    scrim!.style.opacity = (1 - fades.backdrop).toFixed(3);
  }

  function tick(now: number): void {
    const seconds = lastTime ? Math.min((now - lastTime) / 1000, MAX_FRAME_SECONDS) : 0;
    lastTime = now;
    level = stepInspect(level, target, seconds, still.matches);
    place();
    const moving = level !== target;
    frame = moving ? requestAnimationFrame(tick) : 0;
    if (moving) return;
    lastTime = 0;
    if (target === 0) {
      root.hidden = true;
      articles.forEach((article) => (article.hidden = true));
    }
  }

  const kick = (): void => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  function highlightRule(): void {
    const article = flows.find((flow) => flow.dataset.flowKey === lastKey);
    const rule = article?.dataset.rule ?? '';
    root.querySelectorAll<HTMLElement>('[data-rule-id]').forEach((row) => row.toggleAttribute('data-hit', row.dataset.ruleId === rule));
    if (!hitNote) return;
    const title = article?.querySelector('.in-name')?.textContent ?? '';
    hitNote.textContent = article === undefined ? defaultNote : rule === '' ? `${title} : ${NO_RULE_NOTE}` : `Dernier flux survolé : ${title}, règle n° ${rule}.`;
    root.querySelector('[data-rule-id][data-hit]')?.scrollIntoView({ block: 'nearest' });
  }

  function filterGlossary(): void {
    const query = field?.value ?? '';
    const shown = terms.filter((term) => {
      const matches = matchesQuery(term.dataset.search ?? '', query);
      term.hidden = !matches;
      return matches;
    });
    if (count) count.textContent = `${shown.length} ${shown.length > 1 ? 'termes' : 'terme'}${query.trim() === '' ? '' : ` sur ${terms.length}`}`;
    if (empty) empty.hidden = shown.length > 0;
  }

  function open(request: Extract<NetworkViewRequest, { action: 'open' }>): void {
    if (layout!.dataset.layer !== NETWORK_LAYER) return;
    const article = request.view === 'flow' ? flows.find((flow) => flow.dataset.flowKey === request.key) : articles.find((candidate) => candidate.dataset.view === request.view);
    if (!article) return;
    const wasClosed = current === null;
    articles.forEach((candidate) => (candidate.hidden = candidate !== article));
    current = article;
    article.querySelectorAll<HTMLElement>('.nv-body, .nv-scroll').forEach((body) => (body.scrollTop = 0));
    if (request.view === 'rules') highlightRule();
    if (request.view === 'glossary' && field) {
      field.value = '';
      filterGlossary();
    }
    if (wasClosed) {
      opener = document.activeElement;
      measure();
      from = openerQuad(request.opener ?? null);
      root.hidden = false;
      target = 1;
      kick();
    }
    place();
    (request.view === 'glossary' ? field : panel)?.focus({ preventScroll: true });
    announceNetworkView({ view: request.view });
  }

  function close(): void {
    if (current === null) return;
    current = null;
    target = 0;
    kick();
    announceNetworkView({ view: null });
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
  }

  function go(step: number): void {
    if (!current) return;
    const siblings = flows.filter((flow) => flow.dataset.room === current!.dataset.room);
    const next = siblings[neighbourIndex(siblings.indexOf(current), step, siblings.length)];
    if (next?.dataset.flowKey) requestNetworkView({ action: 'open', view: 'flow', key: next.dataset.flowKey });
  }

  document.addEventListener('click', (event) => {
    const element = event.target instanceof Element ? event.target : null;
    const action = element?.closest<HTMLElement>('[data-action]')?.dataset.action;
    const key = element?.closest<HTMLElement>('[data-open-flow]')?.dataset.openFlow;
    const view = element?.closest<HTMLElement>('[data-open-view]')?.dataset.openView;
    if (action === 'close' && root.contains(element)) close();
    else if ((action === 'previous' || action === 'next') && root.contains(element)) go(action === 'next' ? 1 : -1);
    else if (key !== undefined) requestNetworkView({ action: 'open', view: 'flow', key, opener: element?.closest('[data-open-flow]') ?? undefined });
    else if (isNetworkView(view) && view !== 'flow') requestNetworkView({ action: 'open', view, opener: element?.closest('[data-open-view]') ?? undefined });
  });
  document.addEventListener(
    'keydown',
    (event) => {
      if (current === null || !ARROWS.includes(event.key)) return;
      event.stopPropagation();
      const step = stepOfKey(event.key);
      const typing = event.target instanceof Element && event.target.closest('input') !== null;
      if (step === undefined || current.dataset.view !== 'flow' || typing || event.defaultPrevented) return;
      event.preventDefault();
      go(step);
    },
    true,
  );
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || current === null) return;
    event.preventDefault();
    close();
  });
  field?.addEventListener('input', filterGlossary);
  onNetworkViewRequest((request) => (request.action === 'close' ? close() : open(request)));
  onNetworkTrace(({ key }) => (lastKey = key));
  new MutationObserver(() => layout.dataset.layer !== NETWORK_LAYER && close()).observe(layout, { attributes: true, attributeFilter: ['data-layer'] });
  new ResizeObserver(() => {
    measure();
    place();
  }).observe(stage);
  measure();
  place();
}

document.querySelectorAll<HTMLElement>('[data-network-views]').forEach(mount);
