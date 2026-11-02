import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_LAYER, LAYERS, SHEET_LAYERS, hashOfLayer, layerById, layerFromHash, layerOfKey, nextLayer, panelVisibility } from './layers.ts';
import type { LayerId } from './layers.ts';

const IDS = LAYERS.map(({ id }) => id);

describe('LAYERS', () => {
  it('lists the four layers in switcher order with French labels', () => {
    assert.deepEqual(LAYERS.map(({ id, label }) => ({ id, label })), [
      { id: 'salles', label: 'Salles' },
      { id: 'logiciels', label: 'Logiciels' },
      { id: 'donnees', label: 'Données' },
      { id: 'reseau', label: 'Réseau' },
    ]);
  });

  it('titles the plate after the layer shown, and hints at the keys of the floor or at the devices and cables', () => {
    assert.deepEqual(LAYERS.map(({ title }) => title), ['Plan de l\'hôpital', 'Logiciels', 'Données', 'Réseau']);
    assert.equal(layerById('salles').hint, 'Survolez une salle ou utilisez les flèches');
    assert.deepEqual(SHEET_LAYERS.map((id) => layerById(id).hint), Array(3).fill('Survolez un équipement ou un câble'));
  });

  it('opens on the rooms layer', () => {
    assert.equal(DEFAULT_LAYER, 'salles');
  });
});

describe('SHEET_LAYERS', () => {
  it('lists the three layers that light the equipment, not the floor', () => {
    assert.deepEqual(SHEET_LAYERS, ['logiciels', 'donnees', 'reseau']);
  });
});

describe('layerFromHash', () => {
  it('reads a layer from the hash', () => {
    assert.deepEqual(['#logiciels', '#donnees', '#reseau'].map(layerFromHash), ['logiciels', 'donnees', 'reseau']);
  });

  it('falls back to the rooms layer when the hash is empty, bare or unknown', () => {
    assert.deepEqual(['', '#', '#inconnu', '#Logiciels'].map(layerFromHash), ['salles', 'salles', 'salles', 'salles']);
  });

  it('round-trips with hashOfLayer', () => {
    assert.deepEqual(IDS.map((id) => layerFromHash(hashOfLayer(id))), IDS);
  });
});

describe('hashOfLayer', () => {
  it('writes no hash for the rooms layer', () => {
    assert.equal(hashOfLayer('salles'), '');
  });

  it('writes the layer id after a hash sign otherwise', () => {
    assert.equal(hashOfLayer('reseau'), '#reseau');
  });
});

describe('nextLayer', () => {
  it('moves forward and backward', () => {
    assert.deepEqual([nextLayer('salles', 1), nextLayer('donnees', -1)], ['logiciels', 'logiciels']);
  });

  it('wraps past the last and the first layer', () => {
    assert.deepEqual([nextLayer('reseau', 1), nextLayer('salles', -1)], ['salles', 'reseau']);
  });

  it('stays on the layer for a zero step', () => {
    assert.equal(nextLayer('donnees', 0), 'donnees');
  });
});

describe('layerOfKey', () => {
  it('maps the keys 1 to 4 to the layers in order', () => {
    assert.deepEqual(['1', '2', '3', '4'].map(layerOfKey), IDS);
  });

  it('ignores every other key', () => {
    const ignored: (LayerId | undefined)[] = ['0', '5', '9', 'a', '12', 'ArrowRight', ''].map(layerOfKey);
    assert.deepEqual(ignored, Array(7).fill(undefined));
  });
});

describe('panelVisibility', () => {
  it('shows the active layer block in the active room only', () => {
    assert.deepEqual(panelVisibility(2, 'donnees', 4), [null, null, 'donnees', null]);
  });

  it('shows no room while the room index is outside the rooms', () => {
    assert.deepEqual(panelVisibility(-1, 'salles', 3), [null, null, null]);
  });
});
