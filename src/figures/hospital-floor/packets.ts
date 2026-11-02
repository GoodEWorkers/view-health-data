// Data packets: small dots that ride the cables of the active room, from its anchor device to each flow's destination. One cached circle per packet, positioned by the live loop along the cable's core path.

import { DEPARTMENTS } from '../../content/departments.ts';
import { VANISH_SECONDS, scaleAt, streamsFor } from './packetMotion.ts';
import type { Stream } from './packetMotion.ts';

const SPEED_PLATE_UNITS_PER_SECOND = 130;
const PACKET_RADIUS = 2;
const MAX_LIVE_PACKETS = 48;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export const NO_ACTIVE_ROOM = -1;

export type Packets = {
  readonly setActiveRoom: (index: number) => void;
  readonly advance: (seconds: number) => boolean;
};

type Cable = { readonly path: SVGPathElement; readonly length: number };
type Running = Stream & { nextLaunch: number };
type Packet = {
  readonly circle: SVGCircleElement;
  readonly cable: Cable;
  readonly duration: number;
  age: number;
  scale: number;
};

function cablesOf(stage: Element, id: string): Cable[] {
  return [...stage.querySelectorAll<SVGPathElement>(`[data-cable]:not([data-external])[data-from="${id}"] .cable-core`)].map((path) => ({ path, length: path.getTotalLength() }));
}

export function createPackets(stage: Element, still: MediaQueryList): Packets | null {
  const layer = stage.querySelector('[data-packets]');
  const cables = DEPARTMENTS.map(({ id }) => cablesOf(stage, id));
  const complete = cables.every((own, index) => own.length === DEPARTMENTS[index]!.flows.length);
  if (!layer || !complete) return null;

  const pool: SVGCircleElement[] = [];
  let live: Packet[] = [];
  let running: Running[] = [];
  let clock = 0;

  const recycle = ({ circle }: Packet): void => {
    circle.remove();
    pool.push(circle);
  };

  function place(packet: Packet): void {
    const point = packet.cable.path.getPointAtLength(Math.min(packet.age, packet.duration) * SPEED_PLATE_UNITS_PER_SECOND);
    packet.circle.setAttribute('cx', point.x.toFixed(1));
    packet.circle.setAttribute('cy', point.y.toFixed(1));
    const scale = scaleAt(packet.age, packet.duration);
    if (scale === packet.scale) return;
    packet.scale = scale;
    packet.circle.setAttribute('r', (PACKET_RADIUS * scale).toFixed(2));
  }

  const launch = ({ source, flow }: Stream): void => {
    if (live.length >= MAX_LIVE_PACKETS) return;
    const cable = cables[source]![flow]!;
    const circle = pool.pop() ?? document.createElementNS(SVG_NAMESPACE, 'circle');
    circle.style.setProperty('--room', DEPARTMENTS[source]!.colour);
    const packet: Packet = { circle, cable, duration: cable.length / SPEED_PLATE_UNITS_PER_SECOND, age: 0, scale: -1 };
    live.push(packet);
    place(packet);
    layer.append(circle);
  };

  function setActiveRoom(index: number): void {
    running = [];
    if (still.matches || index === NO_ACTIVE_ROOM) {
      live.forEach(recycle);
      live = [];
      return;
    }
    running = streamsFor(index).map((stream) => ({ ...stream, nextLaunch: clock + stream.firstLaunch }));
  }

  function advance(seconds: number): boolean {
    clock += seconds;
    running.forEach((stream) => {
      while (clock >= stream.nextLaunch) {
        launch(stream);
        stream.nextLaunch += stream.interval;
      }
    });
    live = live.filter((packet) => {
      packet.age += seconds;
      const arrived = packet.age >= packet.duration + VANISH_SECONDS;
      if (arrived) recycle(packet);
      else place(packet);
      return !arrived;
    });
    return running.length > 0 || live.length > 0;
  }

  return { setActiveRoom, advance };
}
