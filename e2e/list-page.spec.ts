import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { gotoHydrated } from './hydration';
import { createTask } from './api';

test.use({ viewport: { width: 1280, height: 400 } });

async function createTasks(
  request: APIRequestContext,
  prefix: string,
  count: number,
) {
  for (let n = 1; n <= count; n += 1) {
    await createTask(request, { title: `${prefix} ${String(n)}` });
  }
}

test('renders a task in the server HTML', async ({ request }) => {
  const title = `SSR task ${String(Date.now())}`;
  await createTask(request, { title });

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
  await createTask(request, { title });
  await gotoHydrated(page, '/');

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
  await gotoHydrated(page, '/');
  await page.getByRole('heading', { name: `${prefix} 11` }).waitFor();

  await page.keyboard.press('End');

  await expect(page.getByRole('heading', { name: prefix })).toHaveCount(11);
});

test('renders a filtered list in the server HTML', async ({ request }) => {
  const stamp = String(Date.now());
  await createTask(request, { title: `Filtered match ${stamp}` });
  await createTask(request, { title: `Filtered other ${stamp}` });

  const response = await request.get(
    `/?titleContains=${encodeURIComponent(`Filtered match ${stamp}`)}`,
  );

  const html = await response.text();
  expect(html).toContain(`Filtered match ${stamp}`);
  expect(html).not.toContain(`Filtered other ${stamp}`);
});

test('does not request task.list on first load of a filtered URL', async ({
  page,
}) => {
  const listRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/trpc/task.list')) {
      listRequests.push(request.url());
    }
  });

  await page.goto(
    '/?titleContains=task&createdFrom=2000-01-01T00%3A00%3A00.000Z',
  );
  await page.waitForLoadState('networkidle');

  expect(listRequests).toEqual([]);
});

test.describe('in a time zone far from the server', () => {
  test.use({ timezoneId: 'Asia/Tokyo' });

  test('loads a URL with a date range without console errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(
      '/?createdFrom=2026-11-19T15%3A00%3A00.000Z&createdBefore=2026-11-20T15%3A00%3A00.000Z',
    );
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
    await expect(page.getByLabel('Created from')).toHaveValue('2026-11-20');
    await expect(page.getByLabel('Created to')).toHaveValue('2026-11-20');
  });
});

test('searches tasks by title', async ({ page, request }) => {
  const stamp = String(Date.now());
  await createTask(request, { title: `Search match ${stamp}` });
  await createTask(request, { title: `Search other ${stamp}` });
  await gotoHydrated(page, '/');

  await page
    .getByRole('searchbox', { name: 'Search by title' })
    .fill(`match ${stamp}`);

  await expect(
    page.getByRole('heading', { name: `Search other ${stamp}` }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: `Search match ${stamp}` }),
  ).toBeVisible();
  await expect(page).toHaveURL(/titleContains=match/);
  await page.reload();
  await expect(
    page.getByRole('searchbox', { name: 'Search by title' }),
  ).toHaveValue(`match ${stamp}`);
  await expect(
    page.getByRole('heading', { name: `Search other ${stamp}` }),
  ).toHaveCount(0);
});

test('filters tasks by creation date', async ({ page, request }) => {
  const title = `Date filter ${String(Date.now())}`;
  await createTask(request, { title });
  await gotoHydrated(page, `/?titleContains=${encodeURIComponent(title)}`);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.getByLabel('Created from').fill('2999-01-01');

  await expect(page.getByText('No tasks match the filters.')).toBeVisible();
  await expect(page.getByRole('heading', { name: title })).toHaveCount(0);
});

test('clears the filters', async ({ page, request }) => {
  const stamp = String(Date.now());
  await createTask(request, { title: `Clear match ${stamp}` });
  await createTask(request, { title: `Clear other ${stamp}` });
  await gotoHydrated(
    page,
    `/?titleContains=${encodeURIComponent(`Clear match ${stamp}`)}`,
  );
  await expect(
    page.getByRole('heading', { name: `Clear other ${stamp}` }),
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Clear filters' }).click();

  await expect(
    page.getByRole('heading', { name: `Clear other ${stamp}` }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('searchbox', { name: 'Search by title' }),
  ).toHaveValue('');
});

test('keeps the header and the filters on screen while scrolling', async ({
  page,
  request,
}) => {
  const prefix = `Sticky task ${String(Date.now())}`;
  await createTasks(request, prefix, 10);
  await gotoHydrated(page, '/');
  await page.getByRole('heading', { name: `${prefix} 10` }).waitFor();

  await page.keyboard.press('End');

  await expect(
    page.getByRole('heading', { name: `${prefix} 1`, exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole('searchbox', { name: 'Search by title' }),
  ).toBeInViewport();
  await expect(page.getByRole('link', { name: 'New task' })).toBeInViewport();
});

test("changes a task's status from the list", async ({ page, request }) => {
  const title = `Status task ${String(Date.now())}`;
  await createTask(request, { title });
  await gotoHydrated(page, `/?titleContains=${encodeURIComponent(title)}`);
  const status = page.getByRole('combobox', { name: `Status of ${title}` });

  await status.selectOption({ label: 'Doing' });

  await expect(page.getByRole('status')).toHaveText('Status updated.');
  await page.reload();
  await expect(status).toHaveValue('doing');
});

test('filters tasks by status', async ({ page, request }) => {
  const stamp = String(Date.now());
  await createTask(request, { title: `Status open ${stamp}` });
  await createTask(request, { title: `Status done ${stamp}`, status: 'done' });
  await gotoHydrated(page, `/?titleContains=${encodeURIComponent(stamp)}`);

  await page.getByRole('radio', { name: 'Done', exact: true }).check();

  await expect(
    page.getByRole('heading', { name: `Status open ${stamp}` }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: `Status done ${stamp}` }),
  ).toBeVisible();
  await expect(page).toHaveURL(/status=done/);
});

test('keeps the focus on the status after a keyboard change', async ({
  page,
  request,
}) => {
  const title = `Keyboard status ${String(Date.now())}`;
  await createTask(request, { title });
  await gotoHydrated(page, `/?titleContains=${encodeURIComponent(title)}`);
  const status = page.getByRole('combobox', { name: `Status of ${title}` });
  await status.focus();

  await page.keyboard.press('ArrowDown');

  await expect(page.getByRole('status')).toHaveText('Status updated.');
  await expect(status).toBeFocused();
  await expect(status).toHaveValue('doing');
});
