// The channel between the inspector (keys, buttons, scrim) and screensLive, which owns the window states: the inspector asks to open a file or close, screensLive announces which file is open.

export const INSPECTOR_REQUEST_EVENT = 'hospital-floor:inspector-request';
export const INSPECTOR_STATE_EVENT = 'hospital-floor:inspector-state';

export type InspectorRequest = { readonly action: 'open'; readonly index: number } | { readonly action: 'close' };

export type InspectorState = { readonly index: number | null };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const isInspectorRequest = (value: unknown): value is InspectorRequest =>
  isRecord(value) && (value.action === 'close' || (value.action === 'open' && Number.isInteger(value.index)));

export const isInspectorState = (value: unknown): value is InspectorState =>
  isRecord(value) && (value.index === null || Number.isInteger(value.index));

export const requestInspector = (detail: InspectorRequest): void => {
  document.dispatchEvent(new CustomEvent<InspectorRequest>(INSPECTOR_REQUEST_EVENT, { detail }));
};

export const announceInspector = (detail: InspectorState): void => {
  document.dispatchEvent(new CustomEvent<InspectorState>(INSPECTOR_STATE_EVENT, { detail }));
};

export function onInspectorRequest(handler: (request: InspectorRequest) => void): void {
  document.addEventListener(INSPECTOR_REQUEST_EVENT, (event) => {
    if (event instanceof CustomEvent && isInspectorRequest(event.detail)) handler(event.detail);
  });
}

export function onInspectorState(handler: (state: InspectorState) => void): void {
  document.addEventListener(INSPECTOR_STATE_EVENT, (event) => {
    if (event instanceof CustomEvent && isInspectorState(event.detail)) handler(event.detail);
  });
}
