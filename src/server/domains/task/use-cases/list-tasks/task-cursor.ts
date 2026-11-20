import { TaskCursorInvalidError } from '@/server/domains/task/entities/errors';
import type { TaskPosition } from '@/server/domains/task/repositories/dto';

const SEPARATOR = '|';

/**
 * Encodes a list position as a cursor.
 *
 * @param position - The createdAt and id of the last task of a page.
 * @returns The cursor string.
 */
export function encodeTaskCursor(position: TaskPosition): string {
  return btoa(`${position.createdAt.toISOString()}${SEPARATOR}${position.id}`);
}

/**
 * Decodes a cursor into a list position.
 *
 * @param cursor - The cursor string.
 * @returns The position. Throws `TaskCursorInvalidError` when the cursor cannot be read.
 */
export function decodeTaskCursor(cursor: string): TaskPosition {
  const decoded = decodeBase64(cursor);
  const separatorIndex = decoded.indexOf(SEPARATOR);

  if (separatorIndex === -1) {
    throw new TaskCursorInvalidError();
  }

  const createdAt = new Date(decoded.slice(0, separatorIndex));
  const id = decoded.slice(separatorIndex + 1);

  if (
    id === '' ||
    id.includes(SEPARATOR) ||
    Number.isNaN(createdAt.getTime())
  ) {
    throw new TaskCursorInvalidError();
  }

  return { createdAt, id };
}

function decodeBase64(cursor: string): string {
  try {
    return atob(cursor);
  } catch {
    throw new TaskCursorInvalidError();
  }
}
