'use client';

import { useQuery } from '@tanstack/react-query';

import { useTRPC } from '@/client/trpc/provider';

import {
  getErrorMessage,
  isTemporaryError,
} from '@/client/shared/error-message';
import { TaskForm } from '@/client/shared/task-form';

/**
 * Loads a task and renders its edit form.
 *
 * @param props.id - The task id.
 * @returns The form, or the loading or error state.
 */
export function EditTask({ id }: { id: string }) {
  const trpc = useTRPC();
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
