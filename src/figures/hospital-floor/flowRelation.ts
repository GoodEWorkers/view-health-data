// Which flows a room focus keeps in view. A flow belongs to its source and to its destination; a selection hides what is unrelated to it and to the room being previewed. The CSS in flowFocusCss.ts draws the same rule, this answers it for scripts.

export type FlowEnds = { readonly from: string; readonly to: string };
export type RoomFocus = { readonly focused: string | undefined; readonly selected: string | undefined };

export const isRelated = ({ from, to }: FlowEnds, room: string | undefined): boolean => room !== undefined && (from === room || to === room);

export const isHiddenByFocus = (flow: FlowEnds, { focused, selected }: RoomFocus): boolean =>
  selected !== undefined && !isRelated(flow, selected) && !isRelated(flow, focused);
