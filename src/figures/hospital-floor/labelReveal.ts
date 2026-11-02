// Wire labels carry no text until asked: a cable or jack wire shows its label while hovered, and a room pinned on purpose (keyboard or click) shows the labels of all its wires, so keyboard visitors can read them.

import { DEPARTMENTS } from '../../content/departments.ts';
import { onActiveRoom } from './activeRoom.ts';

const LABELS = '[data-pill], [data-wire-label]';
const WIRES = '[data-cable], [data-wire]';
const HOVERED = 'data-hover';
const SHOWN = 'data-shown';

function mark(attribute: string, isMarked: (label: HTMLElement) => boolean): void {
  document.querySelectorAll<HTMLElement>(LABELS).forEach((label) => label.toggleAttribute(attribute, isMarked(label)));
}

const flowOf = (target: EventTarget | null): string | undefined => (target instanceof Element ? target.closest<HTMLElement>(WIRES)?.dataset.flow : undefined);

document.querySelectorAll<HTMLElement>('.hospital-floor').forEach((figure) => {
  figure.addEventListener('pointerover', (event) => {
    const flow = flowOf(event.target);
    mark(HOVERED, (label) => flow !== undefined && label.dataset.flow === flow);
  });
  figure.addEventListener('pointerleave', () => mark(HOVERED, () => false));
});

onActiveRoom(({ index, deliberate }) => {
  const room = DEPARTMENTS[index]?.id;
  mark(SHOWN, (label) => deliberate && label.dataset.from === room);
});
