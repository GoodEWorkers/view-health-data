// True when a key press is going into a text field, so single-key shortcuts (1 to 4, g) must leave it alone.

const TEXT_ENTRY = 'input, textarea, select, [contenteditable]';

export const isTyping = (target: EventTarget | null): boolean => target instanceof Element && target.closest(TEXT_ENTRY) !== null;
