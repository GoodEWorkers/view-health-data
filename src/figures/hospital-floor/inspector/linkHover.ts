// Links the two panes of one open file: hovering or focusing a field or block in either pane lights its counterpart (same data-ref), clicking pins it, and the main range is pinned on open. The state is pure; the DOM half only draws it.

export type LinkState = { readonly hover: string | null; readonly pinned: readonly string[]; readonly initial: readonly string[] };

export const linkStart = (initial: readonly string[]): LinkState => ({ hover: null, pinned: initial, initial });

export const hoverRef = (state: LinkState, ref: string | null): LinkState => ({ ...state, hover: ref });

export const pinRef = (state: LinkState, ref: string): LinkState =>
  state.pinned.length === 1 && state.pinned[0] === ref ? { ...state, pinned: state.initial } : { ...state, pinned: [ref] };

export const detailRef = ({ hover, pinned }: LinkState): string | null => hover ?? pinned[0] ?? null;

const ROW_STEPS: Readonly<Record<string, number>> = { ArrowDown: 1, ArrowUp: -1 };
const HOT = 'data-hot';
const ON = 'data-on';
const REF = 'data-ref';
const READABLE = '[data-pane="readable"]';
const RAW = '[data-pane="raw"]';

const withRef = (file: HTMLElement, ref: string): NodeListOf<HTMLElement> => file.querySelectorAll<HTMLElement>(`[${REF}="${ref}"]`);

function mark(file: HTMLElement, attribute: string, refs: readonly string[]): void {
  file.querySelectorAll(`[${attribute}]`).forEach((element) => element.removeAttribute(attribute));
  refs.forEach((ref) => withRef(file, ref).forEach((element) => element.setAttribute(attribute, '')));
}

function showDetail(file: HTMLElement, ref: string | null): void {
  const source = ref ? file.querySelector<HTMLElement>(`${READABLE} [${REF}="${ref}"]`) : null;
  const fill = (name: string, text: string): void => {
    const target = file.querySelector<HTMLElement>(`[data-detail="${name}"]`);
    if (!target) return;
    target.textContent = text;
    if (name === 'raw') target.title = text;
  };
  const { label = '', code = '', explain = '', raw = '' } = source?.dataset ?? {};
  fill('label', label);
  fill('code', code);
  fill('explain', explain);
  fill('raw', raw);
  file.toggleAttribute('data-detail-empty', !source);
  file.toggleAttribute('data-detail-block', !raw);
}

const REVEAL_MARGIN = 8;

export function revealIn(pane: HTMLElement, element: HTMLElement): void {
  if (pane.clientHeight === 0) return;
  const inset = (pane.querySelector<HTMLElement>('.in-pane-title')?.offsetHeight ?? 0) + REVEAL_MARGIN;
  const [top, bottom] = [element.offsetTop, element.offsetTop + element.offsetHeight];
  const isVisible = top >= pane.scrollTop + inset && bottom <= pane.scrollTop + pane.clientHeight - REVEAL_MARGIN;
  if (!isVisible) pane.scrollTop = top - inset;
}

export type FileLink = { readonly reset: () => void };

export function mountLinkHover(file: HTMLElement): FileLink {
  const initial = (file.dataset.initial ?? '').split(' ').filter(Boolean);
  let state = linkStart(initial);

  const draw = (): void => {
    mark(file, HOT, state.hover ? [state.hover] : []);
    mark(file, ON, state.pinned);
    file.querySelectorAll<HTMLElement>('[role="button"][data-ref]').forEach((row) => row.setAttribute('aria-pressed', String(state.pinned.includes(row.dataset.ref ?? ''))));
    showDetail(file, detailRef(state));
  };
  const refOf = (target: EventTarget | null): string | null => (target instanceof Element ? (target.closest<HTMLElement>(`[${REF}]`)?.getAttribute(REF) ?? null) : null);
  const paneOf = (target: EventTarget | null): string | undefined => (target instanceof Element ? target.closest<HTMLElement>('[data-pane]')?.dataset.pane : undefined);

  function pin(ref: string, from: string | undefined): void {
    state = pinRef(state, ref);
    draw();
    const other = file.querySelector<HTMLElement>(from === 'raw' ? READABLE : RAW);
    const element = other?.querySelector<HTMLElement>(`[${REF}="${ref}"]`);
    if (other && element) revealIn(other, element);
  }

  file.addEventListener('pointerover', (event) => {
    state = hoverRef(state, refOf(event.target));
    draw();
  });
  file.addEventListener('pointerleave', () => {
    state = hoverRef(state, null);
    draw();
  });
  file.addEventListener('focusin', (event) => {
    state = hoverRef(state, refOf(event.target));
    draw();
  });
  file.addEventListener('focusout', () => {
    state = hoverRef(state, null);
    draw();
  });
  file.addEventListener('click', (event) => {
    const ref = refOf(event.target);
    if (ref) pin(ref, paneOf(event.target));
  });
  file.addEventListener('keydown', (event) => {
    const row = event.target instanceof HTMLElement && event.target.getAttribute('role') === 'button' ? event.target : null;
    if (!row) return;
    const step = ROW_STEPS[event.key];
    if (step !== undefined) {
      const rows = [...file.querySelectorAll<HTMLElement>(`${READABLE} [role="button"]`)];
      const neighbour = rows[rows.indexOf(row) + step];
      if (neighbour) event.preventDefault();
      neighbour?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pin(row.getAttribute(REF)!, 'readable');
    }
  });

  draw();
  return {
    reset: () => {
      state = linkStart(initial);
      draw();
    },
  };
}
