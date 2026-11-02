import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../../content/departments.ts';
import { VIEW_BOX } from '../camera.ts';
import { LABEL_HEIGHT } from './jackWires.ts';
import { labelWidthOf, wireLabelsSvg, wiresSvg } from './wireMarkup.ts';
import { wiresIn } from './wires.ts';

const wires = wiresIn(VIEW_BOX);
const TOTAL_FLOWS = DEPARTMENTS.reduce((total, { flows }) => total + flows.length, 0);
const count = (markup: string, pattern: RegExp): number => markup.match(pattern)?.length ?? 0;

describe('wiresSvg', () => {
  const markup = wiresSvg(wires);

  it('draws per wire a hit stroke, a glow, a core and two plugs', () => {
    assert.equal(count(markup, /<g data-wire=""/g), TOTAL_FLOWS);
    for (const part of ['wire-hit', 'wire-glow', 'wire-core']) assert.equal(count(markup, new RegExp(`<path class="${part}"`, 'g')), TOTAL_FLOWS, part);
    assert.equal(count(markup, /<g data-plug=""/g), TOTAL_FLOWS * 2);
    assert.equal(count(markup, /class="wire-(glow|core)" pathLength="1"/g), TOTAL_FLOWS * 2);
  });

  it('numbers the wires like the cables and names the source room, its colour and the sockets', () => {
    assert.match(markup, /<g data-wire="" data-room="gam" data-from="gam" data-to="dpi" data-flow="0" data-source-slot="\d+" data-source-count="5" data-target-slot="\d+" data-target-count="\d+" data-route="[^"]+" data-source-range="identity" data-target-range="patient" style="--room: #0284c7">/);
    assert.equal(count(markup, /data-target-range=/g), 23, 'only the flow whose destination declares nothing for its payload carries no target range');
    assert.equal(count(markup, /data-flow="23"/g), 1);
  });
});

describe('wireLabelsSvg', () => {
  const markup = wireLabelsSvg(wires);

  it('holds one label per wire with a text for each layer: message type, payload with format, transport with port', () => {
    assert.equal(count(markup, /<g data-wire-label=""/g), TOTAL_FLOWS);
    for (const layer of ['logiciels', 'donnees', 'reseau']) assert.equal(count(markup, new RegExp(`<text data-layer="${layer}"`, 'g')), TOTAL_FLOWS, layer);
    assert.match(markup, /<text data-layer="logiciels"[^>]*>ADT\^A01 · MLLP<\/text>/);
    assert.match(markup, /<text data-layer="donnees"[^>]*>Identité patient · HL7 v2<\/text>/);
    assert.match(markup, /<text data-layer="reseau"[^>]*>MLLP · port 2575<\/text>/);
  });

  it('sizes each pill to its text, the group keeping the widest', () => {
    assert.match(markup, new RegExp(`<rect data-layer="logiciels" x="${(-labelWidthOf('ADT^A01 · MLLP') / 2).toFixed(1)}" y="${-LABEL_HEIGHT / 2}" width="${labelWidthOf('ADT^A01 · MLLP').toFixed(1)}"`));
    assert.ok(labelWidthOf('ADT^A01 · MLLP') > labelWidthOf('ADT'));
    assert.match(markup, new RegExp(`data-width="${labelWidthOf('Identité patient · HL7 v2').toFixed(1)}"`));
  });
});
