// The channel between live.ts and the other figures: live.ts announces which room is selected (null when none); a figure or the side panel asks it to select, deselect or repeat the announcement. Hover and the tour never reach this channel.

export const SELECTION_EVENT = 'hospital-floor:selection';
export const ROOM_REQUEST_EVENT = 'hospital-floor:room-request';

export type RoomSelection = { readonly selected: number | null };

export type RoomRequest =
  | { readonly action: 'select'; readonly index: number }
  | { readonly action: 'deselect' }
  | { readonly action: 'sync' };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const isRoomSelection = (value: unknown): value is RoomSelection =>
  isRecord(value) && (value.selected === null || Number.isInteger(value.selected));

export const isRoomRequest = (value: unknown): value is RoomRequest =>
  isRecord(value) &&
  (value.action === 'deselect' || value.action === 'sync' || (value.action === 'select' && Number.isInteger(value.index)));

export const announceSelection = (detail: RoomSelection): void => {
  document.dispatchEvent(new CustomEvent<RoomSelection>(SELECTION_EVENT, { detail }));
};

export const requestRoom = (detail: RoomRequest): void => {
  document.dispatchEvent(new CustomEvent<RoomRequest>(ROOM_REQUEST_EVENT, { detail }));
};

export function onSelection(handler: (selection: RoomSelection) => void): void {
  document.addEventListener(SELECTION_EVENT, (event) => {
    if (event instanceof CustomEvent && isRoomSelection(event.detail)) handler(event.detail);
  });
}

export function onRoomRequest(handler: (request: RoomRequest) => void): void {
  document.addEventListener(ROOM_REQUEST_EVENT, (event) => {
    if (event instanceof CustomEvent && isRoomRequest(event.detail)) handler(event.detail);
  });
}
