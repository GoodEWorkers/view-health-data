// Every flow of the floor with its sheet, in the order the sheet view steps through them: per room the internal flows, then the external ones. The key is the one the cables carry in data-trace. Server side only.

import { DEPARTMENTS } from '../../../content/departments.ts';
import type { DepartmentId, ExternalFlow, Flow } from '../../../content/departments.ts';
import { ZONE_LABELS } from '../../../content/layerLabels.ts';
import { externalSheetOf, flowSheetOf } from '../../../content/network/flowSheet.ts';
import type { FlowSheet } from '../../../content/network/flowSheet.ts';
import { protocolOf } from '../../../content/network/protocols.ts';
import type { ProtocolInfo } from '../../../content/network/protocols.ts';
import { ZONES } from '../../../content/network/zones.ts';
import type { Zone } from '../../../content/network/zones.ts';

export const flowKey = (from: DepartmentId, payload: string): string => `${from}:${payload}`;

export type FlowEntry = {
  readonly key: string;
  readonly room: DepartmentId;
  readonly external: boolean;
  readonly flow: Flow | ExternalFlow;
  readonly sheet: FlowSheet;
  readonly family: ProtocolInfo;
};

const transportOf = ({ transport, payload }: Flow | ExternalFlow) => {
  if (transport === undefined) throw new Error(`Flow "${payload}" has no transport`);
  return transport;
};

const internalEntry = (room: DepartmentId, flow: Flow): FlowEntry => ({ key: flowKey(room, flow.payload), room, external: false, flow, sheet: flowSheetOf(room, flow), family: protocolOf(transportOf(flow)) });

const externalEntry = (room: DepartmentId, flow: ExternalFlow): FlowEntry => ({ key: flowKey(room, flow.payload), room, external: true, flow, sheet: externalSheetOf(room, flow), family: protocolOf(flow.transport) });

export const FLOW_ENTRIES: readonly FlowEntry[] = DEPARTMENTS.flatMap(({ id, flows, network }) => [
  ...flows.map((flow) => internalEntry(id, flow)),
  ...network.externalFlows.map((flow) => externalEntry(id, flow)),
]);

export type ZoneLook = { readonly label: string; readonly colour: string };

const EDGE_LOOK: ZoneLook = { label: 'Bordure du réseau', colour: 'var(--anatomy-muted)' };

export const zoneLook = (zone: Zone | 'edge' | undefined): ZoneLook => {
  if (zone === undefined || zone === 'edge') return EDGE_LOOK;
  return { label: ZONE_LABELS[zone], colour: ZONES.find(({ id }) => id === zone)!.colour };
};
