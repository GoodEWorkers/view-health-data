// The French dictionary of the Données inspector: one entry per HL7 v2 segment and field, DICOM tag, CDA element and attribute, FHIR key, and the coded values the eight files carry. Pure data; refs are namespaced per format.

import { CDA_ENTRIES } from './cda.ts';
import { DICOM_ENTRIES } from './dicom.ts';
import { FHIR_ENTRIES } from './fhir.ts';
import { HL7_ENTRIES } from './hl7.ts';
import { HL7_VALUE_ENTRIES } from './hl7Values.ts';

export type RenderKind =
  | 'text'
  | 'date'
  | 'datetime'
  | 'time'
  | 'name'
  | 'practitioner'
  | 'identifiers'
  | 'location'
  | 'organization'
  | 'code'
  | 'messageType'
  | 'version'
  | 'application'
  | 'encoding'
  | 'entity'
  | 'timing'
  | 'decimal'
  | 'range'
  | 'observation'
  | 'oid'
  | 'reference'
  | 'millimetres'
  | 'pixels'
  | 'ins'
  | `table:${string}`;

export type DictionaryEntry = {
  readonly ref: string;
  readonly label: string;
  readonly explain?: string;
  readonly render?: RenderKind;
};

export const ALL_ENTRIES: readonly DictionaryEntry[] = [...HL7_ENTRIES, ...HL7_VALUE_ENTRIES, ...DICOM_ENTRIES, ...CDA_ENTRIES, ...FHIR_ENTRIES];

const ENTRIES_BY_REF: ReadonlyMap<string, DictionaryEntry> = new Map(ALL_ENTRIES.map((entry) => [entry.ref, entry]));

export const lookup = (ref: string): DictionaryEntry | undefined => ENTRIES_BY_REF.get(ref);
