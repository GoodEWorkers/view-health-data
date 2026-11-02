// The phone breakpoint the live scripts share; the stylesheets repeat it as 720px.

export const PHONE_QUERY = '(max-width: 720px)';
export const COARSE_QUERY = '(pointer: coarse)';

export const isPhone = (): boolean => matchMedia(PHONE_QUERY).matches;

export const isTouchPhone = (): boolean => matchMedia(`${PHONE_QUERY} and ${COARSE_QUERY}`).matches;
