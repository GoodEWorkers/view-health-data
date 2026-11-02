import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { FLOW_ENTRIES } from '../figures/hospital-floor/network/sheets.ts';
import { DEPARTMENTS } from './departments.ts';
import { CDA_ENTRIES } from './dictionary/cda.ts';
import { DICOM_ENTRIES } from './dictionary/dicom.ts';
import { FHIR_ENTRIES } from './dictionary/fhir.ts';
import { HL7_ENTRIES } from './dictionary/hl7.ts';
import { FILE_SUMMARIES } from './decode/summaries.ts';
import { TOKEN_LEGENDS } from './decode/legend.ts';
import { FILE_TRAVEL } from './decode/travel.ts';
import { TRANSPORT_DETAILS, ZONE_LABELS } from './layerLabels.ts';
import { LAYERS } from './layers.ts';
import { EQUIPMENT } from './network/equipment.ts';
import { FIREWALL_RULES } from './network/firewall.ts';
import { GLOSSARY } from './network/glossary.ts';
import { PARTNERS } from './network/partners.ts';
import { PROTOCOL_FAMILIES } from './network/protocols.ts';
import { ZONES } from './network/zones.ts';
import * as screenMocks from './screenMocks.ts';

// Wire dumps, vendor product names and dictionary ids are not prose. HL7_VALUE_ENTRIES is left out too: each coded value explains itself in the sentence that shows it.
const UNSHOWN_KEYS: ReadonlySet<string> = new Set(['capture', 'softwareExamples', 'ref', 'render']);
const SOURCE_ROOT = fileURLToPath(new URL('..', import.meta.url));
const WORD = /[\p{L}\p{N}]+(?:[-/][\p{L}\p{N}]+)*/gu;
const PART_SEPARATOR = /[-/\s]+/;
const ACRONYM = /^\p{Lu}{2,}[\p{L}\p{N}]*$/u;

const ALLOWED_TOKENS: Readonly<Record<string, string>> = {
  DURAND: 'surname of the synthetic patient, written in capitals by convention',
  ROUX: 'surname of the synthetic physician, written in capitals',
  LEROY: 'surname in the synthetic agenda, written in capitals',
  PETIT: 'surname in the synthetic agenda, written in capitals',
  FAURE: 'surname in the synthetic agenda, written in capitals',
  PO: 'HL7 route code that the dictionary defines in the sentence showing it',
  TID: 'HL7 timing code that the dictionary defines in the sentence showing it',
  QD: 'HL7 timing code that the dictionary defines in the sentence showing it',
  HMS: 'HL7 movement code that the dictionary defines in the sentence showing it',
  PI: 'HL7 identifier type that the dictionary defines in the sentence showing it',
};
const ALLOWED_PATTERNS: readonly (readonly [RegExp, string])[] = [[/^ACC\d+$/, 'synthetic accession numbers']];

const stringsOf = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => (UNSHOWN_KEYS.has(key) ? [] : stringsOf(child)));
};

const explained: ReadonlySet<string> = new Set([...GLOSSARY.flatMap(({ term }) => [term, ...term.split(PART_SEPARATOR)]), ...Object.keys(ALLOWED_TOKENS)]);
const isAllowedByPattern = (part: string): boolean => ALLOWED_PATTERNS.some(([pattern]) => pattern.test(part));
const isExplained = (word: string): boolean =>
  explained.has(word) || word.split(PART_SEPARATOR).every((part) => explained.has(part) || !ACRONYM.test(part) || isAllowedByPattern(part));

const unexplainedIn = (text: string): string[] => (text.match(WORD) ?? []).filter((word) => !isExplained(word));

function withoutExpressions(markup: string): string {
  let depth = 0;
  let kept = '';
  for (const character of markup) {
    if (character === '{') depth += 1;
    else if (character === '}') depth = Math.max(0, depth - 1);
    else if (depth === 0) kept += character;
  }
  return kept;
}

