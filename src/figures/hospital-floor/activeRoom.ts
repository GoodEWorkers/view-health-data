// The channel between the active-room state in live.ts and the other figures of the stage column: live.ts announces the active room and whether a visitor engaged it; a figure asks live.ts to pin a room, release it, or repeat the last announcement.

export const ACTIVE_ROOM_EVENT = 'hospital-floor:active-room';
export const ROOM_REQUEST_EVENT = 'hospital-floor:room-request';

export type ActiveRoom = { readonly index: number; readonly engaged: boolean };

export type RoomRequest =
  | { readonly action: 'pin'; readonly index: number }
  | { readonly action: 'release' }
  | { readonly action: 'sync' };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const isActiveRoom = (value: unknown): value is ActiveRoom =>
  isRecord(value) && Number.isInteger(value.index) && typeof value.engaged === 'boolean';

export const isRoomRequest = (value: unknown): value is RoomRequest =>
  isRecord(value) &&
  (value.action === 'release' || value.action === 'sync' || (value.action === 'pin' && Number.isInteger(value.index)));

export const announceActiveRoom = (detail: ActiveRoom): void => {
  document.dispatchEvent(new CustomEvent<ActiveRoom>(ACTIVE_ROOM_EVENT, { detail }));
};

export const requestRoom = (detail: RoomRequest): void => {
  document.dispatchEvent(new CustomEvent<RoomRequest>(ROOM_REQUEST_EVENT, { detail }));
};

export function onActiveRoom(handler: (room: ActiveRoom) => void): void {
  document.addEventListener(ACTIVE_ROOM_EVENT, (event) => {
    if (event instanceof CustomEvent && isActiveRoom(event.detail)) handler(event.detail);
  });
}

export function onRoomRequest(handler: (request: RoomRequest) => void): void {
  document.addEventListener(ROOM_REQUEST_EVENT, (event) => {
    if (event instanceof CustomEvent && isRoomRequest(event.detail)) handler(event.detail);
  });
}
