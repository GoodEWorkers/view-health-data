// The per-room selectors of the flow focus, so no room id lives in the stylesheet. Every --flow-focus rule sits in :where() at zero specificity, so source order decides: dim, hide, preview of the pointed room, then keep what the selected room touches.

const FLOWS = ':is([data-cable], [data-wire], [data-packets] circle)';
const HITS = ':is(.cable-hit, .wire-hit)';

const unrelatedTo = (room: string): string => `:not([data-from='${room}']):not([data-to='${room}'])`;
const relatedTo = (room: string): string => `:is([data-from='${room}'], [data-to='${room}'])`;
const focusRule = (selector: string, value: string): string => `:where(${selector}){--flow-focus:${value}}`;

export function flowFocusRules(rooms: readonly string[]): string {
  const dimmed = rooms.map((room) => focusRule(`.layout[data-focus-room='${room}']:not([data-selected-room]) ${FLOWS}${unrelatedTo(room)}`, 'var(--flow-dim)'));
  const hidden = rooms.map((room) => focusRule(`.layout[data-selected-room='${room}'] ${FLOWS}${unrelatedTo(room)}`, '0'));
  const previewed = rooms.map((room) => focusRule(`.layout[data-selected-room][data-focus-room='${room}'] ${FLOWS}${relatedTo(room)}`, 'var(--flow-peek)'));
  const kept = rooms.map((room) => focusRule(`.layout[data-selected-room='${room}'] ${FLOWS}${relatedTo(room)}`, '1'));
  const blocked = rooms.map((room) => `.layout[data-selected-room='${room}'] ${FLOWS}${unrelatedTo(room)} ${HITS}{pointer-events:none}`);
  return [...dimmed, ...hidden, ...previewed, ...kept, ...blocked].join('\n');
}
