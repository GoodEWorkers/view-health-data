// Drives the inspector once it is laid over the stage: shows the file of the room screensLive announces, wires its buttons, the Brut / Lisible toggle and the Left and Right keys, and asks screensLive to open another file or to close.

import { DEPARTMENTS } from '../../../content/departments.ts';
import { requestRoom } from '../activeRoom.ts';
import { onInspectorState, requestInspector } from './inspectorChannel.ts';
import { mountLinkHover, revealIn } from './linkHover.ts';
import type { FileLink } from './linkHover.ts';
import { neighbourIndex, stepOfKey } from './navigation.ts';

const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

function revealSelection(file: HTMLElement): void {
  file.querySelectorAll<HTMLElement>('[data-pane]').forEach((pane) => {
    pane.scrollTop = 0;
    const first = pane.querySelector<HTMLElement>('[data-on]');
    if (first) revealIn(pane, first);
  });
}

function mount(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>('[data-panel]');
  const files = DEPARTMENTS.map(({ id }) => root.querySelector<HTMLElement>(`[data-file="${id}"]`));
  if (!panel || files.some((file) => !file)) return;
  const shown = files as HTMLElement[];
  const links: FileLink[] = shown.map(mountLinkHover);
  let current: number | null = null;
  let opener: Element | null = null;

  function show(index: number | null): void {
    const wasClosed = current === null;
    shown.forEach((file, position) => (file.hidden = position !== index));
    if (index === null) {
      current = null;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
      return;
    }
    if (index !== current) {
      links[index]!.reset();
      revealSelection(shown[index]!);
    }
    if (wasClosed) {
      opener = document.activeElement;
      panel!.focus({ preventScroll: true });
    }
    current = index;
  }

  function go(step: number): void {
    const next = neighbourIndex(current ?? 0, step, shown.length);
    requestInspector({ action: 'open', index: next });
    requestRoom({ action: 'pin', index: next });
  }

  function setView(view: string): void {
    panel!.dataset.view = view;
    root.querySelectorAll<HTMLElement>('[data-view-button]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.viewButton === view)));
    if (current !== null) revealSelection(shown[current]!);
  }

  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const action = target?.closest<HTMLElement>('[data-action]')?.dataset.action;
    const view = target?.closest<HTMLElement>('[data-view-button]')?.dataset.viewButton;
    if (action === 'close') requestInspector({ action: 'close' });
    else if (action === 'previous' || action === 'next') go(action === 'next' ? 1 : -1);
    else if (view) setView(view);
  });
  root.addEventListener('keydown', (event) => {
    if (!ARROWS.includes(event.key)) return;
    event.stopPropagation();
    const step = stepOfKey(event.key);
    if (step === undefined || event.defaultPrevented) return;
    event.preventDefault();
    go(step);
  });
  onInspectorState(({ index }) => show(index));
}

document.querySelectorAll<HTMLElement>('[data-inspector]').forEach(mount);
