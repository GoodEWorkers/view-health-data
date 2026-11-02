import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isNetworkTrace, isNetworkViewRequest, isNetworkViewState } from './networkChannel.ts';

describe('isNetworkViewRequest', () => {
  it('accepts a close, a flow with its key and the three other views', () => {
    assert.ok(isNetworkViewRequest({ action: 'close' }));
    assert.ok(isNetworkViewRequest({ action: 'open', view: 'flow', key: 'gam:Planning' }));
    for (const view of ['rules', 'partners', 'glossary']) assert.ok(isNetworkViewRequest({ action: 'open', view }));
  });

  it('refuses a flow without a key, an unknown view and anything that is not a request', () => {
    assert.ok(!isNetworkViewRequest({ action: 'open', view: 'flow' }));
    assert.ok(!isNetworkViewRequest({ action: 'open', view: 'dossier' }));
    assert.ok(!isNetworkViewRequest({ action: 'open' }));
    assert.ok(!isNetworkViewRequest(null) && !isNetworkViewRequest('close'));
  });
});

describe('isNetworkTrace and isNetworkViewState', () => {
  it('take a key or null, and a view or null', () => {
    assert.ok(isNetworkTrace({ key: null }) && isNetworkTrace({ key: 'dpi:Prescriptions' }));
    assert.ok(!isNetworkTrace({ key: 3 }) && !isNetworkTrace({}));
    assert.ok(isNetworkViewState({ view: null }) && isNetworkViewState({ view: 'glossary' }));
    assert.ok(!isNetworkViewState({ view: 'autre' }));
  });
});
