import type { Plan } from '../../../iso/iso-kit.ts';
import { shelfUnit } from '../equipment.ts';
import { line } from '../camera.ts';
import { anchorMonitor, chair, counter, keyboard, monitor } from '../furniture.ts';
import type { Screen } from '../furniture.ts';
import { asDevice, box, faceDots, faceLine, faceRect, floorMark, markup, rect, stacked } from '../parts.ts';
import type { Part } from '../parts.ts';
import { gantry, injector, patientTable } from './imagingScanner.ts';

const DESK = rect(-111.5, 30, 16, 9, 0.6);
const DESK_HEIGHT = 7.5;
const WORKSTATION_XS = [-107.5, -99.5];
const MONITOR_Y = 32.5;
const ANCHOR_WORKSTATION = 1;
export const PACS_SCREEN: Screen = { centre: [WORKSTATION_XS[ANCHOR_WORKSTATION]!, MONITOR_Y], z: DESK_HEIGHT, face: 'left' };
const KEYBOARD_Y = 35.4;
const KEYBOARD_SIZE = { width: 6.4, depth: 3.4 };
const CHAIR_AT = [-103.5, 43.2] as const;
const CABINET = rect(-92.5, 29.5, 6, 5, 0.5);
const CABINET_HEIGHT = 12;
const HALF_WALL = rect(-114.5, 52, 31, 2.5, 0);
const BENCH = rect(-70, 79, 14, 5, 0.6);
const BENCH_HEIGHT = 4.5;
const APRON_RACK_AT = [-80, 28.5] as const;
const APRON_COUNT = 3;
const APRON = { width: 3.6, thickness: 1, height: 9, pitch: 4.8 };
const WINDOW = { from: 8, to: 26, bottom: 1.8, top: 5.8, frame: 0.8 };

const CLEARANCE_ZONE = rect(-146, 47, 29, 40, 3);

export const imagingParts = (): Part[] => [floorMark(CLEARANCE_ZONE), asDevice(gantry()), patientTable(), injector(), apronRack(), patientBench(), ...controlBay()];

function controlBay(): Part[] {
  return [workstation(), chair([...CHAIR_AT], 'right'), cabinet(), bayWindow()];
}

function workstation(): Part {
  const { width, depth } = KEYBOARD_SIZE;
  const screens = WORKSTATION_XS.map((x, index) =>
    index === ANCHOR_WORKSTATION ? anchorMonitor(PACS_SCREEN) : asDevice(monitor([x, MONITOR_Y], DESK_HEIGHT)),
  );
  const keyboards = WORKSTATION_XS.map((x) => asDevice(keyboard([x - width / 2, KEYBOARD_Y], DESK_HEIGHT, depth, width)));
  return stacked(counter(DESK, DESK_HEIGHT), [...screens, ...keyboards]);
}

function cabinet(): Part {
  const door = line(faceRect(CABINET, 'left', 0.7, CABINET.w - 0.7, 0.7, CABINET_HEIGHT - 0.7), { tone: 'lo' });
  const vents = faceDots(CABINET, 'left', 1.2, 7.5, 3, 3, 1.2);
  return box(CABINET, 0, CABINET_HEIGHT, { tone: 'mid', trim: door + vents });
}

function bayWindow(): Part {
  const { from, to, bottom, top, frame } = WINDOW;
  const glint = (start: number) => faceLine(HALF_WALL, 'left', start, start + 3.5, bottom + frame, top - frame);
  const svg =
    line(faceRect(HALF_WALL, 'left', from, to, bottom, top), { tone: 'lo' }) +
    line(faceRect(HALF_WALL, 'left', from + frame, to - frame, bottom + frame, top - frame), { tone: 'faint' }) +
    line(glint(from + 3.5) + glint(from + 6.5), { tone: 'faint' });
  return markup(svg, [HALF_WALL.x, HALF_WALL.y + HALF_WALL.d, 0]);
}

function apronRack(): Part {
  const aprons = (board: Plan, level: number, index: number): Part[] =>
    index > 0
      ? []
      : Array.from({ length: APRON_COUNT }, (_, apron) =>
          box(rect(board.x + 0.8 + apron * APRON.pitch, board.y + 1, APRON.width, APRON.thickness, 0.3), level, APRON.height, { tone: 'lo', bevel: 0.2 }),
        );
  return shelfUnit([...APRON_RACK_AT], 16, 4, 'left', [4, 15], aprons);
}

const patientBench = (): Part => counter(BENCH, BENCH_HEIGHT);
