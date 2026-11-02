// The channel between the floor (cables, gear, panel buttons) and the fullscreen views of the Réseau layer: the floor asks for a view to open or close, and tells which flow was hovered last, so the rule table can light its rule.

export const NETWORK_VIEW_REQUEST_EVENT = 'hospital-floor:network-view-request';
export const NETWORK_TRACE_EVENT = 'hospital-floor:network-trace';
export const NETWORK_VIEW_STATE_EVENT = 'hospital-floor:network-view-state';

export type NetworkView = 'flow' | 'rules' | 'partners' | 'glossary';

export type NetworkViewRequest =
  | { readonly action: 'open'; readonly view: 'flow'; readonly key: string; readonly opener?: Element }
  | { readonly action: 'open'; readonly view: Exclude<NetworkView, 'flow'>; readonly opener?: Element }
  | { readonly action: 'close' };

export type NetworkViewState = { readonly view: NetworkView | null };
export type NetworkTrace = { readonly key: string | null };

const VIEWS: readonly string[] = ['flow', 'rules', 'partners', 'glossary'];

export const isNetworkView = (value: unknown): value is NetworkView => typeof value === 'string' && VIEWS.includes(value);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const isNetworkViewRequest = (value: unknown): value is NetworkViewRequest => {
  if (!isRecord(value)) return false;
  if (value.action === 'close') return true;
  if (value.action !== 'open' || typeof value.view !== 'string' || !VIEWS.includes(value.view)) return false;
  return value.view !== 'flow' || typeof value.key === 'string';
};

export const isNetworkTrace = (value: unknown): value is NetworkTrace => isRecord(value) && (value.key === null || typeof value.key === 'string');

export const isNetworkViewState = (value: unknown): value is NetworkViewState => isRecord(value) && (value.view === null || (typeof value.view === 'string' && VIEWS.includes(value.view)));

export const requestNetworkView = (detail: NetworkViewRequest): void => {
  document.dispatchEvent(new CustomEvent<NetworkViewRequest>(NETWORK_VIEW_REQUEST_EVENT, { detail }));
};

export const announceNetworkTrace = (detail: NetworkTrace): void => {
  document.dispatchEvent(new CustomEvent<NetworkTrace>(NETWORK_TRACE_EVENT, { detail }));
};

export const announceNetworkView = (detail: NetworkViewState): void => {
  document.dispatchEvent(new CustomEvent<NetworkViewState>(NETWORK_VIEW_STATE_EVENT, { detail }));
};

export function onNetworkViewRequest(handler: (request: NetworkViewRequest) => void): void {
  document.addEventListener(NETWORK_VIEW_REQUEST_EVENT, (event) => {
    if (event instanceof CustomEvent && isNetworkViewRequest(event.detail)) handler(event.detail);
  });
}

export function onNetworkTrace(handler: (trace: NetworkTrace) => void): void {
  document.addEventListener(NETWORK_TRACE_EVENT, (event) => {
    if (event instanceof CustomEvent && isNetworkTrace(event.detail)) handler(event.detail);
  });
}

export function onNetworkViewState(handler: (state: NetworkViewState) => void): void {
  document.addEventListener(NETWORK_VIEW_STATE_EVENT, (event) => {
    if (event instanceof CustomEvent && isNetworkViewState(event.detail)) handler(event.detail);
  });
}
