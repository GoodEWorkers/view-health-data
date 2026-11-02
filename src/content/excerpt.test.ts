import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from './departments.ts';
import { EXCERPT_COLUMNS, EXCERPT_ROWS, excerptOf, foldText } from './excerpt.ts';
import type { CodeLine, ExcerptLine } from './excerpt.ts';
import { EDITOR_FILES } from './messages/index.ts';
import type { EditorFile } from './messages/index.ts';

const hl7 = (lines: readonly string[], ranges: EditorFile['ranges'], mainRange: string): EditorFile => ({ name: 'x.hl7', format: 'hl7', badge: 'HL7', text: lines.join('\n'), ranges, mainRange });
const SEGMENTS = ['MSH|a', 'EVN|b', 'PID|1|c', 'PV1|2|d', 'ZBE|3|e', 'OBX|4|f', 'OBX|5|g', 'OBX|6|h', 'OBX|7|i', 'OBX|8|j'];
const FILE = hl7(SEGMENTS, [{ key: 'pid', lines: [3, 3], label: 'Patient' }, { key: 'obx', lines: [6, 10], label: 'Résultats' }, { key: 'all', lines: [1, 10], label: 'Tout' }], 'pid');

const code = (lines: readonly ExcerptLine[]): CodeLine[] => lines.filter((line): line is CodeLine => line.kind === 'code');

describe('excerptOf', () => {
  it('shows the lines of the range with their true numbers, folding what is left out', () => {
    const { lines } = excerptOf(FILE, 'pid', { rows: 3 });
    assert.deepEqual(lines.map((line) => (line.kind === 'fold' ? line.text : `${line.number} ${line.text}`)), ['⋯ 2 segments repliés', '3 PID|1|c', '⋯ 7 segments repliés']);
  });

  it('marks the lines of the range and no other', () => {
    const { lines } = excerptOf(FILE, 'pid', { rows: 7 });
    assert.deepEqual(code(lines).filter(({ inRange }) => inRange).map(({ number }) => number), [3]);
  });

  it('fills spare rows with the neighbouring lines, below first, and drops a fold that has nothing left to hide', () => {
    const { lines } = excerptOf(FILE, 'obx', { rows: 7 });
    assert.deepEqual(code(lines).map(({ number }) => number), [2, 3, 4, 5, 6, 7, 8, 9, 10].slice(-6));
    const all = excerptOf(FILE, 'all', { rows: 12 }).lines;
    assert.ok(all.every((line) => line.kind === 'code'));
    assert.equal(all.length, 10);
  });

  it('fills spare rows below the range before above it', () => {
    const { lines } = excerptOf(FILE, 'pid', { rows: 6 });
    assert.deepEqual(code(lines).map(({ number }) => number), [3, 4, 5, 6]);
    assert.equal(lines[0]!.kind, 'fold');
  });

  it('dedents the lines of a JSON or XML file to the range, keeping what is indented further and the lines indented less', () => {
    const json: EditorFile = {
      name: 'x.json',
      format: 'json',
      badge: 'JSON',
      text: ['{', '    "a": {', '      "b": 1,', '      "c": 2', '    }', '}'].join('\n'),
      ranges: [{ key: 'inner', lines: [3, 4], label: 'Intérieur' }, { key: 'outer', lines: [2, 3], label: 'Extérieur' }],
      mainRange: 'inner',
    };
    assert.deepEqual(code(excerptOf(json, 'inner', { rows: 7, columns: 30 }).lines).map(({ text }) => text), ['{', '"a": {', '"b": 1,', '"c": 2', '}', '}']);
    assert.deepEqual(code(excerptOf(json, 'outer', { rows: 7, columns: 30 }).lines).map(({ text }) => text), ['{', '"a": {', '  "b": 1,', '  "c": 2', '}', '}']);
  });

  it('counts the hidden segments so that shown plus hidden is the whole file', () => {
    for (const key of ['pid', 'obx']) {
      const { lines } = excerptOf(FILE, key, { rows: 5 });
      const hidden = lines.reduce((total, line) => total + (line.kind === 'fold' ? line.hidden : 0), 0);
      assert.equal(code(lines).filter(({ number }) => number !== null).length + hidden, SEGMENTS.length, key);
    }
  });

  it('never exceeds the rows or the columns', () => {
    for (const key of ['pid', 'obx', 'all']) {
      const { lines } = excerptOf(FILE, key, { rows: 6, columns: 8 });
      assert.ok(lines.length <= 6, `${key}: ${lines.length} rows`);
      code(lines).forEach((line) => assert.ok(line.text.length <= 8, `${key}: ${line.text}`));
    }
  });

  it('shows the first segments of a range too tall for the window and folds the rest', () => {
    const { lines } = excerptOf(FILE, 'all', { rows: 4 });
    assert.deepEqual(lines.map((line) => (line.kind === 'fold' ? line.text : `${line.number} ${line.text}`)), ['1 MSH|a', '2 EVN|b', '3 PID|1|c', '⋯ 7 segments repliés']);
  });

  it('clips inside a segment that alone is taller than the window, leaving no number on its continuation rows and counting it with the folded ones', () => {
    const long = hl7([`PID|1||${'A'.repeat(40)}|${'B'.repeat(40)}`, 'EVN|x'], [{ key: 'pid', lines: [1, 1], label: 'Patient' }], 'pid');
    const { lines } = excerptOf(long, 'pid', { rows: 3, columns: 20 });
    assert.equal(lines.length, 3);
    assert.deepEqual(lines.at(-1), { kind: 'fold', text: '⋯ 2 segments repliés', hidden: 2 });
    assert.deepEqual(code(lines).map(({ number }) => number), [1, null]);
  });

  it('falls back to the main range for an unknown key', () => {
    assert.equal(excerptOf(FILE, 'nope').key, 'pid');
  });

  it('carries the range label for the hint', () => {
    assert.equal(excerptOf(FILE, 'obx').label, 'Résultats');
  });
});

