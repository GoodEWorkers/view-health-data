import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MAX_COLUMNS, MAX_LINES, editorLines, wrapDisplay, wrapSegment } from './editorLines.ts';

describe('the window', () => {
  it('shows 16 lines of 56 characters', () => {
    assert.deepEqual([MAX_LINES, MAX_COLUMNS], [16, 56]);
  });
});

describe('wrapSegment', () => {
  it('leaves a short segment whole', () => {
    assert.deepEqual(wrapSegment('PID|1||ABC'), ['PID|1||ABC']);
  });

  it('breaks a long segment before a field separator, every chunk within the width', () => {
    const line = `OBX|1|NM|718-7^Hémoglobine^LN||11.2|g/dL|13.0-17.0|L|||F|${'x'.repeat(20)}|end`;
    const chunks = wrapSegment(line);
    assert.ok(chunks.length > 1);
    assert.equal(chunks.join(''), line);
    assert.ok(chunks.every((chunk) => chunk.length <= MAX_COLUMNS));
    assert.ok(chunks.slice(1).every((chunk) => chunk.startsWith('|')));
  });

  it('falls back to the repetition and component separators for a field longer than the width', () => {
    const line = `PID|1||${'A'.repeat(20)}~${'B'.repeat(20)}^${'C'.repeat(20)}&${'D'.repeat(20)}`;
    const chunks = wrapSegment(line);
    assert.equal(chunks.join(''), line);
    assert.ok(chunks.every((chunk, index) => chunk.length <= MAX_COLUMNS - (index === 0 ? 0 : 2)));
    assert.ok(chunks.slice(1).every((chunk) => '|~^&'.includes(chunk[0]!)));
  });

  it('packs a row up to a component separator rather than break at an early field separator', () => {
    const [first] = wrapSegment(`PID|1|${'A'.repeat(18)}^${'B'.repeat(15)}`, 30);
    assert.equal(first, `PID|1|${'A'.repeat(18)}`);
  });

  it('breaks after a space inside a field rather than in the middle of a word', () => {
    const chunks = wrapSegment('SCH||14^RDV||CONSULT^Consultation de cardiologie||30', 28);
    assert.equal(chunks.join(''), 'SCH||14^RDV||CONSULT^Consultation de cardiologie||30');
    assert.ok(chunks.every((chunk) => chunk.length <= 28));
    assert.ok(chunks.some((chunk) => chunk.includes('cardiologie')), chunks.join(' / '));
  });

  it('cuts a field with no separator at the width', () => {
    const chunks = wrapSegment(`OBX|${'z'.repeat(120)}`);
    assert.ok(chunks.every((chunk) => chunk.length <= MAX_COLUMNS));
    assert.equal(chunks.join(''), `OBX|${'z'.repeat(120)}`);
  });
});

describe('wrapDisplay', () => {
  it('fills a JSON line up to a dot of an OID or a space, never cutting a number in two', () => {
    const lines = wrapDisplay('json', '"system": "urn:oid:1.2.250.1.213.1.4.10",', 23);
    assert.deepEqual(lines, ['"system": "urn:oid:1.2.', '  250.1.213.1.4.10",']);
  });

  it('keeps the indentation of an XML line and breaks before a tag or an attribute', () => {
    assert.deepEqual(wrapDisplay('xml', '    <id root="1.2.250" extension="1809"/>', 24), ['    <id root="1.2.250"', '      extension="1809"/>']);
    assert.deepEqual(wrapDisplay('xml', '<recordTarget><patientRole>', 20), ['<recordTarget>', '  <patientRole>']);
  });

  it('breaks a DICOM line before its value and its comment, and only there', () => {
    assert.deepEqual(wrapDisplay('dicom', '(0010,0010) PN [DURAND^Martin] # PatientName', 23), ['(0010,0010) PN', '  [DURAND^Martin]', '  # PatientName']);
    assert.deepEqual(wrapDisplay('dicom', '(0008,0060) CS [CT] # Modality', 40), ['(0008,0060) CS [CT] # Modality']);
  });

  it('hard-cuts a word longer than the width and never loops', () => {
    const lines = wrapDisplay('json', `"k": "${'x'.repeat(60)}"`, 20);
    assert.ok(lines.every((line) => line.length <= 20));
    assert.equal(lines.join('').replaceAll(' ', '').replaceAll('"', '').replace('k:', ''), 'x'.repeat(60));
  });

  it('indents the wrapped hl7 chunks by two and leaves the first alone', () => {
    const [first, second] = wrapDisplay('hl7', `PID|1|${'A'.repeat(30)}|${'B'.repeat(30)}`, 30);
    assert.ok(!first!.startsWith(' ') && second!.startsWith('  |'));
  });
});

describe('editorLines', () => {
  it('numbers the lines of the file and leaves the numbers off the continuation lines', () => {
    const lines = editorLines({ format: 'hl7', text: `MSH|a\nPID|${'x'.repeat(30)}|${'y'.repeat(30)}\nEVN|b` });
    assert.deepEqual(lines.map(({ number }) => number), [1, 2, null, 3]);
  });

  it('indents a continuation line by two characters and tokenizes it without a segment id', () => {
    const [, first, continuation] = editorLines({ format: 'hl7', text: `MSH|a\nPID|${'x'.repeat(30)}|${'y'.repeat(30)}` });
    assert.equal(first!.tokens[0]!.kind, 'segment');
    assert.ok(continuation!.text.startsWith('  |'));
    assert.ok(!continuation!.tokens.some(({ kind }) => kind === 'segment'));
  });

  it('shows the lines of other formats as written', () => {
    assert.deepEqual(editorLines({ format: 'json', text: '{"a": 1,\n "b": 2}' }).map(({ text }) => text), ['{"a": 1,', ' "b": 2}']);
  });
});
