'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { SubmitEvent } from 'react';
import { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { z } from 'zod';

import { useTRPC } from '@/client/trpc/provider';
import type { TaskDto } from '@/server/adapters/controllers/task/dto';
import { createTaskInputSchema } from '@/shared/tasks/task-schemas';

import { getErrorMessage } from '@/client/shared/error-message';
import { useCloseModal } from '@/client/shared/modal';
import { useShowToast } from '@/client/shared/toast';

export function TaskForm({ task }: { task?: TaskDto }) {
  const { bfcacheId } = useRouter();

  // Cache Components keep a page's state after leaving it (React <Activity>); the key
  // changes on each visit through a link, so the form starts fresh, while the browser's
  // back button still restores a draft (DECISIONS D-29).
  return <TaskFormFields key={bfcacheId} task={task} />;
}

function TaskFormFields({ task }: { task: TaskDto | undefined }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const showToast = useShowToast();
  const closeModal = useCloseModal();
  const titleId = useId();
  const descriptionId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
  }>({});
  const create = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: async () => {
        await refreshList();
        leaveForm('Task created.');
      },
    }),
  );
  const update = useMutation(
    trpc.task.update.mutationOptions({
      onSuccess: async ({ id }) => {
        await Promise.all([
          refreshList(),
          queryClient.invalidateQueries(trpc.task.getById.queryFilter({ id })),
        ]);
        leaveForm('Task saved.');
      },
    }),
  );
  const save = task === undefined ? create : update;

  // The list may be off screen (the full page) or behind the modal, so only refetchType
  // 'all' surely refreshes it before the form closes; the mutation stays pending until
  // it is done.
  function refreshList() {
    return queryClient.invalidateQueries({
      ...trpc.task.list.pathFilter(),
      refetchType: 'all',
    });
  }

  // In a modal, the form closes by going back, so the list keeps its filters; the toast
  // waits for the dialog to close, since the page behind it is inert (DECISIONS D-35).
  function leaveForm(text: string) {
    if (closeModal === null) {
      showToast('success', text);
      router.push('/');

      return;
    }

    closeModal(() => {
      showToast('success', text);
    });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = createTaskInputSchema.safeParse({ title, description });

    if (!result.success) {
      const errors = z.flattenError(result.error).fieldErrors;

      // The message must be on the page before the focus moves, so a screen reader reads
      // the field with its error.
      flushSync(() => {
        setFieldErrors({
          title: errors.title?.[0],
          description: errors.description?.[0],
        });
      });
      (errors.title === undefined ? descriptionRef : titleRef).current?.focus();

      return;
    }

    setFieldErrors({});

    // Title and description follow the same rules on create and update; the server checks
    // the update input with its own strict schema.
    if (task === undefined) {
      create.mutate(result.data);
    } else {
      update.mutate({ id: task.id, ...result.data });
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor={titleId} className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          ref={titleRef}
          className="field"
          id={titleId}
          autoFocus
          value={title}
          aria-required
          aria-invalid={fieldErrors.title !== undefined}
          aria-describedby={
            fieldErrors.title === undefined ? undefined : `${titleId}-error`
          }
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
        {fieldErrors.title === undefined ? null : (
          <p id={`${titleId}-error`} className="text-error mt-1">
            {fieldErrors.title}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor={descriptionId}
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>
        <textarea
          ref={descriptionRef}
          className="field min-h-28"
          id={descriptionId}
          value={description}
          aria-invalid={fieldErrors.description !== undefined}
          aria-describedby={
            fieldErrors.description === undefined
              ? undefined
              : `${descriptionId}-error`
          }
          onChange={(event) => {
            setDescription(event.target.value);
          }}
        />
        {fieldErrors.description === undefined ? null : (
          <p id={`${descriptionId}-error`} className="text-error mt-1">
            {fieldErrors.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="button button-primary"
          disabled={save.isPending || save.isSuccess}
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
        {/* The save error sits in the form, where it stays visible inside a modal too
            (D-35). The region stays on the page, empty, so a screen reader announces it. */}
        <p role="alert" className="text-error">
          {save.isError ? getErrorMessage(save.error) : null}
        </p>
      </div>
    </form>
  );
}
