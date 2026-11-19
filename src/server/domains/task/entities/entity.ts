import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} from '@/shared/tasks/task-limits';

import {
  TaskDescriptionTooLongError,
  TaskTitleRequiredError,
  TaskTitleTooLongError,
} from './errors';
import type { TaskContent, TaskSnapshot } from './dto';

export class Task {
  private state: TaskSnapshot;

  private constructor(snapshot: TaskSnapshot) {
    this.state = { ...snapshot, createdAt: new Date(snapshot.createdAt) };
  }

  static create(
    props: TaskContent & Pick<TaskSnapshot, 'id' | 'createdAt'>,
  ): Task {
    const content = Task.normalizeContent(props.title, props.description);

    return new Task({ id: props.id, createdAt: props.createdAt, ...content });
  }

  static restore(snapshot: TaskSnapshot): Task {
    return new Task(snapshot);
  }

  edit(changes: TaskContent): void {
    const content = Task.normalizeContent(changes.title, changes.description);

    this.state = { ...this.state, ...content };
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

  get createdAt(): Date {
    return new Date(this.state.createdAt);
  }

  toSnapshot(): TaskSnapshot {
    return { ...this.state, createdAt: new Date(this.state.createdAt) };
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
