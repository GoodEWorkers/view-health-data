import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { flowFocusRules } from './flowFocusCss.ts';

const rulesFor = (rooms: readonly string[]): string[] => flowFocusRules(rooms).split('\n');
const indexOfValue = (rules: readonly string[], value: string): number => rules.findIndex((rule) => rule.endsWith(`{--flow-focus:${value}}`));

describe('flowFocusRules', () => {
  it('emits five rules per room, and nothing for none', () => {
    assert.equal(rulesFor(['gam', 'dpi']).length, 10);
    assert.equal(flowFocusRules([]), '');
  });

  it('hides what the selected room does not touch, by its id', () => {
    const hide = rulesFor(['gam']).find((rule) => rule.includes("[data-selected-room='gam']") && rule.endsWith('{--flow-focus:0}'));
    assert.ok(hide?.includes('[data-cable]') && hide.includes(":not([data-from='gam']):not([data-to='gam'])"));
  });

  it('orders dim, hide, preview, keep so the later rule wins at equal specificity', () => {
    const rules = rulesFor(['gam']);
    const order = ['var(--flow-dim)', '0', 'var(--flow-peek)', '1'].map((value) => indexOfValue(rules, value));
    assert.deepEqual(order, [...order].sort((first, second) => first - second));
    assert.ok(order[0]! >= 0);
  });

  it('keeps every focus rule at zero specificity', () => {
    const focusRules = rulesFor(['gam', 'dpi']).filter((rule) => rule.includes('--flow-focus'));
    assert.equal(focusRules.length, 8);
    assert.ok(focusRules.every((rule) => rule.startsWith(':where(')));
  });

  it('turns pointer events off on the hit strokes of hidden flows only', () => {
    const blockers = rulesFor(['gam']).filter((rule) => rule.includes('pointer-events:none'));
    assert.equal(blockers.length, 1);
    assert.ok(blockers[0]!.includes("[data-selected-room='gam']") && blockers[0]!.includes('.cable-hit'));
  });
});
