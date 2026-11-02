// The interaction model as pure transitions. Hover and keyboard focus only highlight a room; a click, Enter or an arrow selects it, and only that or Escape changes the panel. The idle tour runs only while nothing is selected and nobody hovers or focuses.

import { advanceTour, wrapIndex } from './tour.ts';
import type { TourState } from './tour.ts';

export type Interaction = {
  readonly hovered: number | null;
  readonly focusedKey: number | null;
  readonly pointerInside: boolean;
  readonly focusInside: boolean;
  readonly selected: number | null;
  readonly tourEnabled: boolean;
  readonly tour: TourState;
};

export type InteractionView = {
  readonly highlighted: number | null;
  readonly selected: number | null;
  readonly tourRunning: boolean;
};

export const FIRST_ROOM = 0;

export const startInteraction = (): Interaction => ({
  hovered: null,
  focusedKey: null,
  pointerInside: false,
  focusInside: false,
  selected: null,
  tourEnabled: false,
  tour: { index: FIRST_ROOM, elapsed: 0 },
});

const restartedTour = (state: Interaction): Interaction => ({ ...state, tour: { ...state.tour, elapsed: 0 } });

export const tourRunning = ({ tourEnabled, selected, pointerInside, focusInside }: Interaction): boolean =>
  tourEnabled && selected === null && !pointerInside && !focusInside;

// The room the reader points at, without the idle tour: it is what the flows follow.
export const focusedOf = (state: Interaction): number | null => state.hovered ?? state.focusedKey ?? state.selected;

export const highlightedOf = (state: Interaction): number | null => focusedOf(state) ?? (tourRunning(state) ? state.tour.index : null);

export const viewOf = (state: Interaction): InteractionView => ({
  highlighted: highlightedOf(state),
  selected: state.selected,
  tourRunning: tourRunning(state),
});

export const hover = (state: Interaction, room: number | null): Interaction => ({ ...state, pointerInside: true, hovered: room });

export const leave = (state: Interaction): Interaction => restartedTour({ ...state, pointerInside: false, hovered: null });

export const focusIn = (state: Interaction, key: number | null): Interaction => ({ ...state, focusInside: true, focusedKey: key });

export const focusOut = (state: Interaction): Interaction => restartedTour({ ...state, focusInside: false, focusedKey: null });

export const select = (state: Interaction, room: number): Interaction => ({ ...state, selected: room });

// Nothing selected yet: forward starts at the first room, backward at the last.
export const stepSelection = (state: Interaction, step: number, count: number): Interaction => {
  if (state.selected === null) return select(state, step > 0 ? FIRST_ROOM : count - 1);
  return select(state, wrapIndex(state.selected + step, count));
};

export const escape = (state: Interaction): Interaction => (state.selected === null ? state : restartedTour({ ...state, selected: null }));

export const setTourEnabled = (state: Interaction, tourEnabled: boolean): Interaction => (state.tourEnabled === tourEnabled ? state : { ...state, tourEnabled });

export const tourTick = (state: Interaction, seconds: number, dwell: number, count: number): Interaction =>
  tourRunning(state) ? { ...state, tour: advanceTour(state.tour, seconds, dwell, count) } : state;
