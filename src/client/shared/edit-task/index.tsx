'use client';

import { useQuery } from '@tanstack/react-query';

import { useTRPC } from '@/client/trpc/provider';

import {
  getErrorMessage,
  isTemporaryError,
} from '@/client/shared/error-message';
import { TaskForm } from '@/client/shared/task-form';

export function EditTask({ id }: { id: string }) {
  const trpc = useTRPC();
  // No retries: a missing task shows its message at once instead of after three
  // retries, about 7 seconds (DECISIONS D-29).
  const task = useQuery(
    trpc.task.getById.queryOptions({ id }, { retry: false }),
  );

  if (task.isPending) {
    return <p className="text-muted">Loading task…</p>;
  }

  if (task.isLoadingError) {
    return (
      <>
        <p role="alert" className="text-error">
          {getErrorMessage(task.error)}
        </p>
        {isTemporaryError(task.error) ? (
          <button
            type="button"
            className="button button-secondary mt-3"
            onClick={() => {
              void task.refetch();
            }}
          >
            Retry
          </button>
        ) : null}
      </>
    );
  }

  return <TaskForm task={task.data} />;
}
