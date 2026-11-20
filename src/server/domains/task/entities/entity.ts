import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} from '@/shared/tasks/task-limits';
import type { TaskStatus } from '@/shared/tasks/task-statuses';
import {
  TASK_STATUS_DEFAULT,
  TASK_STATUSES,
} from '@/shared/tasks/task-statuses';

import type { TaskContent, TaskSnapshot } from './dto';
import {
  TaskDescriptionTooLongError,
  TaskStatusInvalidError,
  TaskTitleRequiredError,
  TaskTitleTooLongError,
} from './errors';

export class Task {
  private state: TaskSnapshot;

  private constructor(snapshot: TaskSnapshot) {
    this.state = { ...snapshot, createdAt: new Date(snapshot.createdAt) };
  }

  static create(
    props: TaskContent &
      Partial<Pick<TaskSnapshot, 'status'>> &
      Pick<TaskSnapshot, 'id' | 'createdAt'>,
  ): Task {
    const content = Task.normalizeContent(props.title, props.description);
    const status = props.status ?? TASK_STATUS_DEFAULT;

    Task.ensureStatus(status);

    return new Task({
      id: props.id,
      createdAt: props.createdAt,
      status,
      ...content,
    });
  }

  static restore(snapshot: TaskSnapshot): Task {
    return new Task(snapshot);
  }

  edit(changes: TaskContent): void {
    const content = Task.normalizeContent(changes.title, changes.description);

    this.state = { ...this.state, ...content };
  }

  changeStatus(status: TaskStatus): void {
    Task.ensureStatus(status);

    this.state = { ...this.state, status };
  }

  get id(): string {
    return this.state.id;
  }

  get title(): string {
    return this.state.title;
  }

  get description(): string | null {
    return this.state.description;
  }

  get status(): TaskStatus {
    return this.state.status;
  }

  get createdAt(): Date {
    return new Date(this.state.createdAt);
  }

  toSnapshot(): TaskSnapshot {
    return { ...this.state, createdAt: new Date(this.state.createdAt) };
  }

  // The schema already limits the status at the edge; the entity checks again so no task
  // holds another value, whatever the caller (DECISIONS D-06, D-36).
  private static ensureStatus(status: TaskStatus): void {
    if (!TASK_STATUSES.includes(status)) {
      throw new TaskStatusInvalidError();
    }
  }

  private static normalizeContent(
    title: string,
    description: string | null | undefined,
  ): Pick<TaskSnapshot, 'title' | 'description'> {
    const trimmedTitle = title.trim();

    if (trimmedTitle === '') {
      throw new TaskTitleRequiredError();
    }

    if (trimmedTitle.length > TASK_TITLE_MAX_LENGTH) {
      throw new TaskTitleTooLongError();
    }

    const trimmedDescription = description?.trim() ?? '';

    if (trimmedDescription.length > TASK_DESCRIPTION_MAX_LENGTH) {
      throw new TaskDescriptionTooLongError();
    }

    return {
      title: trimmedTitle,
      description: trimmedDescription === '' ? null : trimmedDescription,
    };
  }
}
