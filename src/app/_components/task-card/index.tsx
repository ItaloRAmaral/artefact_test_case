'use client';

import Link from 'next/link';

import type { TaskDto } from '@/server/adapters/controllers/task/dto';
import type { TaskStatus } from '@/shared/tasks/task-statuses';
import { TASK_STATUSES } from '@/shared/tasks/task-statuses';

import { CalendarIcon, PencilIcon, TrashIcon } from '@/client/shared/icons';
import { TASK_STATUS_LABELS, toTaskStatus } from '@/client/shared/task-status';
import { TaskDate } from '../task-date';

/**
 * Renders a task as a card tinted by its status, with its status pill, Edit and Delete.
 *
 * @param props.task - The task.
 * @param props.status - The status to show, which may be one still being saved.
 * @param props.isChangingStatus - Whether a status change is being saved; the pill ignores changes meanwhile.
 * @param props.onStatusChange - Called with the status chosen in the pill.
 * @param props.isDeleting - Whether a delete is in progress; Delete is disabled meanwhile.
 * @param props.onDelete - Called when Delete is pressed.
 * @returns The card.
 */
export function TaskCard({
  task,
  status,
  isChangingStatus,
  onStatusChange,
  isDeleting,
  onDelete,
}: {
  task: TaskDto;
  status: TaskStatus;
  isChangingStatus: boolean;
  onStatusChange: (status: TaskStatus) => void;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <li
      data-status={status}
      className="border-line rounded-xl border border-l-4 border-l-(--status) bg-(--status-tint) py-4 pr-3 pl-5 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          className={`pt-0.5 text-[1.0625rem] leading-snug font-semibold break-words ${status === 'done' ? 'text-ink-muted' : ''}`}
        >
          {task.title}
        </h2>
        <span className="border-line bg-surface has-focus-visible:outline-accent relative inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1 pr-2 pl-2.5 text-xs font-semibold text-(--status-ink) has-aria-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2">
          <span aria-hidden className="size-2 rounded-full bg-(--status)" />
          <span
            aria-hidden
            className="block [text-box:trim-both_cap_alphabetic]"
          >
            {TASK_STATUS_LABELS[status]}
          </span>
          <svg
            aria-hidden
            viewBox="0 0 12 12"
            className="size-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 4.5 6 7.5 9 4.5" />
          </svg>
          <select
            aria-label={`Status of ${task.title}`}
            className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0 aria-disabled:cursor-not-allowed"
            value={status}
            aria-disabled={isChangingStatus}
            onChange={(event) => {
              const chosen = toTaskStatus(event.target.value);

              if (!isChangingStatus && chosen !== undefined) {
                onStatusChange(chosen);
              }
            }}
          >
            {TASK_STATUSES.map((option) => (
              <option key={option} value={option}>
                {TASK_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </span>
      </div>
      {task.description === null ? null : (
        <p className="text-ink-muted mt-1 pr-2 text-sm break-words whitespace-pre-line">
          {task.description}
        </p>
      )}
      <div className="mt-1.5 -mb-2 flex items-center justify-between gap-3">
        <span className="text-ink-muted inline-flex items-center gap-1.5 text-xs">
          <CalendarIcon className="size-3.5" />
          <TaskDate iso={task.createdAt} />
        </span>
        <div className="flex gap-0.5">
          <Link
            href={`/tasks/${task.id}/edit`}
            aria-label={`Edit ${task.title}`}
            title="Edit"
            className="icon-button"
          >
            <PencilIcon />
          </Link>
          <button
            type="button"
            className="icon-button hover:bg-danger/10 hover:text-danger"
            aria-label={`Delete ${task.title}`}
            title="Delete"
            disabled={isDeleting}
            onClick={onDelete}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </li>
  );
}
