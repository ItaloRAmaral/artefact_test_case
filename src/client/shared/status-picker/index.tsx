'use client';

import { useId } from 'react';

import type { TaskStatus } from '@/shared/tasks/task-statuses';
import { TASK_STATUSES } from '@/shared/tasks/task-statuses';

import { TASK_STATUS_LABELS, toTaskStatus } from '@/client/shared/task-status';

// A segmented control: every status in sight and one click away, in the filter bar (with
// All) and in the form. Each radio lies invisible over its segment, so a click anywhere on
// the segment picks it and the arrow keys move between them (DECISIONS D-37).
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
      <div className="border-line bg-surface inline-flex h-10 max-w-full gap-1 rounded-lg border p-1">
        {options.map((option) => (
          <label
            key={option.value}
            data-status={option.value === '' ? undefined : option.value}
            className="text-ink-muted hover:text-ink has-focus-visible:outline-accent relative inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors has-checked:bg-[var(--status-tint,var(--color-canvas))] has-checked:text-[var(--status-ink,var(--color-ink))] has-focus-visible:outline-2 has-focus-visible:outline-offset-1"
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
