import { TRPCError } from '@trpc/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { handleTrpcRequest, logUnexpectedError } from './handler';

describe('tRPC handler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves a procedure call', async () => {
    const request = new Request(
      `http://localhost/api/trpc/task.list?input=${encodeURIComponent('{}')}`,
    );

    const response = await handleTrpcRequest(request);

    expect(response.status).toBe(200);
  });

  it('rejects a batched request', async () => {
    const request = new Request(
      `http://localhost/api/trpc/task.list,task.list?batch=1&input=${encodeURIComponent('{"0":{},"1":{}}')}`,
    );

    const response = await handleTrpcRequest(request);

    expect(response.status).toBe(400);
  });

  it('logs an unexpected error', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const error = new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      cause: new Error('secret detail'),
    });

    logUnexpectedError({ error });

    expect(consoleError).toHaveBeenCalledExactlyOnceWith(error);
  });

  it('does not log an expected error', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    logUnexpectedError({ error: new TRPCError({ code: 'NOT_FOUND' }) });

    expect(consoleError).not.toHaveBeenCalled();
  });
});
