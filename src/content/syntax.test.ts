import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from './departments.ts';
import { editorLines } from './editorLines.ts';
import { EDITOR_FILES } from './messages/index.ts';
import { dicomTokens, hl7Tokens, jsonTokens, tokenize, xmlTokens } from './syntax.ts';
import type { Token, TokenKind } from './syntax.ts';

const kinds = (tokens: readonly Token[]): TokenKind[] => tokens.map(({ kind }) => kind);
const rebuilt = (tokens: readonly Token[]): string => tokens.map(({ text }) => text).join('');

describe('every file', () => {
  it('is tokenized into tokens that rebuild each displayed line exactly', () => {
    for (const { id } of DEPARTMENTS) {
      for (const line of editorLines(EDITOR_FILES[id])) assert.equal(rebuilt(line.tokens), line.text, `${id}: ${line.text}`);
    }
  });

  it('never yields an empty token', () => {
    for (const { id } of DEPARTMENTS) {
      for (const line of editorLines(EDITOR_FILES[id])) line.tokens.forEach(({ text }) => assert.notEqual(text, '', `${id}: ${line.text}`));
    }
  });
});

describe('hl7Tokens', () => {
  it('marks the segment id, the separators, a timestamp and the other fields', () => {
    const tokens = hl7Tokens('EVN||202611020840|ROUX^Hugues');
    assert.deepEqual(tokens.map(({ kind, text }) => `${kind}:${text}`), ['segment:EVN', 'separator:||', 'time:202611020840', 'separator:|', 'field:ROUX', 'separator:^', 'field:Hugues']);
  });

  it('keeps the encoding characters of the MSH together as one separator', () => {
    assert.deepEqual(kinds(hl7Tokens('MSH|^~\\&|GAM')), ['segment', 'separator', 'field']);
  });

  it('finds no segment id on a continuation line and keeps its indent', () => {
    const [indent, first] = hl7Tokens('  |ADT^A01', true);
    assert.deepEqual([indent, first], [{ kind: 'text', text: '  ' }, { kind: 'separator', text: '|' }]);
    assert.ok(!kinds(hl7Tokens('  |ADT^A01', true)).includes('segment'));
  });

  it('does not take three capitals at the start of a continuation line for a segment id', () => {
    assert.ok(!kinds(hl7Tokens('  ABC|x', true)).includes('segment'));
    assert.ok(kinds(hl7Tokens('ABC|x')).includes('segment'));
  });

  it('takes a date as a timestamp and a longer digit run as a field', () => {
    assert.equal(hl7Tokens('PID|19580614')[2]!.kind, 'time');
    assert.equal(hl7Tokens('PID|180999912345678')[2]!.kind, 'field');
  });
});

describe('xmlTokens', () => {
  it('marks tags, attributes, values and text', () => {
    const tokens = xmlTokens('<code code="34105-7">Lettre</code>');
    assert.deepEqual(tokens.map(({ kind, text }) => `${kind}:${text}`), ['tag:<code', 'text: ', 'attribute:code', 'punctuation:=', 'value:"34105-7"', 'tag:>', 'text:Lettre', 'tag:</code', 'tag:>']);
  });

  it('knows a line that continues a tag of the line above', () => {
    assert.deepEqual(kinds(xmlTokens('        extension="1809"/>')), ['text', 'attribute', 'punctuation', 'value', 'tag']);
  });

  it('marks a self-closing tag end', () => {
    assert.equal(xmlTokens('<realmCode code="FR"/>').at(-1)!.text, '/>');
  });
});

describe('jsonTokens', () => {
  it('tells keys from strings, and marks numbers, literals and punctuation', () => {
    const tokens = jsonTokens('{"a": "b", "n": -1.5, "ok": true}');
    assert.deepEqual(tokens.filter(({ kind }) => kind !== 'text' && kind !== 'punctuation').map(({ kind, text }) => `${kind}:${text}`), ['key:"a"', 'string:"b"', 'key:"n"', 'number:-1.5', 'key:"ok"', 'literal:true']);
  });

  it('takes a string cut by a narrow window as a string up to its end', () => {
    assert.deepEqual(jsonTokens('"urn:oid:1.2.250'), [{ kind: 'string', text: '"urn:oid:1.2.250' }]);
  });

  it('keeps an escaped quote inside its string', () => {
    assert.equal(jsonTokens('"a\\"b"')[0]!.text, '"a\\"b"');
  });
});

describe('dicomTokens', () => {
  it('splits a dcmdump line into tag, VR, value and comment', () => {
    const tokens = dicomTokens('(0010,0010) PN [DURAND^Martin]  # PatientName');
    assert.deepEqual(tokens.filter(({ kind }) => kind !== 'text').map(({ kind, text }) => `${kind}:${text}`), ['tag:(0010,0010)', 'vr:PN', 'value:[DURAND^Martin]', 'comment:# PatientName']);
  });

  it('marks a value or a comment that a narrow window wrapped onto a line of its own', () => {
    assert.deepEqual(dicomTokens('[DURAND^Martin]'), [{ kind: 'value', text: '[DURAND^Martin]' }]);
    assert.deepEqual(dicomTokens('# PatientName'), [{ kind: 'comment', text: '# PatientName' }]);
    assert.deepEqual(kinds(dicomTokens('(0010,0010) PN')), ['tag', 'text', 'vr']);
  });

  it('leaves a line that is not a tag as plain text', () => {
    assert.deepEqual(dicomTokens('Dicom-File-Format'), [{ kind: 'text', text: 'Dicom-File-Format' }]);
  });
});

describe('tokenize', () => {
  it('picks the tokenizer of the format', () => {
    assert.equal(tokenize('hl7', 'PID|1')[0]!.kind, 'segment');
    assert.equal(tokenize('xml', '<a/>')[0]!.kind, 'tag');
    assert.equal(tokenize('json', '{}')[0]!.kind, 'punctuation');
    assert.equal(tokenize('dicom', '(0008,0060) CS [CT]')[0]!.kind, 'tag');
  });
});
