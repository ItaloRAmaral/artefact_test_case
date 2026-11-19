import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  TaskCursorInvalidError,
  TaskDescriptionTooLongError,
  TaskNotFoundError,
  TaskStorageFullError,
  TaskTitleRequiredError,
  TaskTitleTooLongError,
} from '@/server/domains/task/entities/errors';
import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { createTasksModule } from '@/server/tasks-module';

import { createCallerFactory, createTrpcRouter, publicProcedure } from './init';

const makeContext = () => ({
  tasks: createTasksModule(new InMemoryTaskRepository()),
});

describe('tRPC base', () => {
  it.each([
    { error: new TaskNotFoundError(), code: 'NOT_FOUND' },
    { error: new TaskTitleRequiredError(), code: 'BAD_REQUEST' },
    { error: new TaskTitleTooLongError(), code: 'BAD_REQUEST' },
    { error: new TaskDescriptionTooLongError(), code: 'BAD_REQUEST' },
    { error: new TaskCursorInvalidError(), code: 'BAD_REQUEST' },
    { error: new TaskStorageFullError(), code: 'CONFLICT' },
  ])('maps $error.code to $code', async ({ error, code }) => {
    const router = createTrpcRouter({
      fail: publicProcedure.query(() => {
        throw error;
      }),
    });
    const caller = createCallerFactory(router)(makeContext());

    const promise = caller.fail();

    await expect(promise).rejects.toMatchObject({
      code,
      cause: { code: error.code },
    });
  });

  it('sends the tRPC code and the domain code of a domain error', async () => {
    const router = createTrpcRouter({
      fail: publicProcedure.query(() => {
        throw new TaskNotFoundError();
      }),
    });

    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: new Request('http://localhost/api/trpc/fail'),
      router,
      createContext: makeContext,
    });

    const body: unknown = await response.json();
    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      error: {
        data: {
          code: 'NOT_FOUND',
          httpStatus: 404,
          path: 'fail',
          domainCode: 'TASK_NOT_FOUND',
          fieldErrors: null,
        },
      },
    });
    expect(body).not.toHaveProperty('error.data.stack');
  });

  it('sends the field errors of an invalid input', async () => {
    const router = createTrpcRouter({
      fail: publicProcedure
        .input(z.strictObject({ title: z.string().min(1) }))
        .query(({ input }) => input.title),
    });

    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: new Request(
        `http://localhost/api/trpc/fail?input=${encodeURIComponent('{"title":""}')}`,
      ),
      router,
      createContext: makeContext,
    });

    const body: unknown = await response.json();
    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      error: {
        data: {
          domainCode: null,
          fieldErrors: { title: [expect.any(String)] },
        },
      },
    });
  });

  it('hides the message and stack of an unexpected error', async () => {
    const router = createTrpcRouter({
      fail: publicProcedure.query(() => {
        throw new Error('secret detail');
      }),
    });

    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: new Request('http://localhost/api/trpc/fail'),
      router,
      createContext: makeContext,
    });

    const body: unknown = await response.json();
    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: {
        message: 'Internal server error',
        data: {
          code: 'INTERNAL_SERVER_ERROR',
          httpStatus: 500,
          path: 'fail',
          domainCode: null,
          fieldErrors: null,
        },
      },
    });
    expect(body).not.toHaveProperty('error.data.stack');
  });
});
