import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '@playwright/test';

async function createTask(request: APIRequestContext, title: string) {
  await request.post('/api/trpc/task.create', { data: { title } });
}

test('renders a task in the server HTML', async ({ request }) => {
  const title = `SSR task ${String(Date.now())}`;
  await createTask(request, title);

  const response = await request.get('/');

  expect(await response.text()).toContain(title);
});

test('does not request task.list on first load', async ({ page }) => {
  const listRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/trpc/task.list')) {
      listRequests.push(request.url());
    }
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(listRequests).toEqual([]);
});

test('loads without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(errors).toEqual([]);
});

test('deletes a task from the list with feedback', async ({
  page,
  request,
}) => {
  const title = `Delete task ${String(Date.now())}`;
  await createTask(request, title);
  await page.goto('/');

  await page.getByRole('button', { name: `Delete ${title}` }).click();

  await expect(page.getByRole('status')).toHaveText('Task deleted.');
  await expect(page.getByRole('heading', { name: title })).toHaveCount(0);
});
