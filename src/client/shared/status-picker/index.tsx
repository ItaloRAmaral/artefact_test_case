'use client';

import { useId } from 'react';

import type { TaskStatus } from '@/shared/tasks/task-statuses';
import { TASK_STATUSES } from '@/shared/tasks/task-statuses';

import { TASK_STATUS_LABELS, toTaskStatus } from '@/client/shared/task-status';

/**
 * Renders the task statuses as a segmented control.
 *
 * @param props.value - The checked status, or `undefined` for All.
 * @param props.onChange - Called with the chosen status, or `undefined` for All.
 * @param props.allLabel - The label of an All option, shown first; no All when absent.
 * @returns The radio group.
 */
export function StatusPicker({
  value,
  onChange,
  allLabel,
}: {
  value: TaskStatus | undefined;
  onChange: (status: TaskStatus | undefined) => void;
  allLabel?: string;
}) {
  const name = useId();
  const options = [
    ...(allLabel === undefined ? [] : [{ value: '', label: allLabel }]),
    ...TASK_STATUSES.map((status) => ({
      value: status,
      label: TASK_STATUS_LABELS[status],
    })),
  ];

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">Status</legend>
      <div className="border-line bg-surface inline-flex h-10 max-w-full gap-0.5 rounded-lg border p-1 sm:gap-1">
        {options.map((option) => (
          <label
            key={option.value}
            data-status={option.value === '' ? undefined : option.value}
            className="text-ink-muted hover:text-ink has-focus-visible:outline-accent relative inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-colors has-checked:bg-[var(--status-tint,var(--color-canvas))] has-checked:text-[var(--status-ink,var(--color-ink))] has-focus-visible:outline-2 has-focus-visible:outline-offset-1 sm:px-3"
          >
            {option.value === '' ? null : (
              <span aria-hidden className="size-2 rounded-full bg-(--status)" />
            )}
            {option.label}
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={(value ?? '') === option.value}
              className="absolute inset-0 cursor-pointer appearance-none opacity-0"
              onChange={() => {
                onChange(toTaskStatus(option.value));
              }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
