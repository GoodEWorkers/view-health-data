import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { readNoticeDismissed, shouldShowNotice, writeNoticeDismissed } from './mobileNotice.ts';

const STORAGE_KEY = 'vhd.mobileNoticeDismissed';

const stubStorage = (storage: Pick<Storage, 'getItem' | 'setItem'>): void => {
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
};

const blockedStorage = {
  getItem: (): never => {
    throw new DOMException('blocked', 'SecurityError');
  },
  setItem: (): never => {
    throw new DOMException('quota', 'QuotaExceededError');
  },
};

describe('shouldShowNotice', () => {
  it('shows on a phone-width viewport that has not dismissed it', () => {
    assert.equal(shouldShowNotice({ width: 390, dismissed: false }), true);
  });

  it('shows at exactly 720 px, the last phone width', () => {
    assert.equal(shouldShowNotice({ width: 720, dismissed: false }), true);
  });

  it('stays away from 721 px, the first desktop width', () => {
    assert.equal(shouldShowNotice({ width: 721, dismissed: false }), false);
  });

  it('stays away at desktop widths', () => {
    assert.equal(shouldShowNotice({ width: 1440, dismissed: false }), false);
  });

  it('never returns once dismissed, even on a phone', () => {
    assert.equal(shouldShowNotice({ width: 390, dismissed: true }), false);
  });
});

describe('the dismissal memory', () => {
  afterEach(() => Reflect.deleteProperty(globalThis, 'localStorage'));

  it('remembers a dismissal under its key', () => {
    const stored = new Map<string, string>();
    stubStorage({ getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => void stored.set(key, value) });
    writeNoticeDismissed();
    assert.equal(stored.get(STORAGE_KEY), '1');
    assert.equal(readNoticeDismissed(), true);
  });

  it('reads as not dismissed when nothing was stored', () => {
    stubStorage({ getItem: () => null, setItem: () => undefined });
    assert.equal(readNoticeDismissed(), false);
  });

  it('reads as not dismissed when storage is blocked, without throwing', () => {
    stubStorage(blockedStorage);
    assert.equal(readNoticeDismissed(), false);
  });

  it('does not throw when storage refuses the write', () => {
    stubStorage(blockedStorage);
    assert.doesNotThrow(writeNoticeDismissed);
  });
});
