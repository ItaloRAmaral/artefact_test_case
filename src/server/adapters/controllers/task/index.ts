import 'server-only';

import { createTrpcRouter, publicProcedure } from '@/server/adapters/trpc/init';
import {
  createTaskInputSchema,
  listTasksInputSchema,
  taskIdInputSchema,
  updateTaskInputSchema,
} from '@/shared/tasks/task-schemas';

import { toTaskDto } from './to-task-dto';

export const taskRouter = createTrpcRouter({
  list: publicProcedure
    .input(listTasksInputSchema)
    .query(async ({ ctx, input }) => {
      const page = await ctx.tasks.listTasks.execute({
        cursor: input.cursor ?? null,
        limit: input.limit,
        titleContains: input.titleContains ?? null,
        createdFrom:
          input.createdFrom === undefined ? null : new Date(input.createdFrom),
        createdBefore:
          input.createdBefore === undefined
            ? null
            : new Date(input.createdBefore),
      });

      return {
        items: page.items.map(toTaskDto),
        nextCursor: page.nextCursor,
      };
    }),

  getById: publicProcedure
    .input(taskIdInputSchema)
    .query(async ({ ctx, input }) => {
      const task = await ctx.tasks.getTask.execute(input);

      return toTaskDto(task);
    }),

  create: publicProcedure
    .input(createTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.tasks.createTask.execute(input);

      return toTaskDto(task);
    }),

  update: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.tasks.updateTask.execute(input);

      return toTaskDto(task);
    }),

  delete: publicProcedure
    .input(taskIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.tasks.deleteTask.execute(input);

      return { id: input.id };
    }),
});
