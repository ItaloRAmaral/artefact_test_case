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
        goBackToList('Task created.');
      },
      onError: showError,
    }),
  );
  const update = useMutation(
    trpc.task.update.mutationOptions({
      onSuccess: async ({ id }) => {
        await Promise.all([
          refreshList(),
          queryClient.invalidateQueries(trpc.task.getById.queryFilter({ id })),
        ]);
        goBackToList('Task saved.');
      },
      onError: showError,
    }),
  );
  const save = task === undefined ? create : update;

  // The list is not on screen here, so only refetchType 'all' refreshes it before the
  // navigation; the mutation stays pending until it is done.
  function refreshList() {
    return queryClient.invalidateQueries({
      ...trpc.task.list.pathFilter(),
      refetchType: 'all',
    });
  }

  function goBackToList(text: string) {
    showToast('success', text);
    router.push('/');
  }

  function showError(error: Parameters<typeof getErrorMessage>[0]) {
    showToast('error', getErrorMessage(error));
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
    <form noValidate onSubmit={handleSubmit}>
      <label htmlFor={titleId}>Title</label>
      <input
        ref={titleRef}
        id={titleId}
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
        <p id={`${titleId}-error`}>{fieldErrors.title}</p>
      )}
      <label htmlFor={descriptionId}>Description</label>
      <textarea
        ref={descriptionRef}
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
        <p id={`${descriptionId}-error`}>{fieldErrors.description}</p>
      )}
      <button type="submit" disabled={save.isPending || save.isSuccess}>
        {save.isPending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
