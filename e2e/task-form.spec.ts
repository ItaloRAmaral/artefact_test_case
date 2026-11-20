import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { gotoHydrated } from './hydration';

// gotoHydrated waits for a task's date on the list, so these tests make sure there is one.
async function createListedTask(request: APIRequestContext) {
  await request.post('/api/trpc/task.create', {
    data: { title: `Listed task ${String(Date.now())}` },
  });
}

test('creates a task and sees it in the list', async ({ page, request }) => {
  const title = `Form task ${String(Date.now())}`;
  await createListedTask(request);
  await gotoHydrated(page, '/');
  await page.getByRole('link', { name: 'New task' }).click();
  await page.getByLabel('Title', { exact: true }).fill(title);

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('status')).toHaveText('Task created.');
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});

test('opens a fresh form for a second task', async ({ page, request }) => {
  await createListedTask(request);
  await gotoHydrated(page, '/');
  await page.getByRole('link', { name: 'New task' }).click();
  await page
    .getByLabel('Title', { exact: true })
    .fill(`Form task ${String(Date.now())}`);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('link', { name: 'New task' }).click();

  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
});

test('edits a task and sees the change in the list', async ({
  page,
  request,
}) => {
  const title = `Edit task ${String(Date.now())}`;
  const newTitle = `${title} edited`;
  await request.post('/api/trpc/task.create', { data: { title } });
  await gotoHydrated(page, '/');
  await page.getByRole('link', { name: `Edit ${title}` }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill(newTitle);

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('status')).toHaveText('Task saved.');
  await expect(page.getByRole('heading', { name: newTitle })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: title, exact: true }),
  ).toHaveCount(0);
});

test('opens the edit form with the saved values after saving', async ({
  page,
  request,
}) => {
  const title = `Edit task ${String(Date.now())}`;
  const newTitle = `${title} edited`;
  await request.post('/api/trpc/task.create', { data: { title } });
  await gotoHydrated(page, '/');
  await page.getByRole('link', { name: `Edit ${title}` }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill(newTitle);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('link', { name: `Edit ${newTitle}` }).click();

  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
    newTitle,
  );
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
});

test('shows a message for a missing task', async ({ page }) => {
  await page.goto('/tasks/missing-task/edit');

  await expect(page.getByText('This task no longer exists.')).toBeVisible();
});

test('opens the new task form in a modal over the list', async ({
  page,
  request,
}) => {
  await createListedTask(request);
  await gotoHydrated(page, '/');

  await page.getByRole('link', { name: 'New task' }).click();

  await expect(page.getByRole('dialog', { name: 'New task' })).toBeVisible();
  await expect(page).toHaveURL(/\/tasks\/new$/);
  await expect(page.locator('h1', { hasText: 'Tasks' })).toBeVisible();
});

test('closes the modal with Escape', async ({ page, request }) => {
  await createListedTask(request);
  await gotoHydrated(page, '/');
  await page.getByRole('link', { name: 'New task' }).click();
  await expect(page.getByRole('dialog', { name: 'New task' })).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test('edits a task in a modal and keeps the search', async ({
  page,
  request,
}) => {
  const stamp = String(Date.now());
  const title = `Modal edit ${stamp}`;
  const newTitle = `${title} edited`;
  await request.post('/api/trpc/task.create', { data: { title } });
  await request.post('/api/trpc/task.create', {
    data: { title: `Modal other ${stamp}` },
  });
  const search = `?titleContains=${encodeURIComponent(title)}`;
  await gotoHydrated(page, `/${search}`);
  await page.getByRole('link', { name: `Edit ${title}` }).click();
  await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expect(
    page.locator('h2', { hasText: `Modal other ${stamp}` }),
  ).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Title' }).fill(newTitle);

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('status')).toHaveText('Task saved.');
  await expect(page).toHaveURL(`/${search}`);
  await expect(page.getByRole('heading', { name: newTitle })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: `Modal other ${stamp}` }),
  ).toHaveCount(0);
});

test('shows the full page when the form URL is loaded directly', async ({
  page,
}) => {
  await page.goto('/tasks/new');

  await expect(
    page.getByRole('heading', { name: 'New task', level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('opens the modal with the focus on the title', async ({
  page,
  request,
}) => {
  await createListedTask(request);
  await gotoHydrated(page, '/');

  await page.getByRole('link', { name: 'New task' }).click();

  await expect(page.getByRole('textbox', { name: 'Title' })).toBeFocused();
});

test('moves the focus to the title once the task to edit has loaded', async ({
  page,
  request,
}) => {
  const title = `Focus edit ${String(Date.now())}`;
  await request.post('/api/trpc/task.create', { data: { title } });
  await gotoHydrated(page, '/');

  await page.getByRole('link', { name: `Edit ${title}` }).click();

  await expect(page.getByRole('textbox', { name: 'Title' })).toBeFocused();
});

test('keeps the form error region ready for screen readers', async ({
  page,
  request,
}) => {
  await createListedTask(request);
  await gotoHydrated(page, '/');

  await page.getByRole('link', { name: 'New task' }).click();

  await expect(page.getByRole('dialog').getByRole('alert')).toHaveCount(1);
});

test('keeps the list still behind the modal', async ({ page, request }) => {
  for (let n = 1; n <= 10; n += 1) {
    await createListedTask(request);
  }
  await gotoHydrated(page, '/');
  await page.getByRole('link', { name: 'New task' }).click();
  await expect(page.getByRole('dialog', { name: 'New task' })).toBeVisible();

  await page.mouse.wheel(0, 2000);

  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      }),
  );
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('creates a task in a chosen status', async ({ page, request }) => {
  const title = `Doing task ${String(Date.now())}`;
  await createListedTask(request);
  await gotoHydrated(page, '/');
  await page.getByRole('link', { name: 'New task' }).click();
  const dialog = page.getByRole('dialog', { name: 'New task' });
  await dialog.getByLabel('Title', { exact: true }).fill(title);
  await dialog.getByRole('radio', { name: 'Doing', exact: true }).check();

  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('status')).toHaveText('Task created.');
  await expect(
    page.getByRole('combobox', { name: `Status of ${title}` }),
  ).toHaveValue('doing');
});
