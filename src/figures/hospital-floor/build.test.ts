import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import { hospitalFloorCard } from './build.ts';

const card = hospitalFloorCard();
const TOTAL_FLOWS = DEPARTMENTS.reduce((total, { flows }) => total + flows.length, 0);

const indexOfMarker = (marker: string): number => {
  const index = card.indexOf(marker);
  assert.ok(index >= 0, `${marker} is missing`);
  return index;
};

describe('hospitalFloorCard', () => {
  it('paints the cables after the trunking and before the walls, and the labels last', () => {
    const order = ['data-cables', 'data-packets', 'data-cable-labels', 'data-device-labels'].map(indexOfMarker);
    assert.ok(order.every((index, position) => position === 0 || index > order[position - 1]!));
    assert.ok(indexOfMarker('data-cables') > card.indexOf('data-routes') || !card.includes('data-routes'));
    const afterCables = card.slice(indexOfMarker('data-packets'));
    assert.ok(afterCables.indexOf('data-device') < afterCables.indexOf('data-cable-labels'), 'furniture is painted after the cables');
  });

  it('draws one cable and one pill per flow, each saying where it comes from and goes to', () => {
    assert.equal(card.match(/<g data-cable=""/g)?.length, TOTAL_FLOWS);
    assert.equal(card.match(/<g data-pill=""/g)?.length, TOTAL_FLOWS);
    assert.equal(card.match(/<path class="cable-core"/g)?.length, TOTAL_FLOWS);
    assert.equal(card.match(/<path class="cable-glow"/g)?.length, TOTAL_FLOWS);
    assert.match(card, /<g data-cable="" data-from="gam" data-to="dpi" style="--room: #0284c7">/);
  });

  it('gives every pill and device label one text per sheet layer', () => {
    for (const layer of ['logiciels', 'donnees', 'reseau']) {
      assert.equal(card.match(new RegExp(`<text data-layer="${layer}"`, 'g'))?.length, TOTAL_FLOWS + DEPARTMENTS.length, layer);
    }
  });

  it('keeps the room keys alone in the legend and opens on the rooms layer', () => {
    const legend = card.split('<figcaption')[1]!;
    assert.equal((legend.match(/data-keys="rooms"/g) ?? []).length, 1);
    assert.ok(!card.includes('data-keys="lines"'));
    assert.match(card, /data-corner="title">Plan de l'hôpital</);
    assert.match(card, /Survolez une salle ou utilisez les flèches/);
  });
});
