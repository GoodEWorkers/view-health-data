// Wires the header's layer tabs, the 1 to 4 keys and the URL hash to the layout's data-layer attribute and to the header sentence; the panel follows through the callback.

import { LAYERS, hashOfLayer, layerById, layerFromHash, layerOfKey, nextLayer } from '../../content/layers.ts';
import type { LayerId } from '../../content/layers.ts';
import { isTyping } from './typing.ts';

const TAB_STEPS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 };
const SENTENCE_FADE = { duration: 160, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' };

export function mountLayerSwitch(onChange: (layer: LayerId) => void): void {
  const layout = document.querySelector<HTMLElement>('.layout');
  const tablist = document.querySelector<HTMLElement>('[role="tablist"]');
  if (!layout || !tablist) return;

  const tabs = [...tablist.querySelectorAll<HTMLElement>('[role="tab"]')];
  const sentence = document.querySelector<HTMLElement>('[data-layer-overview]');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let current = layerFromHash(location.hash);

  const showSentence = (layer: LayerId): void => {
    const { overview } = layerById(layer);
    if (!sentence || sentence.textContent === overview) return;
    sentence.textContent = overview;
    if (!still.matches) sentence.animate([{ opacity: 0 }, { opacity: 1 }], SENTENCE_FADE);
  };

  const revealTab = (tab: HTMLElement): void =>
    tablist.scrollTo({ left: tab.offsetLeft - (tablist.clientWidth - tab.offsetWidth) / 2, behavior: still.matches ? 'auto' : 'smooth' });

  const select = (layer: LayerId): void => {
    current = layer;
    layout.dataset.layer = layer;
    tabs.forEach((tab, index) => {
      const selected = LAYERS[index]?.id === layer;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) revealTab(tab);
    });
    showSentence(layer);
    history.replaceState(null, '', `${location.pathname}${location.search}${hashOfLayer(layer)}`);
    onChange(layer);
  };

  tabs.forEach((tab, index) =>
    tab.addEventListener('click', () => {
      const layer = LAYERS[index]?.id;
      if (layer) select(layer);
    }),
  );
  tablist.addEventListener('keydown', (event) => {
    const step = TAB_STEPS[event.key];
    if (step === undefined) return;
    event.preventDefault();
    select(nextLayer(current, step));
    tabs[LAYERS.findIndex(({ id }) => id === current)]?.focus();
  });
  document.addEventListener('keydown', (event) => {
    const layer = layerOfKey(event.key);
    if (layer && !isTyping(event.target) && !event.ctrlKey && !event.metaKey && !event.altKey) select(layer);
  });
  window.addEventListener('hashchange', () => select(layerFromHash(location.hash)));
  select(current);
}
