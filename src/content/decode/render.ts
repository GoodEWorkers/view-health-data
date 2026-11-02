// Turns a raw value into French text, by the render kind its dictionary entry names. Repetitions (~) become one line each; components are split on ^ and sub-components on &.

import { lookup } from '../dictionary/index.ts';
import type { RenderKind } from '../dictionary/index.ts';
import { formatDate, formatDateTime, formatTime } from './time.ts';

export type FieldContext = { readonly fields: readonly string[] };

const REPETITION = '~';
const COMPONENT = '^';
const SUBCOMPONENT = '&';
const INS_PATTERN = /^(\d)(\d{2})(\d{2})(\d{2})(\d{3})(\d{3})(\d{2})$/;
const OID_PREFIX = 'urn:oid:';
const ENCAPSULATED_VALUE = 'ED';
const TABLE_PREFIX = 'table:';
const LOINC_SYSTEM = 'LN';

export const formatIns = (digits: string): string => INS_PATTERN.exec(digits)?.slice(1).join(' ') ?? digits;

const decimal = (text: string): string => text.replace('.', ',');
const labelOf = (ref: string): string | undefined => lookup(ref)?.label;
const withCode = (label: string, code: string): string => (label.toLowerCase() === code.toLowerCase() ? label : `${label} (${code})`);
const parts = (value: string): string[] => value.split(COMPONENT);

function authorityText(authority: string | undefined): string {
  const [namespace = '', universal = ''] = (authority ?? '').split(SUBCOMPONENT);
  const known = labelOf(`OID:${universal}`);
  if (known) return known;
  return [namespace, universal && `n° ${universal}`].filter(Boolean).join(', ');
}

function identifierText(repetition: string): string {
  const [number = '', , , authority, type = ''] = parts(repetition);
  const typeLabel = labelOf(`ID:${type}`) ?? type;
  const shown = type === 'INS' ? formatIns(number) : number;
  const where = authorityText(authority);
  return [typeLabel, shown, where && `(${where})`].filter(Boolean).join(' ');
}

function locationText(repetition: string): string {
  const [point = '', room = '', bed = ''] = parts(repetition);
  const roomWord = labelOf(`ROOM:${point}`) ?? 'chambre';
  return [labelOf(`POINT:${point}`) ?? point, room && `${roomWord} ${room}`, bed && `lit ${bed}`].filter(Boolean).join(', ');
}

function codeText(repetition: string): string {
  const [code = '', text = '', system = ''] = parts(repetition);
  const known = text || labelOf(`LN:${code}`) || '';
  const systemLabel = labelOf(`SYSTEM:${text ? system : LOINC_SYSTEM}`);
  if (!known) return code;
  return code ? `${known} (${systemLabel ? `${systemLabel} ` : ''}${code})` : known;
}

function timingText(repetition: string): string {
  const [, interval = '', duration = '', start = ''] = parts(repetition);
  const rhythm = interval && withCode(labelOf(`HL70335:${interval}`) ?? interval, interval);
  return [rhythm, start && `à partir du ${formatDateTime(start)}`, duration && `durée ${duration}`].filter(Boolean).join(' · ');
}

function versionText(repetition: string): string {
  const [version = '', country = '', national = ''] = parts(repetition);
  const countryLabel = labelOf(`ISO3166:${country}`);
  return `HL7 v${version}${national && countryLabel ? `, extension ${countryLabel === 'France' ? 'française' : countryLabel} ${national}` : ''}`;
}

function observationText(repetition: string, { fields }: FieldContext): string {
  if (fields[2] !== ENCAPSULATED_VALUE) return decimal(repetition);
  const [, , subtype = '', encoding = ''] = parts(repetition);
  return `Document ${subtype} encodé en ${encoding}, contenu abrégé`;
}

function rangeText(repetition: string): string {
  const between = /^(-?[\d.]+)-(-?[\d.]+)$/.exec(repetition);
  if (between) return `${decimal(between[1]!)} à ${decimal(between[2]!)}`;
  return decimal(repetition).replace(/^([<>])/, '$1 ');
}

const SIMPLE: Readonly<Record<string, (repetition: string, context: FieldContext) => string>> = {
  text: (repetition) => repetition,
  date: formatDate,
  datetime: formatDateTime,
  time: formatTime,
  name: (repetition) => parts(repetition).slice(0, 2).filter(Boolean).join(' '),
  practitioner: (repetition) => {
    const [family = '', given = '', , , title = ''] = parts(repetition);
    return [title, given, family].filter(Boolean).join(' ');
  },
  identifiers: identifierText,
  location: locationText,
  organization: (repetition) => {
    const [name = '', , , , , , type = '', , , identifier = ''] = parts(repetition);
    return identifier ? `${name} (${type} ${identifier})` : name;
  },
  code: codeText,
  messageType: (repetition) => {
    const [code = '', event = ''] = parts(repetition);
    return withCode(labelOf(`MSG:${code}${COMPONENT}${event}`) ?? code, `${code}${COMPONENT}${event}`);
  },
  version: versionText,
  application: (repetition) => withCode(labelOf(`APP:${repetition}`) ?? repetition, repetition),
  entity: (repetition) => {
    const [identifier = '', ...rest] = parts(repetition);
    const where = rest.filter(Boolean).join(', ');
    return where ? `${identifier} (${where})` : identifier;
  },
  timing: timingText,
  decimal,
  range: rangeText,
  observation: observationText,
  oid: (repetition) => {
    const oid = repetition.startsWith(OID_PREFIX) ? repetition.slice(OID_PREFIX.length) : repetition;
    const label = labelOf(`OID:${oid}`);
    return label ? `${label} (${oid})` : oid;
  },
  reference: (repetition) => repetition.replace('/', ' '),
  millimetres: (repetition) => `${decimal(repetition)} mm`,
  pixels: (repetition) => `${repetition} pixels`,
  ins: formatIns,
};

const encodingText = (raw: string): string => `${raw[0]} composants, ${raw[1]} répétitions, ${raw[2]} échappement, ${raw[3]} sous-composants`;

export function renderValue(kind: RenderKind | undefined, raw: string, context: FieldContext): string {
  if (kind === 'encoding') return encodingText(raw);
  const repetitions = raw.split(REPETITION);
  if (kind?.startsWith(TABLE_PREFIX)) {
    const table = kind.slice(TABLE_PREFIX.length);
    return repetitions.map((code) => withCode(labelOf(`${table}:${code}`) ?? code, code)).join('\n');
  }
  const render = SIMPLE[kind ?? 'text']!;
  return repetitions.map((repetition) => render(repetition, context)).join('\n');
}
