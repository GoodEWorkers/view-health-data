// After a touch selection on a phone the side panel sits below the figure: bring its sticky head to the top so the result of the tap is in view.

import { isTouchPhone } from './phone.ts';

export function revealSelectionBar(): void {
  if (!isTouchPhone()) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelector<HTMLElement>('[data-selection-bar]')?.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
}
