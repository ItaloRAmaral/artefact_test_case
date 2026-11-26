import type { APIRequestContext } from '@playwright/test';

/**
 * Creates a task through the tRPC API.
 *
 * @param request - The Playwright request context.
 * @param task - The title and, optionally, the status.
 * @returns The id of the new task.
 */
export async function createTask(
  request: APIRequestContext,
  task: { title: string; status?: 'todo' | 'doing' | 'done' },
): Promise<string> {
  const response = await request.post('/api/trpc/task.create', { data: task });

  if (!response.ok()) {
    throw new Error(`task.create answered ${String(response.status())}`);
  }

  const body = (await response.json()) as { result: { data: { id: string } } };

  return body.result.data.id;
}
