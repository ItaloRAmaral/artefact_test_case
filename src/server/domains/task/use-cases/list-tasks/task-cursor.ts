import { TaskCursorInvalidError } from '@/server/domains/task/entities/errors';
import type { TaskPosition } from '@/server/domains/task/repositories/dto';

// The cursor is the position of the last task of a page (createdAt and id), not
// the id alone, so it still works after that task is deleted (DECISIONS D-21).
const SEPARATOR = '|';

export function encodeTaskCursor(position: TaskPosition): string {
  return btoa(`${position.createdAt.toISOString()}${SEPARATOR}${position.id}`);
}

export function decodeTaskCursor(cursor: string): TaskPosition {
  let decoded: string;

  try {
    decoded = atob(cursor);
  } catch {
    throw new TaskCursorInvalidError();
  }

  const separatorIndex = decoded.indexOf(SEPARATOR);
  const createdAt = new Date(decoded.slice(0, separatorIndex));
  const id = decoded.slice(separatorIndex + 1);

  if (
    separatorIndex === -1 ||
    id === '' ||
    id.includes(SEPARATOR) ||
    Number.isNaN(createdAt.getTime())
  ) {
    throw new TaskCursorInvalidError();
  }

  return { createdAt, id };
}
