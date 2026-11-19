export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 1000;

export const TASK_PAGE_SIZE_DEFAULT = 10;
export const TASK_PAGE_SIZE_MAX = 50;

// Derived from formats decided elsewhere (DECISIONS D-20, D-21), not picked:
// a UUID v4 string has 36 characters; a cursor is the base64 of
// `<24-character ISO date>|<36-character id>` (61 bytes), which is 84 characters.
export const TASK_ID_MAX_LENGTH = 36;
export const TASK_CURSOR_MAX_LENGTH = 84;
