import type { APIResponse } from '@playwright/test';

/**
 * Reads the task id from a tRPC response.
 *
 * @param response - The HTTP response of a task procedure.
 * @returns The task id.
 */
export async function readTaskId(response: APIResponse): Promise<string> {
  const body = (await response.json()) as { result: { data: { id: string } } };

  return body.result.data.id;
}
