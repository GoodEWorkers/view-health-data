// Drives the side panel from the selection: the selected room's section on the active layer, or the overview when nothing is selected. A change fades out and back in over 200 ms and scrolls to the top; the room chips and the deselect button ask live.ts.

import { DEPARTMENTS } from '../../content/departments.ts';
import { DEFAULT_LAYER, panelVisibility } from '../../content/layers.ts';
import type { LayerId } from '../../content/layers.ts';
import { onSelection, requestRoom } from './activeRoom.ts';

const FADE_MILLISECONDS = 200;
const NO_ROOM = -1;

function mount(panel: HTMLElement): void {
  const layout = document.querySelector<HTMLElement>('.layout');
  const scroll = panel.querySelector<HTMLElement>('[data-panel-scroll]');
  const overview = panel.querySelector<HTMLElement>('[data-overview]');
  const bar = panel.querySelector<HTMLElement>('[data-selection-bar]');
  if (!layout || !scroll || !overview || !bar) return;

  const sections = DEPARTMENTS.map(({ id }) => panel.querySelector<HTMLElement>(`[data-panel="${id}"]`));
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const layerOf = (): LayerId => (layout.dataset.layer ?? DEFAULT_LAYER) as LayerId;
  let selected: number | null = null;
  let layer = layerOf();
  let shownKey = '';
  let timer = 0;
  let focusAfter: (() => void) | null = null;

  const keyOf = (): string => `${selected}|${layer}`;

  function render(): void {
    shownKey = keyOf();
    overview!.hidden = selected !== null;
    overview!.querySelectorAll<HTMLElement>('[data-overview-layer]').forEach((sentence) => (sentence.hidden = sentence.dataset.overviewLayer !== layer));
    panelVisibility(selected ?? NO_ROOM, layer, sections.length).forEach((shownLayer, index) => {
      const section = sections[index];
      if (!section) return;
      section.hidden = shownLayer === null;
      section.querySelectorAll<HTMLElement>('[data-layer]').forEach((block) => (block.hidden = block.dataset.layer !== shownLayer));
    });
    scroll!.scrollTop = 0;
    focusAfter?.();
    focusAfter = null;
  }

  function refresh(): void {
    bar!.hidden = selected === null;
    if (keyOf() === shownKey) {
      focusAfter = null;
      return;
    }
    window.clearTimeout(timer);
    if (still.matches) {
      render();
      return;
    }
    scroll!.dataset.fade = 'out';
    timer = window.setTimeout(() => {
      render();
      delete scroll!.dataset.fade;
    }, FADE_MILLISECONDS / 2);
  }

  panel.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const chip = target?.closest<HTMLElement>('[data-select-room]');
    if (chip) {
      const index = Number(chip.dataset.selectRoom);
      focusAfter = () => sections[index]?.querySelector<HTMLElement>('h2')?.focus();
      requestRoom({ action: 'select', index });
    } else if (target?.closest('[data-deselect]')) {
      const previous = selected;
      focusAfter = () => overview.querySelector<HTMLElement>(`[data-select-room="${previous}"]`)?.focus({ preventScroll: true });
      requestRoom({ action: 'deselect' });
    }
  });
  onSelection((selection) => {
    selected = selection.selected;
    refresh();
  });
  new MutationObserver(() => {
    layer = layerOf();
    refresh();
  }).observe(layout, { attributes: true, attributeFilter: ['data-layer'] });
  render();
  requestRoom({ action: 'sync' });
}

document.querySelectorAll<HTMLElement>('[data-side-panel]').forEach(mount);
