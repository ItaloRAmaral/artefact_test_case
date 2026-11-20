import type { TaskErrorCode } from '@/server/domains/task/entities/dto';
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} from '@/shared/tasks/task-limits';

const MESSAGE_BY_DOMAIN_CODE: Record<TaskErrorCode, string> = {
  TASK_NOT_FOUND: 'This task no longer exists.',
  TASK_TITLE_REQUIRED: 'Title is required.',
  TASK_TITLE_TOO_LONG: `Title must be at most ${String(TASK_TITLE_MAX_LENGTH)} characters.`,
  TASK_DESCRIPTION_TOO_LONG: `Description must be at most ${String(TASK_DESCRIPTION_MAX_LENGTH)} characters.`,
  TASK_STATUS_INVALID: 'Choose a valid status.',
  TASK_CURSOR_INVALID: 'The list could not be loaded. Reload the page.',
  TASK_STORAGE_FULL: 'The task list is full. Delete a task to add a new one.',
};

const INVALID_FIELDS_MESSAGE = 'Some fields are invalid.';

const GENERIC_MESSAGE =
  'Something went wrong. Check your connection and try again.';

type ClientError =
  | {
      readonly data?: {
        readonly code?: string;
        readonly domainCode?: string | null;
      } | null;
    }
  | null
  | undefined;

/**
 * Gets the text to show for a failed call.
 *
 * @param error - The tRPC client error.
 * @returns The message for its error code.
 */
export function getErrorMessage(error: ClientError): string {
  const domainCode = error?.data?.domainCode;

  if (isTaskErrorCode(domainCode)) {
    return MESSAGE_BY_DOMAIN_CODE[domainCode];
  }

  if (error?.data?.code === 'BAD_REQUEST') {
    return INVALID_FIELDS_MESSAGE;
  }

  return GENERIC_MESSAGE;
}

/**
 * Tells whether a failed call may succeed on a new try.
 *
 * @param error - The tRPC client error.
 * @returns `true` for a network failure or a server error.
 */
export function isTemporaryError(error: ClientError): boolean {
  const code = error?.data?.code;

  return code === undefined || code === 'INTERNAL_SERVER_ERROR';
}

function isTaskErrorCode(
  code: string | null | undefined,
): code is TaskErrorCode {
  return (
    typeof code === 'string' && Object.hasOwn(MESSAGE_BY_DOMAIN_CODE, code)
  );
}
