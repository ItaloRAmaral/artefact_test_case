import { expect, test } from '@playwright/test';

test('creates a task through the API', async ({ request }) => {
  const title = `API task ${String(Date.now())}`;

  const created = await request.post('/api/trpc/task.create', {
    data: { title },
  });

  expect(created.status()).toBe(200);
  expect(await created.json()).toMatchObject({ result: { data: { title } } });
});

test('reads a created task back through the API', async ({ request }) => {
  const title = `API task ${String(Date.now())}`;
  const created = await request.post('/api/trpc/task.create', {
    data: { title },
  });
  // The success shape of a tRPC call over HTTP; creation itself is checked by the test above.
  const createdBody = (await created.json()) as {
    result: { data: { id: string } };
  };

  const fetched = await request.get(
    `/api/trpc/task.getById?input=${encodeURIComponent(JSON.stringify({ id: createdBody.result.data.id }))}`,
  );

  expect(fetched.status()).toBe(200);
  expect(await fetched.json()).toMatchObject({ result: { data: { title } } });
});

test('returns NOT_FOUND for a missing task after a page has rendered', async ({
  request,
}) => {
  await request.get('/');

  const response = await request.get(
    `/api/trpc/task.getById?input=${encodeURIComponent(JSON.stringify({ id: 'missing-task' }))}`,
  );

  expect(response.status()).toBe(404);
  expect(await response.json()).toMatchObject({
    error: { data: { code: 'NOT_FOUND', domainCode: 'TASK_NOT_FOUND' } },
  });
});
