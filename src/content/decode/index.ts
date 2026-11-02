// One inspection per service: the full file, its card model and raw lines, the one-sentence summary, the flows it travels on and the refs selected on open.

import { DEPARTMENTS } from '../departments.ts';
import type { DepartmentId } from '../departments.ts';
import { EDITOR_FILES } from '../messages/index.ts';
import type { EditorFile } from '../messages/index.ts';
import { decodeDicom } from './dicom.ts';
import { decodeHl7 } from './hl7.ts';
import { decodeJson } from './json.ts';
import { initialRefs } from './selection.ts';
import { FILE_SUMMARIES } from './summaries.ts';
import { FILE_TRAVEL } from './travel.ts';
import type { DecodedFile } from './types.ts';
import { decodeXml } from './xml.ts';

export type Inspection = DecodedFile & {
  readonly id: DepartmentId;
  readonly file: EditorFile;
  readonly summary: string;
  readonly travel: readonly string[];
  readonly initial: readonly string[];
};

const DECODERS: Readonly<Record<EditorFile['format'], (text: string) => DecodedFile>> = {
  hl7: decodeHl7,
  xml: decodeXml,
  json: decodeJson,
  dicom: decodeDicom,
};

const inspect = (id: DepartmentId): Inspection => {
  const file = EDITOR_FILES[id];
  const decoded = DECODERS[file.format](file.text);
  const range = file.ranges.find(({ key }) => key === file.mainRange)!;
  return { ...decoded, id, file, summary: FILE_SUMMARIES[id], travel: FILE_TRAVEL[id], initial: initialRefs(decoded, range.lines) };
};

export const INSPECTIONS: readonly Inspection[] = DEPARTMENTS.map(({ id }) => inspect(id));
