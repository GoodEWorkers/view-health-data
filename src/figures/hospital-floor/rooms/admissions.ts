import { chair, counter, monitor } from '../furniture.ts';
import { box, compose, faceLine, floorMark, onGround, post, prism, rect, sorted, stacked, topOutline } from '../parts.ts';
import type { Part } from '../parts.ts';
import { line } from '../camera.ts';

const COUNTER_HEIGHT = 10;
const LIP_HEIGHT = 1.5;
const LEG_LONG = rect(76, 18, 36, 8, 0.6);
const LEG_SHORT = rect(76, 26, 8, 26, 0.6);
const CHAIR_COLUMN_X = 74.8;
const CHAIR_FIRST_Y = 60;
const CHAIR_PITCH = 7;
const CHAIR_COUNT = 4;
const TICKET_POST_AT = [118, 40] as const;
const WAITING_RUG = rect(72, 56, 24, 29, 2);
const QUEUE_STRIPS = [rect(86, 29.5, 26, 2.4, 1.2), rect(87, 35, 2.4, 17, 1.2)];

export function admissionsParts(): Part[] {
  return [waitingRug(), ...QUEUE_STRIPS.map((strip) => floorMark(strip)), receptionDesk(), ...waitingChairs(), ticketDispenser()];
}

function waitingRug(): Part {
  return onGround(box(WAITING_RUG, 0.1, 0.3, { tone: 'lo', bevel: 0, trim: topOutline(WAITING_RUG, 0.4, 1.4) }));
}

function receptionDesk(): Part {
  const longLeg = counter(LEG_LONG, COUNTER_HEIGHT, 'hi');
  const shortLeg = counter(LEG_SHORT, COUNTER_HEIGHT, 'hi');
  const monitors = [92, 104].map((x) => monitor([x, 22], COUNTER_HEIGHT, 'left', false));
  return compose([longLeg, shortLeg, sorted([...monitors, printer()]), frontLip()]);
}

function frontLip(): Part {
  const edge = LEG_SHORT.x + LEG_SHORT.w;
  const outer = LEG_LONG.y + LEG_LONG.d;
  const lip = 0.8;
  const ring: [number, number][] = [
    [edge - lip, outer - lip],
    [LEG_LONG.x + LEG_LONG.w, outer - lip],
    [LEG_LONG.x + LEG_LONG.w, outer],
    [edge, outer],
    [edge, LEG_SHORT.y + LEG_SHORT.d],
    [edge - lip, LEG_SHORT.y + LEG_SHORT.d],
  ];
  return prism(ring, COUNTER_HEIGHT, LIP_HEIGHT, { tone: 'hi' });
}

function printer(): Part {
  const body = rect(77.4, 30, 5.6, 7, 0.6);
  const slot = line(faceLine(body, 'left', 1, body.w - 1, 12.4), { tone: 'faint' });
  const tray = box(rect(77.4, 30.6, 3.4, 5.8, 0.3), 13.2, 0.4, { tone: 'lo', bevel: 0 });
  return stacked(box(body, COUNTER_HEIGHT, 3, { tone: 'mid', trim: slot + topOutline(body, 13, 0.9) }), [tray]);
}

const waitingChairs = (): Part[] =>
  Array.from({ length: CHAIR_COUNT }, (_, index) => chair([CHAIR_COLUMN_X, CHAIR_FIRST_Y + index * CHAIR_PITCH], 'front'));

function ticketDispenser(): Part {
  const [x, y] = TICKET_POST_AT;
  const head = rect(x - 2.4, y - 2.4, 4.8, 4.8, 0.8);
  return compose([
    post([x, y], 2.6, 0, 0.8, { tone: 'lo' }),
    post([x, y], 1.1, 0.8, 10.2, { tone: 'mid', steps: 10 }),
    box(head, 11, 5, { tone: 'mid', trim: topOutline(head, 16, 0.9) }),
  ]);
}
