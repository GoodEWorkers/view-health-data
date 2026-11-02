// The phone form of the fullscreen views: the panel fills the viewport and rises a short way as it fades in; while it is open everything behind it is inert and the dialog is modal.

const RISE_PIXELS = 40;

export const sheetTransform = (progress: number): string => (progress >= 1 ? 'none' : `translate3d(0, ${((1 - progress) * RISE_PIXELS).toFixed(1)}px, 0)`);

export function holdSheet(root: HTMLElement, panel: HTMLElement): () => void {
  const held: HTMLElement[] = [];
  const parked: [HTMLElement, string][] = [];
  for (let node: HTMLElement | null = root; node && node !== document.body; node = node.parentElement) {
    const tabindex = node.getAttribute('tabindex');
    if (node !== root && tabindex !== null) {
      parked.push([node, tabindex]);
      node.tabIndex = -1;
    }
    for (const sibling of node.parentElement?.children ?? []) {
      if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert) continue;
      sibling.inert = true;
      held.push(sibling);
    }
  }
  panel.setAttribute('aria-modal', 'true');
  return () => {
    held.forEach((element) => (element.inert = false));
    parked.forEach(([element, tabindex]) => element.setAttribute('tabindex', tabindex));
    panel.setAttribute('aria-modal', 'false');
  };
}