// The text a visitor reads in a template: its text nodes, its aria-label, title and placeholder values, and the single-quoted strings of its frontmatter.
export function templateTexts(source: string): string[] {
  const [, frontmatter = '', body = source] = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/) ?? [];
  const markup = body.replace(/<(style|script)[\s\S]*?<\/\1>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const attributes = [...markup.matchAll(/\s(?:aria-label|title|placeholder)="([^"]*)"/g)].map(([, value = '']) => value);
  const strings = [...frontmatter.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(([, value = '']) => value);
  return [withoutExpressions(markup).replace(/<[^>]*>/g, ' '), ...attributes, ...strings];
}

const PROSE: Readonly<Record<string, unknown>> = {
  departments: DEPARTMENTS,
  layers: LAYERS,
  zoneLabels: ZONE_LABELS,
  transportDetails: TRANSPORT_DETAILS,
  screenMocks,
  fileSummaries: FILE_SUMMARIES,
  fileTravel: FILE_TRAVEL,
  tokenLegends: TOKEN_LEGENDS,
  partners: PARTNERS,
  protocols: PROTOCOL_FAMILIES,
  zones: ZONES,
  equipment: EQUIPMENT,
  firewall: FIREWALL_RULES,
  flowSheets: FLOW_ENTRIES.map(({ sheet }) => sheet),
  dictionary: [...HL7_ENTRIES, ...DICOM_ENTRIES, ...CDA_ENTRIES, ...FHIR_ENTRIES].map(({ label, explain }) => [label, explain]),
  glossary: GLOSSARY.map(({ expansion, definition }) => [expansion, definition]),
};

const templates = (readdirSync(SOURCE_ROOT, { recursive: true }) as string[]).filter((path) => path.endsWith('.astro'));

const unexplainedAcronyms = (sources: ReadonlyMap<string, readonly string[]>): string[] => {
  const found = new Map<string, string>();
  sources.forEach((texts, name) => texts.flatMap(unexplainedIn).forEach((word) => found.has(word) || found.set(word, name)));
  return [...found].map(([word, name]) => `${word} (${name})`).sort();
};

describe('glossary coverage', () => {
  it('explains every acronym of the visitor-facing content', () => {
    const sources = new Map(Object.entries(PROSE).map(([name, data]) => [name, stringsOf(data)] as const));
    assert.deepEqual(unexplainedAcronyms(sources), []);
  });

  it('explains every acronym of the static text of the templates', () => {
    const sources = new Map(templates.map((path) => [path, templateTexts(readFileSync(join(SOURCE_ROOT, path), 'utf8'))] as const));
    assert.deepEqual(unexplainedAcronyms(sources), []);
  });
});

describe('the acronym scan', () => {
  it('finds an acronym that has no entry, alone or inside a compound', () => {
    assert.deepEqual(unexplainedIn('Le GAM envoie un ZZQX au DPI'), ['ZZQX']);
    assert.deepEqual(unexplainedIn('Le tunnel ZZQX-RS et le port ZZQX/DPI'), ['ZZQX-RS', 'ZZQX/DPI']);
  });

  it('accepts terms, parts of terms and the allowlist, and ignores codes and camel-case words', () => {
    assert.deepEqual(unexplainedIn('PACS/RIS, HTTPS, e-PMSI, CHU-X, PRA, ADT^A01, S12, JavaScript, ACC260412, DURAND, Dr'), []);
  });

  it('skips wire dumps and vendor names when collecting strings', () => {
    assert.deepEqual(stringsOf({ explain: 'a', capture: ['ZZQX'], softwareExamples: ['ZZQX'], list: [{ ref: 'ZZQX', label: 'b' }] }), ['a', 'b']);
  });

  it('reads the visible text of a template and nothing else', () => {
    const source = "---\nconst HEADING = 'Titre ZZQX';\n---\n<h1 title=\"Aide ZZQY\">Texte ZZQW {GLOSSARY.length}</h1>\n<style>.ZZQV { color: red; }</style>";
    assert.deepEqual(unexplainedIn(templateTexts(source).join(' ')).sort(), ['ZZQW', 'ZZQX', 'ZZQY']);
  });
});
