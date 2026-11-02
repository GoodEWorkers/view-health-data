// One pure tokenizer per file format of the editor view. A line goes in, the tokens that rebuild it exactly come out, each with a kind the stylesheet colours through data-token.

export type EditorFormat = 'hl7' | 'xml' | 'json' | 'dicom';

export type TokenKind =
  | 'segment'
  | 'separator'
  | 'time'
  | 'field'
  | 'tag'
  | 'attribute'
  | 'value'
  | 'text'
  | 'key'
  | 'string'
  | 'number'
  | 'literal'
  | 'punctuation'
  | 'vr'
  | 'comment';

export type Token = { readonly kind: TokenKind; readonly text: string };

const HL7_SEPARATORS = /([|^~\\&]+)/;
const HL7_SEGMENT = /^[A-Z][A-Z0-9]{2}(?=\|)/;
const HL7_TIMESTAMP = /^\d{8}(\d{4}(\d{2})?)?$/;
const XML_TAG_START = /^<\/?[\w:.-]+/;
const XML_TAG_END = /^\/?>/;
const XML_ATTRIBUTE = /^[\w:.-]+(?==)/;
const XML_VALUE = /^("[^"]*"|'[^']*')/;
const XML_CONTINUED_TAG = /^\s*[\w:.-]+=/;
const JSON_STRING = /^"(?:[^"\\]|\\.)*"?/;
const JSON_NUMBER = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/;
const JSON_LITERAL = /^(?:true|false|null)/;
const JSON_PUNCTUATION = /^[{}[\],:]/;
const DICOM_LINE = /^(\([0-9A-Fa-f]{4},[0-9A-Fa-f]{4}\))?(\s*)([A-Z]{2}(?=\s|$))?(\s*)(\[[^\]]*\])?(\s*)(#.*)?$/;

const withoutEmpty = (tokens: readonly Token[]): Token[] => tokens.filter(({ text }) => text !== '');

export function hl7Tokens(line: string, continued = false): Token[] {
  const indent = /^\s*/.exec(line)![0];
  const body = line.slice(indent.length);
  const segmentId = continued ? undefined : HL7_SEGMENT.exec(body)?.[0];
  const rest = body.slice(segmentId?.length ?? 0);
  const pieces = rest.split(HL7_SEPARATORS).map((text, index): Token => {
    if (index % 2 === 1) return { kind: 'separator', text };
    return { kind: HL7_TIMESTAMP.test(text) ? 'time' : 'field', text };
  });
  return withoutEmpty([{ kind: 'text', text: indent }, ...(segmentId ? [{ kind: 'segment', text: segmentId } as const] : []), ...pieces]);
}

export function xmlTokens(line: string): Token[] {
  const tokens: Token[] = [];
  let inTag = XML_CONTINUED_TAG.test(line) && !line.trimStart().startsWith('<');
  let rest = line;
  const take = (kind: TokenKind, text: string): void => {
    tokens.push({ kind, text });
    rest = rest.slice(text.length);
  };
  while (rest.length > 0) {
    if (!inTag) {
      const start = XML_TAG_START.exec(rest)?.[0];
      if (start) {
        take('tag', start);
        inTag = true;
      } else take('text', /^[^<]+/.exec(rest)?.[0] ?? rest[0]!);
      continue;
    }
    const end = XML_TAG_END.exec(rest)?.[0];
    const attribute = XML_ATTRIBUTE.exec(rest)?.[0];
    const value = XML_VALUE.exec(rest)?.[0];
    if (end) {
      take('tag', end);
      inTag = false;
    } else if (attribute) take('attribute', attribute);
    else if (value) take('value', value);
    else if (rest[0] === '=') take('punctuation', '=');
    else take('text', /^\s+/.exec(rest)?.[0] ?? rest[0]!);
  }
  return tokens;
}

export function jsonTokens(line: string): Token[] {
  const tokens: Token[] = [];
  let rest = line;
  while (rest.length > 0) {
    const string = JSON_STRING.exec(rest)?.[0];
    const next = string ? rest.slice(string.length) : '';
    const number = JSON_NUMBER.exec(rest)?.[0];
    const literal = JSON_LITERAL.exec(rest)?.[0];
    const punctuation = JSON_PUNCTUATION.exec(rest)?.[0];
    const [kind, text]: [TokenKind, string] = string
      ? [/^\s*:/.test(next) ? 'key' : 'string', string]
      : number
        ? ['number', number]
        : literal
          ? ['literal', literal]
          : punctuation
            ? ['punctuation', punctuation]
            : ['text', /^\s+/.exec(rest)?.[0] ?? rest[0]!];
    tokens.push({ kind, text });
    rest = rest.slice(text.length);
  }
  return tokens;
}

export function dicomTokens(line: string): Token[] {
  const match = DICOM_LINE.exec(line);
  const [, tag, spaceA, vr, spaceB, value, spaceC, comment] = (match ?? []) as (string | undefined)[];
  const tokens = withoutEmpty([
    { kind: 'tag', text: tag ?? '' },
    { kind: 'text', text: spaceA ?? '' },
    { kind: 'vr', text: vr ?? '' },
    { kind: 'text', text: spaceB ?? '' },
    { kind: 'value', text: value ?? '' },
    { kind: 'text', text: spaceC ?? '' },
    { kind: 'comment', text: comment ?? '' },
  ]);
  return tokens.length > 0 && tokens.map(({ text }) => text).join('') === line ? tokens : [{ kind: 'text', text: line }];
}

export function tokenize(format: EditorFormat, line: string, continued = false): Token[] {
  if (format === 'hl7') return hl7Tokens(line, continued);
  if (format === 'xml') return xmlTokens(line);
  if (format === 'json') return jsonTokens(line);
  return dicomTokens(line);
}
