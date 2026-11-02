import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import { SHEET_LAYERS } from '../../content/layers.ts';
import type { SheetLayerId } from '../../content/layers.ts';
import { CABLES } from './cables.ts';
import { labelsSvg, placeBoxes } from './cableLabels.ts';
import type { Candidate } from './cableLabels.ts';

const SIZE = { width: 20, height: 10 };
const option = (x: number, y: number, cost = 0) => ({ centre: [x, y] as [number, number], cost });
const candidate = (...options: ReturnType<typeof option>[]): Candidate => ({ options, ...SIZE });

describe('placeBoxes', () => {
  it('keeps the first option of a box that has nothing in its way', () => {
    assert.deepEqual(placeBoxes([candidate(option(0, 0), option(50, 0))]), [[0, 0]]);
  });

  it('slides a second box to the next option when the first would overlap', () => {
    const centres = placeBoxes([candidate(option(0, 0)), candidate(option(5, 0), option(40, 0))]);
    assert.deepEqual(centres, [[0, 0], [40, 0]]);
  });

  it('lets boxes touch their gap apart but no closer', () => {
    assert.deepEqual(placeBoxes([candidate(option(0, 0)), candidate(option(21.5, 0), option(60, 0))]), [[0, 0], [21.5, 0]]);
    assert.deepEqual(placeBoxes([candidate(option(0, 0)), candidate(option(20.5, 0), option(60, 0))]), [[0, 0], [60, 0]]);
  });

  it('takes the least overlapping option when every option is taken', () => {
    const centres = placeBoxes([candidate(option(0, 0)), candidate(option(2, 0), option(9, 0))]);
    assert.deepEqual(centres[1], [9, 0]);
  });

  it('steers a box off an option that costs more than the overlap it avoids', () => {
    assert.deepEqual(placeBoxes([candidate(option(0, 0, 500), option(100, 0, 0))]), [[100, 0]]);
  });

  it('keeps every box away from the obstacles', () => {
    const obstacles = [{ centre: [0, 0] as [number, number], ...SIZE }];
    assert.deepEqual(placeBoxes([candidate(option(0, 0), option(30, 0))], obstacles), [[30, 0]]);
  });
});

describe('labelsSvg', () => {
  const svg = labelsSvg();
  const pills = svg.slice(0, svg.indexOf('data-device-labels'));
  const labels = svg.slice(svg.indexOf('data-device-labels'));

  it('holds one pill per cable with a paper rectangle and a text for each sheet layer, the external cables on the Réseau layer only', () => {
    assert.equal(pills.match(/<g data-pill=""/g)?.length, CABLES.length);
    for (const layer of SHEET_LAYERS) {
      const count = layer === 'reseau' ? CABLES.length : CABLES.filter(({ external }) => !external).length;
      assert.equal(pills.match(new RegExp(`<rect data-layer="${layer}"`, 'g'))?.length, count);
      assert.equal(pills.match(new RegExp(`<text data-layer="${layer}"`, 'g'))?.length, count);
    }
    assert.ok(pills.includes('rx="1.5"'));
  });

  it('starts the network text of every cable with the name of its protocol family', () => {
    for (const { family } of CABLES) assert.ok(pills.includes(`>${family.label} · ${family.ports}`), family.label);
  });

  it('writes the family, the port, the way out and the partner on an external cable', () => {
    assert.match(pills, /<tspan[^>]*>HTTPS · 443 · proxy → Téléservice INSi</);
    assert.match(pills, /<tspan[^>]*>HTTPS · 443 · DMZ → DMP</);
    assert.match(pills, /<tspan[^>]*>SMTP sécurisé · 587 · DMZ → MSSanté</);
    assert.match(pills, /<tspan[^>]*>DICOM · 104 ou 11112 · VPN → Téléradiologie</);
  });

  it('writes the wire label, the payload with its format and the transport with its port', () => {
    const first = pills.slice(pills.indexOf('<g data-pill=""'), pills.indexOf('</g>', pills.indexOf('<g data-pill=""')));
    assert.match(first, /<text data-layer="logiciels"[^>]*><tspan[^>]*>ADT\^A01 · MLLP</);
    assert.match(first, /<text data-layer="donnees"[^>]*><tspan[^>]*>Identité patient · HL7 v2</);
    assert.match(first, /<text data-layer="reseau"[^>]*><tspan[^>]*>HL7 v2 sur MLLP · 2575</);
  });

  it('never lets two pills of the same layer overlap', () => {
    for (const layer of SHEET_LAYERS) {
      const boxes = [...pills.matchAll(new RegExp(`<rect data-layer="${layer}" x="([\\d.-]+)" y="([\\d.-]+)" width="([\\d.]+)" height="([\\d.]+)"`, 'g'))].map(
        ([, x, y, width, height]) => ({ x: Number(x), y: Number(y), width: Number(width), height: Number(height) }),
      );
      boxes.forEach((first, index) => {
        boxes.slice(index + 1).forEach((second) => {
          const apart = first.x + first.width <= second.x || second.x + second.width <= first.x || first.y + first.height <= second.y || second.y + second.height <= first.y;
          assert.ok(apart, `two ${layer} pills overlap at ${first.x},${first.y}`);
        });
      });
    }
  });

  it('holds one label per room, saying the first product, the first two entities and the first zone', () => {
    assert.equal(labels.match(/<g data-device-label=""/g)?.length, DEPARTMENTS.length);
    const room = (id: string) => labels.slice(labels.indexOf(`data-room-label="${id}"`)).split('</g>')[0]!;
    const lines = (id: string, layer: SheetLayerId) => {
      const text = room(id).match(new RegExp(`<text data-layer="${layer}"[^>]*>(.*?)</text>`))![1]!;
      return [...text.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g)].map(([, line]) => line);
    };
    assert.deepEqual(lines('gam', 'logiciels'), ['M-GAM']);
    assert.deepEqual(lines('gam', 'donnees'), ['Identité patient', 'Venue / séjour']);
    assert.deepEqual(lines('gam', 'reseau'), ['Postes utilisateurs']);
  });
});
