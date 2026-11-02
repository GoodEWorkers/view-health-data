// French dates and times from the stamps of the files: HL7 and DICOM digits (YYYYMMDD, YYYYMMDDHHMM, HHMMSS) and FHIR ISO strings. Anything else comes back unchanged.

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] as const;
const DATE_PATTERN = /^(\d{4})-?(\d{2})-?(\d{2})/;
const TIME_PATTERN = /^(\d{2}):?(\d{2})/;
const FIRST_OF_MONTH = '1er';

function dayText(stamp: string): string | undefined {
  const match = DATE_PATTERN.exec(stamp);
  const month = MONTHS[Number(match?.[2]) - 1];
  if (!match || !month) return undefined;
  const day = Number(match[3]);
  return `${day === 1 ? FIRST_OF_MONTH : day} ${month} ${match[1]}`;
}

function clockText(stamp: string): string | undefined {
  const match = TIME_PATTERN.exec(stamp);
  return match ? `${match[1]}:${match[2]}` : undefined;
}

export const formatDate = (stamp: string): string => dayText(stamp) ?? stamp;

export const formatTime = (stamp: string): string => clockText(stamp) ?? stamp;

export function formatDateTime(stamp: string): string {
  const [datePart = '', timePart = ''] = stamp.includes('T') ? stamp.split('T') : [stamp.slice(0, 8), stamp.slice(8)];
  const day = dayText(datePart);
  const clock = clockText(timePart);
  if (!day) return stamp;
  return clock ? `${day}, ${clock}` : day;
}
