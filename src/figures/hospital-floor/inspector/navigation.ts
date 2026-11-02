// Moving between the eight files in reading order, which is the order of the rooms: next and previous wrap around, and the arrow keys map to the two steps.

const KEY_STEPS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1 };

export const stepOfKey = (key: string): number | undefined => KEY_STEPS[key];

export const neighbourIndex = (index: number, step: number, count: number): number => (((index + step) % count) + count) % count;
