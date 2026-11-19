import 'server-only';

import { initTRPC, TRPCError } from '@trpc/server';
import { z, ZodError } from 'zod';

import type { TaskErrorCode } from '@/server/domains/task/entities/dto';
import { DomainError } from '@/server/domains/task/entities/errors';

import type { TrpcContext } from './dto';

// Domain errors know no transport, so their tRPC code is chosen here, once (DECISIONS D-07, D-25).
const TRPC_CODE_BY_DOMAIN_CODE: Record<TaskErrorCode, TRPCError['code']> = {
  TASK_NOT_FOUND: 'NOT_FOUND',
  TASK_TITLE_REQUIRED: 'BAD_REQUEST',
  TASK_TITLE_TOO_LONG: 'BAD_REQUEST',
  TASK_DESCRIPTION_TOO_LONG: 'BAD_REQUEST',
  TASK_CURSOR_INVALID: 'BAD_REQUEST',
  TASK_STORAGE_FULL: 'CONFLICT',
};

const t = initTRPC.context<TrpcContext>().create({
  errorFormatter({ shape, error }) {
    const isUnexpected = error.code === 'INTERNAL_SERVER_ERROR';

    return {
      ...shape,
      message: isUnexpected ? 'Internal server error' : shape.message,
      data: {
        code: shape.data.code,
        httpStatus: shape.data.httpStatus,
        path: shape.data.path,
        domainCode:
          error.cause instanceof DomainError ? error.cause.code : null,
        fieldErrors:
          error.cause instanceof ZodError
            ? z.flattenError(error.cause).fieldErrors
            : null,
      },
    };
  },
});

const translateDomainErrors = t.middleware(async ({ next }) => {
  const result = await next();

  if (!result.ok && result.error.cause instanceof DomainError) {
    const cause = result.error.cause;

    throw new TRPCError({
      code: TRPC_CODE_BY_DOMAIN_CODE[cause.code],
      message: cause.message,
      cause,
    });
  }

  return result;
});

export const createTrpcRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure.use(translateDomainErrors);
