// Wires the layer tabs, the 1 to 4 keys and the URL hash to the layout's data-layer attribute; the panel follows through the callback.

import { LAYERS, hashOfLayer, layerFromHash, layerOfKey, nextLayer } from '../../content/layers.ts';
import type { LayerId } from '../../content/layers.ts';

const TAB_STEPS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 };
const TEXT_ENTRY = 'input, textarea, select, [contenteditable]';

export function mountLayerSwitch(onChange: (layer: LayerId) => void): void {
  const layout = document.querySelector<HTMLElement>('.layout');
  const tablist = document.querySelector<HTMLElement>('[role="tablist"]');
  if (!layout || !tablist) return;

  const tabs = [...tablist.querySelectorAll<HTMLElement>('[role="tab"]')];
  let current = layerFromHash(location.hash);

  const select = (layer: LayerId): void => {
    current = layer;
    layout.dataset.layer = layer;
    tabs.forEach((tab, index) => {
      const selected = LAYERS[index]?.id === layer;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
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
    const isTyping = event.target instanceof Element && event.target.closest(TEXT_ENTRY) !== null;
    if (layer && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) select(layer);
  });
  window.addEventListener('hashchange', () => select(layerFromHash(location.hash)));
  select(current);
}
