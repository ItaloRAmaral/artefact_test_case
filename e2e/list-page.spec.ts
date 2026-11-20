import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Ten tasks are taller than 400 px plus the list's 200 px load-ahead margin, so
// the first page fills the screen: the first load requests no other page, and loading
// more takes a scroll (DECISIONS D-31).
test.use({ viewport: { width: 1280, height: 400 } });

async function createTask(request: APIRequestContext, title: string) {
  await request.post('/api/trpc/task.create', { data: { title } });
}

async function createTasks(
  request: APIRequestContext,
  prefix: string,
  count: number,
) {
  for (let n = 1; n <= count; n += 1) {
    await createTask(request, `${prefix} ${String(n)}`);
  }
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

test('loads more tasks when scrolling to the end', async ({
  page,
  request,
}) => {
  const prefix = `Scroll task ${String(Date.now())}`;
  await createTasks(request, prefix, 11);
  await page.goto('/');
  await page.getByRole('heading', { name: `${prefix} 11` }).waitFor();

  await page.keyboard.press('End');

  await expect(page.getByRole('heading', { name: prefix })).toHaveCount(11);
});
