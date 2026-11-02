import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import { SCREENS_MARKER, hospitalFloorCard } from './build.ts';

const card = hospitalFloorCard();
const TOTAL_FLOWS = DEPARTMENTS.reduce((total, { flows, network }) => total + flows.length + network.externalFlows.length, 0);
const INTERNAL_FLOWS = DEPARTMENTS.reduce((total, { flows }) => total + flows.length, 0);

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
    assert.match(card, /<g data-cable="" data-from="gam" data-to="dpi" data-flow="0" data-family="mllp" data-dash="" data-trace="gam:Identité patient"/);
  });

  it('gives every pill and device label one text per sheet layer, but the pill of an external cable only the network one', () => {
    for (const layer of ['logiciels', 'donnees']) {
      assert.equal(card.match(new RegExp(`<text data-layer="${layer}"`, 'g'))?.length, INTERNAL_FLOWS + DEPARTMENTS.length, layer);
    }
    assert.equal(card.match(/<text data-layer="reseau"/g)?.length, TOTAL_FLOWS + DEPARTMENTS.length);
  });

  it('leaves one slot for the floating screens, at the end of the stage and before the legend', () => {
    assert.equal(card.split(SCREENS_MARKER).length, 2);
    assert.ok(card.indexOf(SCREENS_MARKER) > card.indexOf('</svg>'));
    assert.ok(card.indexOf(SCREENS_MARKER) < card.indexOf('<figcaption'));
  });

  it('wraps the stage in a scroller that phones pan sideways, with a hint above it that live code removes at the first gesture', () => {
    const hint = indexOfMarker('data-stage-hint');
    const scroller = indexOfMarker('data-stage-scroll');
    assert.ok(hint < scroller);
    assert.ok(scroller < indexOfMarker('class="iso-stage"'));
    assert.ok(indexOfMarker('class="iso-stage"') < card.indexOf('</svg>'));
    assert.match(card, /data-stage-hint>Faites défiler ou pincez pour zoomer<\/p>/);
  });

  it('paints one selection outline per room after the walls and before the standing furniture, hidden until live.ts marks the room selected', () => {
    assert.equal(card.match(/class="iso-line room-selection"/g)?.length, DEPARTMENTS.length);
    const firstOutline = card.indexOf('room-selection-halo');
    assert.ok(firstOutline > card.indexOf('data-cables'));
    assert.ok(card.indexOf('data-device', firstOutline) > 0, 'standing devices come after the outlines');
    assert.ok(card.lastIndexOf('room-selection-halo') < card.indexOf('data-cable-labels'));
  });

  it('keeps the room keys in the legend, with the zone and family keys of the network layer beside them, and opens on the rooms layer', () => {
    const legend = card.split('<figcaption')[1]!;
    assert.equal((legend.match(/data-keys="rooms"/g) ?? []).length, 1);
    assert.equal((legend.match(/data-keys="zones"/g) ?? []).length, 1);
    assert.equal((legend.match(/data-keys="families"/g) ?? []).length, 1);
    assert.ok(!card.includes('data-keys="lines"'));
    assert.match(card, /data-corner="title">Plan de l'hôpital</);
    assert.match(card, /Cliquez une salle ou utilisez les flèches/);
  });
});