describe('foldText', () => {
  it('speaks French: « segments repliés » for HL7, « lignes repliées » for the others, singular and plural', () => {
    assert.equal(foldText(3, 'hl7'), '⋯ 3 segments repliés');
    assert.equal(foldText(1, 'hl7'), '⋯ 1 segment replié');
    assert.equal(foldText(12, 'json'), '⋯ 12 lignes repliées');
    assert.equal(foldText(1, 'xml'), '⋯ 1 ligne repliée');
  });
});

describe('the eight files in a window', () => {
  it('show the INS of the patient in each of the ranges that name it, wrapped rows rejoined', () => {
    for (const [id, key] of [['gam', 'identity'], ['eai', 'identifier'], ['dpi', 'patient']] as const) {
      const shown = code(excerptOf(EDITOR_FILES[id], key).lines).map(({ text }) => text.trim()).join('');
      assert.ok(shown.includes('180999912345678'), `${id}/${key} hides the INS`);
    }
  });

  it('include the first rows of every range, within 7 rows of 23 columns', () => {
    for (const { id } of DEPARTMENTS) {
      for (const { key, lines: [from] } of EDITOR_FILES[id].ranges) {
        const { lines } = excerptOf(EDITOR_FILES[id], key);
        assert.ok(lines.length <= EXCERPT_ROWS, `${id}/${key}: ${lines.length} rows`);
        lines.forEach((line) => assert.ok(line.text.length <= EXCERPT_COLUMNS, `${id}/${key}: "${line.text}"`));
        assert.ok(code(lines).some(({ number, inRange }) => number === from && inRange), `${id}/${key} does not show its first line`);
      }
    }
  });

  it('show a whole range when it fits, and every main range at least starts', () => {
    const { lines } = excerptOf(EDITOR_FILES.gam, 'movement');
    assert.ok(code(lines).some(({ number }) => number === 5));
    for (const { id } of DEPARTMENTS) assert.equal(excerptOf(EDITOR_FILES[id], EDITOR_FILES[id].mainRange).key, EDITOR_FILES[id].mainRange);
  });
});
