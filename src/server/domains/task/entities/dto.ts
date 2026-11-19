export interface TaskSnapshot {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly createdAt: Date;
}

export interface TaskContent {
  readonly title: string;
  readonly description?: string | null;
}

export type TaskErrorCode =
  | 'TASK_NOT_FOUND'
  | 'TASK_TITLE_REQUIRED'
  | 'TASK_TITLE_TOO_LONG'
  | 'TASK_DESCRIPTION_TOO_LONG'
  | 'TASK_CURSOR_INVALID'
  | 'TASK_STORAGE_FULL';
