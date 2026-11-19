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
