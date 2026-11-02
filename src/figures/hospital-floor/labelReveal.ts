// Wire labels carry no text until asked: a cable or jack wire shows its label while hovered, and the selected room shows the labels of all its wires, so keyboard visitors can read them.

import { DEPARTMENTS } from '../../content/departments.ts';
import { onSelection } from './activeRoom.ts';

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

onSelection(({ selected }) => {
  const room = selected === null ? undefined : DEPARTMENTS[selected]?.id;
  mark(SHOWN, (label) => room !== undefined && label.dataset.from === room);
});
