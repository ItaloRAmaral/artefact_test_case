import type { TaskErrorCode } from './dto';

export abstract class DomainError extends Error {
  abstract readonly code: TaskErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class TaskNotFoundError extends DomainError {
  override readonly code = 'TASK_NOT_FOUND';

  constructor() {
    super('Task not found');
  }
}

export class TaskTitleRequiredError extends DomainError {
  override readonly code = 'TASK_TITLE_REQUIRED';

  constructor() {
    super('Task title is required');
  }
}

export class TaskTitleTooLongError extends DomainError {
  override readonly code = 'TASK_TITLE_TOO_LONG';

  constructor() {
    super('Task title is too long');
  }
}

export class TaskDescriptionTooLongError extends DomainError {
  override readonly code = 'TASK_DESCRIPTION_TOO_LONG';

  constructor() {
    super('Task description is too long');
  }
}

export class TaskStatusInvalidError extends DomainError {
  override readonly code = 'TASK_STATUS_INVALID';

  constructor() {
    super('Task status is invalid');
  }
}

export class TaskCursorInvalidError extends DomainError {
  override readonly code = 'TASK_CURSOR_INVALID';

  constructor() {
    super('Task cursor is invalid');
  }
}

export class TaskStorageFullError extends DomainError {
  override readonly code = 'TASK_STORAGE_FULL';

  constructor() {
    super('Task storage is full');
  }
}
