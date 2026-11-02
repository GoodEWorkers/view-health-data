// The one-time phone notice: a non-modal sheet, shown on a phone-width viewport until « Compris » or Escape stores that it was read. It waits while a phone sheet is open and goes when the viewport widens.

import { PHONE_MAX_WIDTH, PHONE_QUERY } from './phone.ts';

const STORAGE_KEY = 'vhd.mobileNoticeDismissed';
const DISMISSED_VALUE = '1';
const OPEN_SHEET = '[role="dialog"][aria-modal="true"]';

type NoticeState = { width: number; dismissed: boolean };

export const shouldShowNotice = ({ width, dismissed }: NoticeState): boolean => !dismissed && width <= PHONE_MAX_WIDTH;

export function readNoticeDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === DISMISSED_VALUE;
  } catch {
    return false;
  }
}

export function writeNoticeDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, DISMISSED_VALUE);
  } catch {
    // Private mode or blocked storage: the notice simply shows again next visit.
  }
}

export function mountMobileNotice(notice: HTMLElement): void {
  const button = notice.querySelector<HTMLButtonElement>('[data-dismiss-notice]');
  if (!button) return;
  let dismissed = readNoticeDismissed();
  let opener: Element | null = null;

  function sync(): void {
    const sheetIsOpen = document.querySelector(OPEN_SHEET) !== null;
    const wanted = shouldShowNotice({ width: window.innerWidth, dismissed }) && !sheetIsOpen;
    if (wanted === !notice.hidden) return;
    if (wanted) {
      opener = document.activeElement;
      notice.hidden = false;
      button!.focus({ preventScroll: true });
      return;
    }
    const hadFocus = notice.contains(document.activeElement);
    notice.hidden = true;
    if (hadFocus && opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
  }

  function dismiss(): void {
    dismissed = true;
    writeNoticeDismissed();
    sync();
  }

  button.addEventListener('click', dismiss);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented || notice.hidden) return;
    event.preventDefault();
    dismiss();
  });
  matchMedia(PHONE_QUERY).addEventListener('change', sync);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['aria-modal'], subtree: true });
  sync();
}
