// Touch has no hover, so a first tap on a figure target only previews it and a second tap on the same target activates it. Mouse, pen and keyboard clicks always activate; so do taps on a key, a window or a wire, which carry their own meaning.

const UNGATED = '[data-window], [data-wire], [data-inspector], [data-network-views], .iso-key';
const POINTER_TOUCH = 'touch';

export const ROOM_ARM_PREFIX = 'room:';

export type TapStep = { readonly armed: string | null; readonly activates: boolean };

export const tapStep = (armed: string | null, touch: boolean, key: string | null): TapStep =>
  !touch || key === null || key === armed ? { armed: null, activates: true } : { armed: key, activates: false };

export function armKeyOf(target: EventTarget | null): string | null {
  const element = target instanceof Element ? target : null;
  if (!element || element.closest(UNGATED)) return null;
  const cable = element.closest<HTMLElement>('[data-cable]');
  if (cable) return `cable:${cable.dataset.trace ?? cable.dataset.flow ?? ''}`;
  const gear = element.closest<HTMLElement>('[data-equipment]');
  if (gear) return `gear:${gear.dataset.equipment ?? ''}`;
  const room = element.closest('[data-room]')?.getAttribute('data-room')?.split(' ')[0];
  return room ? `${ROOM_ARM_PREFIX}${room}` : null;
}

const decisions = new WeakMap<Event, boolean>();
let armed: string | null = null;
let touching = false;

export const trackPointer = (event: PointerEvent): void => {
  touching = event.pointerType === POINTER_TOUCH;
};

export const isTouching = (): boolean => touching;

export const isArmed = (): boolean => armed !== null;

export const disarm = (): void => {
  armed = null;
};

// One decision per click, shared by every listener that reacts to it.
export function activates(event: Event): boolean {
  const known = decisions.get(event);
  if (known !== undefined) return known;
  const programmatic = event instanceof MouseEvent && event.detail === 0;
  const step = tapStep(armed, touching && !programmatic, armKeyOf(event.target));
  armed = step.armed;
  decisions.set(event, step.activates);
  return step.activates;
}
